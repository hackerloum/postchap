"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "xterm/css/xterm.css";

// Fix xterm canvas sizing inside flex containers
const TERMINAL_STYLE = `
  .xterm { height: 100%; }
  .xterm-viewport { overflow-y: auto !important; }
  .xterm-screen { width: 100% !important; }
`;

type Status = "connecting" | "connected" | "error" | "disconnected" | "forbidden";

const QUICK_COMMANDS = [
  { label: "Server status", command: "systemctl status artmaster\r" },
  { label: "View logs", command: "pm2 logs artmaster --lines 50\r" },
  { label: "Restart app", command: "pm2 restart artmaster\r" },
  { label: "Disk usage", command: "df -h\r" },
  { label: "Memory usage", command: "free -h\r" },
  { label: "CPU usage", command: "top -bn1 | head -20\r" },
  { label: "List processes", command: "pm2 list\r" },
  { label: "Pull latest code", command: "cd /var/www/postchap && git pull\r" },
  { label: "Rebuild app", command: "cd /var/www/postchap && npm install\r" },
  { label: "Check nginx", command: "nginx -t && systemctl status nginx\r" },
  { label: "View error log", command: "tail -f /var/log/nginx/error.log\r" },
];

export default function TerminalPage() {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<{ terminal: import("xterm").Terminal; fit: import("xterm-addon-fit").FitAddon } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<Status>("connecting");

  const sendCommand = useCallback((command: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "input", data: command }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const res = await fetch("/api/admin/terminal-token", { credentials: "same-origin" });
      if (!mounted) return;
      if (!res.ok) {
        setStatus("forbidden");
        return;
      }
      const body = await res.json();
      const token = body?.token;
      if (!token || !mounted) return;

      const { Terminal } = await import("xterm");
      const { FitAddon } = await import("xterm-addon-fit");
      const { WebLinksAddon } = await import("xterm-addon-web-links");

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "'DM Mono', 'Fira Code', monospace",
        theme: {
          background: "#0a0a0a",
          foreground: "#e8e0d4",
          cursor: "#e8ff47",
          cursorAccent: "#0a0a0a",
          black: "#0a0a0a",
          brightBlack: "#444444",
          red: "#ef4444",
          brightRed: "#f87171",
          green: "#4ade80",
          brightGreen: "#86efac",
          yellow: "#e8ff47",
          brightYellow: "#fef08a",
          blue: "#818cf8",
          brightBlue: "#a5b4fc",
          magenta: "#c084fc",
          brightMagenta: "#d8b4fe",
          cyan: "#67e8f9",
          brightCyan: "#a5f3fc",
          white: "#e8e0d4",
          brightWhite: "#f5f0eb",
        },
        scrollback: 5000,
        convertEol: true,
      });

      const fit = new FitAddon();
      const links = new WebLinksAddon();
      term.loadAddon(fit);
      term.loadAddon(links);
      xtermRef.current = { terminal: term, fit };

      if (termRef.current) {
        term.open(termRef.current);
        // Defer fit so the DOM has finished laying out
        requestAnimationFrame(() => { fit.fit(); });
      }

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        ws.send(token);
        setStatus("connected");
      };

      ws.onmessage = (event) => {
        const data = event.data instanceof ArrayBuffer
          ? new Uint8Array(event.data)
          : event.data;
        term.write(data as string | Uint8Array);
      };

      ws.onclose = () => {
        setStatus("disconnected");
        term.write("\r\n\x1b[33mDisconnected from server.\x1b[0m\r\n");
      };

      ws.onerror = () => {
        setStatus("error");
        term.write("\r\n\x1b[31mConnection error.\x1b[0m\r\n");
      };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "input", data }));
        }
      });

      const sendResize = () => {
        fit.fit();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
        }
      };

      window.addEventListener("resize", sendResize);

      // Also watch the terminal container for size changes (e.g. sidebar open/close)
      let ro: ResizeObserver | null = null;
      if (termRef.current && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => sendResize());
        ro.observe(termRef.current);
      }

      cleanupRef.current = () => {
        window.removeEventListener("resize", sendResize);
        ro?.disconnect();
      };
    }

    init();

    return () => {
      mounted = false;
      cleanupRef.current?.();
      cleanupRef.current = null;
      wsRef.current?.close();
      wsRef.current = null;
      xtermRef.current?.terminal?.dispose();
      xtermRef.current = null;
    };
  }, []);

  if (status === "forbidden") {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-base">
        <p className="text-text-secondary">You do not have access to the terminal.</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{
        height: "100vh",
        background: "#0a0a0a",
        fontFamily: "'DM Mono', monospace",
        overflow: "hidden",
      }}
    >
      <style>{TERMINAL_STYLE}</style>
      <div
        className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
        style={{
          background: "#111111",
          borderColor: "#1e1e1e",
        }}
      >
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#fbbf24" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#4ade80" }} />
        </div>
        <div className="flex-1 text-center text-[11px]" style={{ color: "#555" }}>
          ArtMaster Admin — VPS Terminal — {process.env.NEXT_PUBLIC_VPS_HOST_LABEL || "eVPS Server"}
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background:
                status === "connected"
                  ? "#4ade80"
                  : status === "connecting"
                    ? "#fbbf24"
                    : status === "error"
                      ? "#ef4444"
                      : "#555",
              boxShadow: status === "connected" ? "0 0 6px #4ade80" : "none",
            }}
          />
          <span className="text-[10px] uppercase" style={{ color: "#555" }}>
            {status}
          </span>
        </div>
        {(status === "disconnected" || status === "error") && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1 rounded text-[10px] cursor-pointer border"
            style={{
              background: "#1e1e1e",
              borderColor: "#333",
              color: "#e8ff47",
              letterSpacing: "0.08em",
            }}
          >
            RECONNECT
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className="shrink-0 w-48 flex flex-col gap-1 p-2 overflow-y-auto border-r"
          style={{ background: "#111", borderColor: "#1e1e1e" }}
        >
          <div className="text-[10px] uppercase font-semibold px-2 py-1" style={{ color: "#555" }}>
            Quick commands
          </div>
          {QUICK_COMMANDS.map(({ label, command }) => (
            <button
              key={label}
              type="button"
              onClick={() => sendCommand(command)}
              disabled={status !== "connected"}
              className="text-left px-2 py-1.5 rounded text-[11px] truncate disabled:opacity-50 hover:bg-white/10 transition-colors"
              style={{ color: "#e8e0d4" }}
              title={command.trim()}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          ref={termRef}
          style={{
            flex: 1,
            padding: "8px",
            overflow: "hidden",
            minWidth: 0,
            minHeight: 0,
          }}
        />
      </div>
    </div>
  );
}
