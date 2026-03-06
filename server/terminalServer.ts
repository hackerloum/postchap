/**
 * Standalone WebSocket server for browser SSH terminal.
 * Run alongside Next.js (e.g. node server/terminalServer.js or tsx server/terminalServer.ts).
 * Loads .env.local from project root so VPS_* and TERMINAL_JWT_SECRET are set.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) (process.env as Record<string, string>)[key] = val;
  }
} catch {
  // .env.local not found — rely on existing env vars
}

import { WebSocketServer, WebSocket } from "ws";
import { Client as SSHClient } from "ssh2";
import jwt from "jsonwebtoken";

const PORT = parseInt(process.env.TERMINAL_WS_PORT || "3001", 10);
const MAX_CONCURRENT = 3;
const MAX_PER_USER = 1;
const INACTIVITY_MS = 30 * 60 * 1000;

type SessionMeta = { uid: string };
const sessionsByUid = new Map<string, Set<WebSocket>>();
let totalConnections = 0;

function registerSession(uid: string, ws: WebSocket): boolean {
  const existing = sessionsByUid.get(uid);
  if (existing && existing.size >= MAX_PER_USER) return false;
  if (totalConnections >= MAX_CONCURRENT) return false;
  if (!existing) sessionsByUid.set(uid, new Set([ws]));
  else existing.add(ws);
  totalConnections++;
  return true;
}

function unregisterSession(uid: string, ws: WebSocket): void {
  const set = sessionsByUid.get(uid);
  if (set) {
    set.delete(ws);
    if (set.size === 0) sessionsByUid.delete(uid);
  }
  totalConnections = Math.max(0, totalConnections - 1);
}

const wss = new WebSocketServer({ port: PORT });

interface ShellStream {
  on(event: string, cb: (...args: unknown[]) => void): void;
  write(data: string): void;
  setWindow(rows: number, cols: number, height: number, width: number): void;
  close?(): void;
}

wss.on("connection", (ws: WebSocket) => {
  let ssh: SSHClient | null = null;
  let stream: ShellStream | null = null;
  let meta: SessionMeta | null = null;
  let inactivityTimeout: ReturnType<typeof setTimeout> | null = null;

  function resetInactivity() {
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("\r\n\x1b[33mSession timeout after 30 minutes.\x1b[0m\r\n");
        ws.close();
      }
    }, INACTIVITY_MS);
  }

  // First message must be the JWT token
  ws.once("message", (tokenBuffer: Buffer | ArrayBuffer | string) => {
    const token = typeof tokenBuffer === "string"
      ? tokenBuffer
      : Buffer.from(Buffer.isBuffer(tokenBuffer) ? tokenBuffer : new Uint8Array(tokenBuffer as ArrayBuffer)).toString("utf8");
    let decoded: { uid?: string; role?: string; purpose?: string };
    try {
      decoded = jwt.verify(token, process.env.TERMINAL_JWT_SECRET!) as typeof decoded;
      if (!decoded?.uid) throw new Error("missing uid");
      meta = { uid: decoded.uid };
    } catch {
      ws.send("\r\n\x1b[31mUnauthorized. Connection closed.\x1b[0m\r\n");
      ws.close();
      return;
    }

    if (!registerSession(decoded.uid, ws)) {
      ws.send("\r\n\x1b[31mRate limit: max 3 sessions total, 1 per user.\x1b[0m\r\n");
      ws.close();
      return;
    }

    resetInactivity();

    ssh = new SSHClient();

    ssh.on("ready", () => {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send("\r\n\x1b[32m✓ Connected to VPS\x1b[0m\r\n");

      const pty = { term: "xterm-256color", cols: 220, rows: 50 };
      ssh!.shell(pty, (err: Error | undefined, shellStream: import("ssh2").ClientChannel) => {
          if (err) {
            ws.send(`\r\n\x1b[31mShell error: ${err.message}\x1b[0m\r\n`);
            ws.close();
            return;
          }

          stream = shellStream as ShellStream;

          stream.on("data", (data: unknown) => {
            if (ws.readyState === WebSocket.OPEN) {
              const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
              ws.send(buf);
            }
          });

          stream.on("close", () => {
            ws.send("\r\n\x1b[33mConnection closed.\x1b[0m\r\n");
            ws.close();
            ssh?.end();
          });

          ws.on("message", (msg: Buffer | ArrayBuffer | string) => {
            resetInactivity();
            const raw = typeof msg === "string"
              ? msg
              : Buffer.from(Buffer.isBuffer(msg) ? msg : new Uint8Array(msg as ArrayBuffer)).toString("utf8");
            try {
              const data = JSON.parse(raw) as { type?: string; data?: string; rows?: number; cols?: number };
              if (data.type === "input" && data.data != null && stream) {
                stream.write(data.data);
              }
              if (data.type === "resize" && typeof data.rows === "number" && typeof data.cols === "number" && stream) {
                stream.setWindow(data.rows, data.cols, 0, 0);
              }
            } catch {
              // ignore non-JSON (e.g. legacy raw input)
            }
          });
      });
    });

    ssh.on("error", (err: Error) => {
      ws.send(`\r\n\x1b[31mSSH Error: ${err.message}\x1b[0m\r\n`);
      ws.close();
    });

    const connectOpts: import("ssh2").ConnectConfig = {
      host: process.env.VPS_HOST!,
      port: parseInt(process.env.VPS_PORT || "22", 10),
      username: process.env.VPS_USERNAME!,
      readyTimeout: 10000,
    };
    if (process.env.VPS_PRIVATE_KEY) {
      connectOpts.privateKey = Buffer.from(process.env.VPS_PRIVATE_KEY, "base64").toString("utf8");
    } else if (process.env.VPS_PASSWORD) {
      connectOpts.password = process.env.VPS_PASSWORD;
    }
    ssh.connect(connectOpts);
  });

  ws.on("close", () => {
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    if (stream?.close) stream.close();
    ssh?.end();
    if (meta) unregisterSession(meta.uid, ws);
  });
});

console.log(`Terminal WebSocket server running on port ${PORT}`);
