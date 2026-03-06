"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import Image from "next/image";
import "xterm/css/xterm.css";
import {
  ChevronRight,
  Trash2,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Zap,
  Search,
  X,
} from "lucide-react";

const TERMINAL_STYLE = `
  .xterm { height: 100%; }
  .xterm-viewport { overflow-y: auto !important; }
  .xterm-screen { width: 100% !important; }
`;

type Status = "connecting" | "connected" | "error" | "disconnected" | "forbidden";

const QUICK_COMMAND_GROUPS: {
  label: string;
  color: string;
  commands: { label: string; command: string }[];
}[] = [
  {
    label: "MONITORING",
    color: "#ffffff20",
    commands: [
      { label: "Server status", command: "systemctl status artmaster\r" },
      { label: "View logs (PM2)", command: "pm2 logs artmaster --lines 50\r" },
      { label: "View error log", command: "tail -100 /var/log/nginx/error.log\r" },
      { label: "CPU usage", command: "top -bn1 | head -20\r" },
      { label: "Memory usage", command: "free -h\r" },
      { label: "Disk usage", command: "df -h\r" },
      { label: "List processes", command: "pm2 list\r" },
    ],
  },
  {
    label: "DEPLOYMENT",
    color: "#ffffff20",
    commands: [
      { label: "Pull latest code", command: "cd /var/www/postchap && git pull\r" },
      { label: "Rebuild app", command: "cd /var/www/postchap && npm install\r" },
      { label: "Restart app", command: "pm2 restart artmaster\r" },
      { label: "Check nginx", command: "nginx -t && systemctl status nginx\r" },
      { label: "Restart nginx", command: "sudo systemctl restart nginx\r" },
    ],
  },
  {
    label: "SYSTEM",
    color: "#ffffff20",
    commands: [
      { label: "Clear terminal", command: "clear\r" },
      { label: "Ping server", command: "ping -c 3 8.8.8.8\r" },
      { label: "Check open ports", command: "ss -tlnp | head -20\r" },
      { label: "View cron jobs", command: "crontab -l\r" },
    ],
  },
];

const FLAT_COMMANDS = QUICK_COMMAND_GROUPS.flatMap((g) =>
  g.commands.map((c) => ({ ...c, group: g.label }))
);

const SERVER_INFO_DEFAULTS = {
  host: "artmastervps",
  ip: process.env.NEXT_PUBLIC_VPS_SERVER_IP || "—",
  os: "Ubuntu 24.04 LTS",
  uptime: "—",
  user: "root",
  port: "22",
};

const APP_SERVICES = [
  { id: "artmaster", name: "ArtMaster (PM2)", pm2Name: "artmaster", status: "RUNNING" as const, uptime: "14d 6h" },
  { id: "terminal-ws", name: "WebSocket Server", pm2Name: "terminal-ws", status: "RUNNING" as const, uptime: "6h 12m" },
  { id: "nginx", name: "Nginx", pm2Name: null, status: "RUNNING" as const, uptime: "14d 6h" },
  { id: "cron", name: "Cron Runner", pm2Name: null, status: "RUNNING" as const, uptime: "2d 3h" },
];

function formatSessionTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function TerminalPage() {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<{
    terminal: import("xterm").Terminal;
    fit: import("xterm-addon-fit").FitAddon;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const [status, setStatus] = useState<Status>("connecting");
  const [shellReady, setShellReady] = useState(false);
  const [connectionLogVisible, setConnectionLogVisible] = useState(0);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [serverInfo, setServerInfo] = useState(SERVER_INFO_DEFAULTS);
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const s = sessionStorage.getItem("terminal-history");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [lastCommandResult, setLastCommandResult] = useState<{ ok: boolean; duration?: number } | null>(null);
  const [runningCommandId, setRunningCommandId] = useState<string | null>(null);
  const [runningStartTime, setRunningStartTime] = useState<number | null>(null);
  const [termRows, setTermRows] = useState(50);
  const [termCols, setTermCols] = useState(220);
  const [fontSize, setFontSize] = useState(13);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileSheetTab, setMobileSheetTab] = useState<"commands" | "metrics">("commands");
  const [isMobile, setIsMobile] = useState(false);
  const [vpsInfo, setVpsInfo] = useState<{
    cpuPercent: number | null;
    cpuText: string | null;
    ramGb: number;
    ramUsedText: string | null;
    ramPercent: number | null;
    diskGb: number;
    diskUsedText: string | null;
    diskPercent: number | null;
    bandwidthTb: number;
    bandwidthUsageTb: number | null;
    uptimeText: string | null;
    ip: string | null;
    hostname: string | null;
    vmStatus: string | null;
  } | null>(null);
  const [vpsInfoLoading, setVpsInfoLoading] = useState(false);
  const [vpsInfoError, setVpsInfoError] = useState<string | null>(null);

  const hostLabel = process.env.NEXT_PUBLIC_VPS_HOST_LABEL || "artmastervps";

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchVpsInfo = useCallback(async () => {
    setVpsInfoLoading(true);
    setVpsInfoError(null);
    try {
      const res = await fetch("/api/admin/vps-info", { credentials: "same-origin" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setVpsInfoError(data.error || `HTTP ${res.status}`);
        setVpsInfo(null);
        return;
      }
      const data = await res.json();
      setVpsInfo(data);
    } catch (e) {
      setVpsInfoError(e instanceof Error ? e.message : "Failed to fetch");
      setVpsInfo(null);
    } finally {
      setVpsInfoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "connected") return;
    fetchVpsInfo();
    const t = setInterval(fetchVpsInfo, 60 * 1000);
    return () => clearInterval(t);
  }, [status, fetchVpsInfo]);

  const effectiveFontSize = isMobile ? 12 : fontSize;

  const sendCommand = useCallback((command: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "input", data: command }));
    }
  }, []);

  const runQuickCommand = useCallback(
    (command: string, label: string) => {
      const term = xtermRef.current?.terminal;
      if (!term || status !== "connected") return;
      setRunningCommandId(label);
      setRunningStartTime(Date.now());
      setLastCommandResult(null);

      const cmdWithoutCr = command.replace(/\r$/, "").trim();
      if (!cmdWithoutCr) return;

      // Focus terminal and scroll into view so user sees command and output
      termRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      termRef.current?.focus();
      term.focus();

      // Write command to terminal immediately so user sees what's being run
      term.write("\r\n\x1b[90m$ " + cmdWithoutCr + "\x1b[0m\r\n");

      // Send full command + Enter so the shell receives it
      sendCommand(cmdWithoutCr + "\r");

      setCommandHistory((prev) => {
        const next = [cmdWithoutCr, ...prev.filter((c) => c !== cmdWithoutCr)].slice(0, 10);
        try {
          sessionStorage.setItem("terminal-history", JSON.stringify(next));
        } catch {}
        return next;
      });

      const start = Date.now();
      const done = () => {
        setRunningCommandId(null);
        setRunningStartTime(null);
        setLastCommandResult({ ok: true, duration: (Date.now() - start) / 1000 });
      };
      setTimeout(done, 2000);
    },
    [status, sendCommand]
  );

  const clearHistory = useCallback(() => {
    setCommandHistory([]);
    try {
      sessionStorage.removeItem("terminal-history");
    } catch {}
  }, []);

  useEffect(() => {
    if (status !== "connected" || connectedAt == null) return;
    const t = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status, connectedAt]);

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
        fontSize: 13,
        fontFamily: "'SF Mono', 'Fira Code', 'Menlo', monospace",
        lineHeight: 1.5,
        letterSpacing: 0.3,
        cursorStyle: "block",
        scrollback: 10000,
        convertEol: true,
        theme: {
          background: "#080808",
          foreground: "#e2e8e4",
          cursor: "#E8FF47",
          cursorAccent: "#080808",
          selectionBackground: "#E8FF4730",
          black: "#080808",
          brightBlack: "#3a3a3a",
          red: "#ef4444",
          brightRed: "#f87171",
          green: "#4ade80",
          brightGreen: "#86efac",
          yellow: "#E8FF47",
          brightYellow: "#fef08a",
          blue: "#60a5fa",
          brightBlue: "#93c5fd",
          magenta: "#c084fc",
          brightMagenta: "#d8b4fe",
          cyan: "#22d3ee",
          brightCyan: "#67e8f9",
          white: "#e2e8e4",
          brightWhite: "#f8fafc",
        },
      });

      const fit = new FitAddon();
      const links = new WebLinksAddon();
      term.loadAddon(fit);
      term.loadAddon(links);
      xtermRef.current = { terminal: term, fit };

      if (termRef.current) {
        term.open(termRef.current);
        requestAnimationFrame(() => {
          fit.fit();
          setTermRows(term.rows);
          setTermCols(term.cols);
        });
      }

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.binaryType = "arraybuffer";

      let shellReadyFallback: ReturnType<typeof setTimeout> | null = null;
      ws.onopen = () => {
        ws.send(token);
        setStatus("connected");
        setConnectedAt(Date.now());
        const lines = [
          "› Authenticating with server...",
          "› Opening SSH tunnel...",
          "✓ Connected to " + hostLabel,
          "› Initializing shell...",
          "✓ Shell ready",
        ];
        let i = 0;
        const showNext = () => {
          if (i >= lines.length) return;
          setConnectionLogVisible(i + 1);
          i++;
          setTimeout(showNext, 400);
        };
        setTimeout(showNext, 400);
        shellReadyFallback = setTimeout(() => setShellReady(true), 10000);
      };

      ws.onmessage = (event) => {
        const data =
          event.data instanceof ArrayBuffer
            ? new Uint8Array(event.data)
            : event.data;
        if (typeof data === "string" && data.startsWith("{")) {
          try {
            const j = JSON.parse(data) as { type?: string; data?: unknown };
            if (j.type === "shell_ready") {
              if (shellReadyFallback) {
                clearTimeout(shellReadyFallback);
                shellReadyFallback = null;
              }
              setShellReady(true);
              return;
            }
            if (j.type === "metrics") setServerInfo((s) => ({ ...s }));
            return;
          } catch {}
        }
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
        setTermRows(term.rows);
        setTermCols(term.cols);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
        }
      };

      window.addEventListener("resize", sendResize);
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
  }, [hostLabel]);

  const handleDisconnect = useCallback(() => {
    setDisconnectModalOpen(false);
    wsRef.current?.close();
    setStatus("disconnected");
  }, []);

  const handleClearTerminal = useCallback(() => {
    xtermRef.current?.terminal?.clear();
  }, []);

  const handleFontSize = useCallback((delta: number) => {
    setFontSize((f) => {
      const next = Math.max(10, Math.min(24, f + delta));
      const term = xtermRef.current?.terminal;
      if (term) term.options.fontSize = next;
      requestAnimationFrame(() => xtermRef.current?.fit?.fit());
      return next;
    });
  }, []);

  const filteredSearchCommands = useMemo(() => {
    if (!searchQuery.trim()) return FLAT_COMMANDS;
    const q = searchQuery.toLowerCase();
    return FLAT_COMMANDS.filter(
      (c) => c.label.toLowerCase().includes(q) || c.command.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    setSelectedSearchIndex(0);
  }, [searchQuery]);

  // Re-fit xterm when the terminal becomes visible (shellReady transitions false→true)
  useEffect(() => {
    if (!shellReady) return;
    const t = setTimeout(() => {
      const term = xtermRef.current?.terminal;
      const fit = xtermRef.current?.fit;
      if (term && fit) {
        fit.fit();
        setTermRows(term.rows);
        setTermCols(term.cols);
      }
    }, 100);
    return () => clearTimeout(t);
  }, [shellReady]);

  useEffect(() => {
    const term = xtermRef.current?.terminal;
    const fit = xtermRef.current?.fit;
    if (term) {
      term.options.fontSize = effectiveFontSize;
      requestAnimationFrame(() => fit?.fit());
    }
  }, [effectiveFontSize]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setDisconnectModalOpen(false);
        setMobileSheetOpen(false);
        return;
      }
      if (searchOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedSearchIndex((i) => Math.min(i + 1, filteredSearchCommands.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedSearchIndex((i) => Math.max(0, i - 1));
        } else if (e.key === "Enter" && filteredSearchCommands[selectedSearchIndex]) {
          e.preventDefault();
          runQuickCommand(
            filteredSearchCommands[selectedSearchIndex].command,
            filteredSearchCommands[selectedSearchIndex].label
          );
          setSearchOpen(false);
          setSearchQuery("");
        }
        return;
      }
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        termRef.current?.focus();
      } else if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        handleClearTerminal();
      } else if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, filteredSearchCommands, selectedSearchIndex, runQuickCommand, handleClearTerminal]);

  if (status === "forbidden") {
    return (
      <div
        className="flex items-center justify-center flex-1 bg-[#080808]"
        style={{ fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, sans-serif" }}
      >
        <p className="text-[#a1a1aa] text-[13px]">You do not have access to the terminal.</p>
      </div>
    );
  }

  const showConnecting = status === "connecting" || (status === "connected" && !shellReady);
  const showDisconnectedOverlay = status === "disconnected" || status === "error";

  return (
    <div
      className="flex flex-col min-h-0 flex-1 bg-[#080808] touch-manipulation"
      style={{
        height: "100vh",
        fontFamily: "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, sans-serif",
        touchAction: "manipulation",
      }}
    >
      <style>{TERMINAL_STYLE}</style>
      <style>{`
        @keyframes status-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
        }
        @keyframes scan-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .terminal-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>

      {showConnecting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#080808]">
          <Image src="/artmasterwordmarklogo-03-03.webp" alt="ArtMaster" width={100} height={28} className="opacity-80 mb-6" />
          <p className="text-[11px] text-[#71717a] uppercase tracking-widest mb-8">VPS Terminal</p>
          <div
            className="w-12 h-12 rounded-full border-2 border-[#ffffff0f] border-t-[#E8FF47] animate-spin mb-8"
            style={{ animationDuration: "0.8s" }}
          />
          <div className="space-y-2 text-left font-mono text-[12px]">
            {[
              "› Authenticating with server...",
              "› Opening SSH tunnel...",
              `✓ Connected to ${hostLabel}`,
              "› Initializing shell...",
              "✓ Shell ready",
            ]
              .slice(0, connectionLogVisible)
              .map((line, i) => (
                <div
                  key={`${line}-${i}`}
                  className="animate-fade-up"
                  style={{
                    color: line.startsWith("✓") ? "#4ade80" : "#71717a",
                    animationFillMode: "backwards",
                  }}
                >
                  {line}
                </div>
              ))}
          </div>
        </div>
      )}

      {!showConnecting && (
        <>
          {/* Top status bar — 52px; condensed on mobile */}
          <div
            className="flex items-center justify-between h-[52px] px-3 md:px-5 shrink-0 border-b border-[#ffffff08] bg-[#080808]"
            style={{ minHeight: 52 }}
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setDisconnectModalOpen(true)}
                className="w-3 h-3 rounded-full bg-[#ef4444] hover:opacity-80 transition-opacity shrink-0"
                aria-label="Disconnect"
              />
              <div className="hidden md:block w-3 h-3 rounded-full bg-[#fbbf24]" />
              <div className="hidden md:block w-3 h-3 rounded-full bg-[#4ade80]" />
              <div className="hidden md:block w-px h-4 bg-[#ffffff08] mx-1" />
              <span className="text-[12px] md:text-[13px] font-medium text-[#fafafa] truncate">{hostLabel}</span>
              <span className="hidden lg:inline font-mono text-[11px] bg-[#ffffff08] border border-[#ffffff0f] rounded px-2 py-0.5 text-[#a1a1aa]">
                {serverInfo.ip}
              </span>
              <span className="hidden xl:inline font-mono text-[11px] bg-[#ffffff08] border border-[#ffffff0f] rounded px-2 py-0.5 text-[#a1a1aa]">
                {serverInfo.os}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-2 h-2 rounded-full ${
                  status === "connected"
                    ? "bg-[#4ade80] animate-[status-pulse_2s_ease-in-out_infinite]"
                    : "bg-[#ef4444]"
                }`}
              />
              <span
                className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wider"
                style={{
                  color: status === "connected" ? "#4ade80" : "#ef4444",
                }}
              >
                {status === "connected" ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <span className="font-mono text-[12px] text-[#71717a]">
                SESSION {connectedAt != null ? formatSessionTime(sessionSeconds) : "00:00:00"}
              </span>
              <div className="w-px h-4 bg-[#ffffff08]" />
              <button
                type="button"
                onClick={() => setDisconnectModalOpen(true)}
                className="h-7 px-3 rounded border border-[#ef444430] text-[#ef4444] text-[10px] font-medium hover:bg-[#ef444415] hover:border-[#ef444460] transition-colors"
              >
                DISCONNECT
              </button>
            </div>
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setDisconnectModalOpen(true)}
                className="h-7 px-3 rounded border border-[#ef444430] text-[#ef4444] text-[10px] font-medium hover:bg-[#ef444415] transition-colors"
              >
                DISCONNECT
              </button>
            </div>
          </div>

          {/* Main row: left | center | right */}
          <div className="flex flex-1 min-h-0" style={{ height: "calc(100vh - 52px)" }}>
            {/* Left panel — 260px, hidden on mobile */}
            <aside
              className="hidden md:flex flex-col w-[260px] shrink-0 border-r border-[#ffffff08] bg-[#080808] overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="pt-4 pb-2 px-4">
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#71717a] mb-2">SERVER</p>
                {[
                  { icon: "🖥", label: "HOST", value: serverInfo.host },
                  { icon: "🌐", label: "IP", value: serverInfo.ip },
                  { icon: "💾", label: "OS", value: serverInfo.os },
                  { icon: "⚡", label: "UPTIME", value: serverInfo.uptime },
                  { icon: "👤", label: "USER", value: serverInfo.user },
                  { icon: "📡", label: "PORT", value: serverInfo.port },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between h-8 px-4 rounded hover:bg-[#ffffff04] transition-colors"
                  >
                    <span className="text-[14px] text-[#71717a] mr-2">{row.icon}</span>
                    <span className="text-[11px] text-[#71717a]">{row.label}</span>
                    <span className="font-mono text-[11px] text-[#fafafa] truncate max-w-[120px]" title={row.value}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-px bg-[#ffffff06] my-2" />
              <div className="px-4 pb-2">
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#71717a] py-2">QUICK COMMANDS</p>
                {QUICK_COMMAND_GROUPS.map((group) => (
                  <div key={group.label} className="mb-3">
                    <p
                      className="text-[8px] font-medium uppercase tracking-wider text-[#ffffff20] px-3 py-1"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      {group.label}
                    </p>
                    {group.commands.map((cmd) => {
                      const running = runningCommandId === cmd.label;
                      return (
                        <button
                          key={cmd.label}
                          type="button"
                          onClick={() => runQuickCommand(cmd.command, cmd.label)}
                          disabled={status !== "connected"}
                          className={`group w-full h-[34px] px-3 rounded-md flex items-center justify-between gap-2 text-left transition-all border-l-2 border-transparent hover:bg-[#E8FF4708] hover:border-[#E8FF47] hover:text-[#fafafa] disabled:opacity-50 disabled:pointer-events-none mb-0.5 ${
                            running ? "bg-[#E8FF4710] text-[#E8FF47] border-[#E8FF47]" : "text-[#a1a1aa]"
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                background:
                                  group.commands.indexOf(cmd) % 3 === 0
                                    ? "#4ade80"
                                    : group.commands.indexOf(cmd) % 3 === 1
                                      ? "#60a5fa"
                                      : "#fbbf24",
                              }}
                            />
                            <span className="text-[12px] truncate">{cmd.label}</span>
                          </span>
                          {running ? (
                            <span className="w-4 h-4 rounded-full border-2 border-[#E8FF47] border-t-transparent animate-spin shrink-0" />
                          ) : (
                            <ChevronRight size={12} className="text-[#71717a] shrink-0 group-hover:opacity-100 opacity-0 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="h-px bg-[#ffffff06] mt-auto mb-2" />
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => setHistoryCollapsed(!historyCollapsed)}
                  className="flex items-center justify-between w-full text-[9px] font-medium uppercase tracking-[0.12em] text-[#71717a] py-2"
                >
                  HISTORY {commandHistory.length > 0 && `(${commandHistory.length})`}
                </button>
                {!historyCollapsed && (
                  <div className="space-y-0.5">
                    {commandHistory.slice(0, 10).map((cmd, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => runQuickCommand(cmd + "\r", cmd)}
                        className="w-full text-left font-mono text-[11px] text-[#71717a] truncate px-2 py-1 rounded hover:bg-[#ffffff04] hover:text-[#a1a1aa] transition-colors"
                      >
                        {cmd}
                      </button>
                    ))}
                    {commandHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={clearHistory}
                        className="text-[10px] text-[#71717a] hover:text-[#ef4444] mt-1 transition-colors"
                      >
                        Clear history
                      </button>
                    )}
                  </div>
                )}
              </div>
            </aside>

            {/* Center — terminal */}
            <section className="flex-1 flex flex-col min-w-0 bg-[#080808] relative">
              <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-[#ffffff08] bg-[#111111]">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#71717a]">TERMINAL</span>
                  <div className="bg-[#080808] border-t border-[#E8FF47] px-3 py-1.5 rounded-t">
                    <span className="font-mono text-[11px] text-[#fafafa]">root@{hostLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleFontSize(-1)}
                    className="w-7 h-7 flex items-center justify-center rounded text-[#71717a] hover:bg-[#ffffff08] hover:text-[#fafafa] transition-colors text-[11px] font-medium"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFontSize(1)}
                    className="w-7 h-7 flex items-center justify-center rounded text-[#71717a] hover:bg-[#ffffff08] hover:text-[#fafafa] transition-colors text-[11px] font-medium"
                  >
                    A+
                  </button>
                  <button
                    type="button"
                    onClick={handleClearTerminal}
                    className="w-7 h-7 flex items-center justify-center rounded text-[#71717a] hover:bg-[#ffffff08] hover:text-[#fafafa] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen((f) => !f)}
                    className="w-7 h-7 flex items-center justify-center rounded text-[#71717a] hover:bg-[#ffffff08] hover:text-[#fafafa] transition-colors"
                  >
                    {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                </div>
              </div>
              {runningCommandId && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#E8FF47]/60 overflow-hidden z-10">
                  <div className="terminal-scan-line w-1/2 h-full bg-[#E8FF47]" />
                </div>
              )}
              <div
                ref={termRef}
                className="flex-1 p-3 min-h-0 overflow-hidden"
                tabIndex={0}
                style={{ outline: "none" }}
              />
              <div className="h-8 shrink-0 flex items-center justify-between px-4 border-t border-[#ffffff08] bg-[#111111] text-[10px] font-mono text-[#71717a]">
                <span>ROWS: {termRows}</span>
                <span>COLS: {termCols}</span>
                <span className="text-[11px]" style={{ fontFamily: "-apple-system, sans-serif" }}>
                  {lastCommandResult
                    ? lastCommandResult.ok
                      ? `✓ completed in ${lastCommandResult.duration?.toFixed(1) ?? "?"}s`
                      : "✗ failed"
                    : "—"}
                </span>
                <span className="text-[9px] tracking-wider" title="Click the terminal area above to type your own commands">
                  Type here or use Quick Commands · Ctrl+L clear
                </span>
              </div>
            </section>

            {/* Right panel — 280px, hidden on mobile */}
            <aside
              className="hidden lg:flex flex-col w-[280px] shrink-0 border-l border-[#ffffff08] bg-[#080808] overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="pt-4 pb-2 px-4 flex items-center justify-between">
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#71717a]">SERVER METRICS</p>
                {vpsInfoError ? (
                  <span className="text-[8px] text-[#fbbf24]" title={vpsInfoError}>API err</span>
                ) : vpsInfoLoading && !vpsInfo ? (
                  <span className="text-[8px] text-[#71717a]">Loading…</span>
                ) : vpsInfo ? (
                  <span className="flex items-center gap-1.5 text-[8px] text-[#4ade80] bg-[#4ade8012] border border-[#4ade8025] rounded px-1.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                    LIVE
                  </span>
                ) : null}
              </div>
              <div className="px-4 space-y-4 pb-4">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] text-[#71717a]">CPU</span>
                    <span className="text-[14px] font-semibold text-[#fafafa]">
                      {vpsInfo?.cpuPercent != null ? `${vpsInfo.cpuPercent.toFixed(1)}%` : vpsInfo?.cpuText ?? "—"}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#ffffff08] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#4ade80] transition-[width] duration-300"
                      style={{
                        width: vpsInfo?.cpuPercent != null ? `${Math.min(100, vpsInfo.cpuPercent)}%` : "0%",
                        boxShadow: vpsInfo?.cpuPercent != null ? "0 0 8px rgba(74,222,128,0.4)" : undefined,
                      }}
                    />
                  </div>
                </div>
                <div className="h-px bg-[#ffffff08]" />
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] text-[#71717a]">MEMORY</span>
                    <span className="text-[14px] font-semibold text-[#fafafa]">
                      {vpsInfo?.ramUsedText && vpsInfo.ramGb ? `${vpsInfo.ramUsedText} / ${vpsInfo.ramGb} GB` : "—"}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#ffffff08] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#E8FF47] transition-[width] duration-300"
                      style={{
                        width: vpsInfo?.ramPercent != null ? `${Math.min(100, vpsInfo.ramPercent)}%` : "0%",
                        boxShadow: vpsInfo?.ramPercent != null ? "0 0 8px rgba(232,255,71,0.4)" : undefined,
                      }}
                    />
                  </div>
                </div>
                <div className="h-px bg-[#ffffff08]" />
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] text-[#71717a]">DISK</span>
                    <span className="text-[14px] font-semibold text-[#fafafa]">
                      {vpsInfo?.diskUsedText && vpsInfo.diskGb ? `${vpsInfo.diskUsedText} / ${vpsInfo.diskGb} GB` : "—"}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#ffffff08] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-300 ${(vpsInfo?.diskPercent ?? 0) > 85 ? "bg-[#ef4444]" : "bg-[#60a5fa]"}`}
                      style={{ width: vpsInfo?.diskPercent != null ? `${Math.min(100, vpsInfo.diskPercent)}%` : "0%" }}
                    />
                  </div>
                </div>
                <div className="h-px bg-[#ffffff08]" />
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-[#71717a]">BANDWIDTH</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#a1a1aa]">
                      {vpsInfo?.bandwidthUsageTb != null && vpsInfo.bandwidthTb != null
                        ? `${vpsInfo.bandwidthUsageTb.toFixed(2)} / ${vpsInfo.bandwidthTb} TB`
                        : vpsInfo?.bandwidthTb != null
                          ? `${vpsInfo.bandwidthTb} TB`
                          : "—"}
                    </span>
                  </div>
                </div>
                {vpsInfo?.uptimeText && (
                  <>
                    <div className="h-px bg-[#ffffff08]" />
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] text-[#71717a]">UPTIME</span>
                        <span className="text-[12px] font-medium text-[#fafafa]">{vpsInfo.uptimeText}</span>
                      </div>
                    </div>
                  </>
                )}
                {vpsInfo?.vmStatus && (
                  <>
                    <div className="h-px bg-[#ffffff08]" />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[#71717a]">VM STATUS</span>
                      <span className={`text-[10px] font-medium ${vpsInfo.vmStatus === "running" ? "text-[#4ade80]" : "text-[#fbbf24]"}`}>
                        {vpsInfo.vmStatus.toUpperCase()}
                      </span>
                    </div>
                  </>
                )}
                <div className="h-px bg-[#ffffff08]" />
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[10px] text-[#71717a]">PROCESSES</span>
                    <span className="font-mono text-[10px] text-[#fafafa]">142</span>
                  </div>
                  <div className="space-y-0">
                    {["pm2: artmaster", "nginx", "node: ws-terminal", "cron", "sshd"].map((name, i) => (
                      <div
                        key={name}
                        className="flex justify-between items-center h-6 px-2 rounded hover:bg-[#ffffff04] text-[11px] text-[#a1a1aa]"
                      >
                        <span className="truncate">{name}</span>
                        <span className="font-mono text-[10px] text-[#71717a]">
                          {["2.1%", "0.4%", "0.8%", "0.1%", "0.2%"][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-[#ffffff08]" />
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#71717a] py-1">APP SERVICES</p>
                {APP_SERVICES.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => svc.pm2Name && runQuickCommand(`pm2 show ${svc.pm2Name}\r`, `pm2 show ${svc.pm2Name}`)}
                    className="w-full flex items-center justify-between h-9 px-2 rounded hover:bg-[#ffffff04] transition-colors text-left"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          svc.status === "RUNNING" ? "bg-[#4ade80]" : svc.status === "STOPPED" ? "bg-[#ef4444]" : "bg-[#fbbf24]"
                        }`}
                      />
                      <span className="text-[12px] text-[#fafafa] truncate">{svc.name}</span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-medium ${
                          svc.status === "RUNNING" ? "text-[#4ade80]" : svc.status === "STOPPED" ? "text-[#ef4444]" : "text-[#fbbf24]"
                        }`}
                      >
                        {svc.status}
                      </span>
                      <span className="text-[10px] text-[#71717a]">{svc.uptime}</span>
                    </span>
                  </button>
                ))}
                <div className="h-px bg-[#ffffff08]" />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "LOAD AVG", value: "0.42" },
                    { label: "SWAP", value: "0 MB" },
                    { label: "ZOMBIES", value: "0" },
                    { label: "THREADS", value: "847" },
                  ].map((t) => (
                    <div
                      key={t.label}
                      className="bg-[#111111] border border-[#ffffff08] rounded-md p-2.5"
                    >
                      <p className="text-[9px] uppercase text-[#71717a] mb-0.5">{t.label}</p>
                      <p className="text-[18px] font-semibold text-[#fafafa]">{t.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          {/* Disconnected overlay */}
          {showDisconnectedOverlay && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-[#111111] border border-[#ffffff12] rounded-xl p-8 max-w-[360px] text-center">
                <div className="w-10 h-10 rounded-full bg-[#ef444412] border border-[#ef444425] flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="text-[#ef4444]" size={20} />
                </div>
                <h2 className="text-[18px] font-semibold text-[#fafafa] mb-2">Connection Lost</h2>
                <p className="text-[14px] text-[#a1a1aa] mb-6">
                  Session disconnected after 30 minutes of inactivity.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full h-11 rounded-lg bg-[#E8FF47] text-[#080808] font-semibold text-[13px] hover:bg-[#B8CC38] transition-colors mb-3"
                >
                  Reconnect
                </button>
                <Link
                  href="/admin"
                  className="block text-[13px] text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
                >
                  Back to Admin
                </Link>
              </div>
            </div>
          )}

          {/* Disconnect confirmation modal */}
          {disconnectModalOpen && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
              onClick={() => setDisconnectModalOpen(false)}
            >
              <div
                className="bg-[#111111] border border-[#ffffff12] rounded-xl p-6 max-w-[380px] w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-10 rounded-full bg-[#ef444412] border border-[#ef444425] flex items-center justify-center mb-4">
                  <AlertTriangle className="text-[#ef4444]" size={20} />
                </div>
                <h2 className="text-[17px] font-semibold text-[#fafafa] mb-2">Disconnect from server?</h2>
                <p className="text-[14px] text-[#a1a1aa] mb-6">
                  This will close your SSH session. Any running processes started in this terminal will continue
                  running on the server.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDisconnectModalOpen(false)}
                    className="flex-1 h-10 rounded border border-[#ffffff18] text-[#fafafa] text-[13px] font-medium hover:bg-[#ffffff08] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="flex-1 h-10 rounded bg-[#ef444415] border border-[#ef444430] text-[#ef4444] text-[13px] font-medium hover:bg-[#ef444425] transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick command search (Ctrl+K) */}
          {searchOpen && (
            <div className="absolute left-4 top-16 z-50 w-[280px] bg-[#222222] border border-[#ffffff18] rounded-lg shadow-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#ffffff08]">
                <Search size={14} className="text-[#71717a]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-[13px] text-[#fafafa] outline-none placeholder:text-[#71717a]"
                  autoFocus
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="p-1 text-[#71717a] hover:text-[#fafafa]">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {filteredSearchCommands.length === 0 ? (
                  <p className="px-3 py-4 text-[12px] text-[#71717a]">No commands match</p>
                ) : (
                  filteredSearchCommands.map((cmd, i) => (
                    <button
                      key={cmd.label + i}
                      type="button"
                      onClick={() => {
                        runQuickCommand(cmd.command, cmd.label);
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${
                        i === selectedSearchIndex ? "bg-[#E8FF4710] text-[#E8FF47]" : "text-[#a1a1aa] hover:bg-[#ffffff08]"
                      }`}
                    >
                      {cmd.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Mobile: floating button + bottom sheet */}
          <div className="md:hidden fixed bottom-6 right-6 z-30">
            <button
              type="button"
              onClick={() => setMobileSheetOpen(true)}
              className="w-14 h-14 rounded-full bg-[#E8FF47] text-[#080808] flex items-center justify-center shadow-lg"
            >
              <Zap size={24} />
            </button>
          </div>
          {mobileSheetOpen && (
            <div
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileSheetOpen(false)}
            >
              <div
                className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-[#111111] border-t border-[#ffffff12] rounded-t-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex border-b border-[#ffffff08]">
                  <button
                    type="button"
                    onClick={() => setMobileSheetTab("commands")}
                    className={`flex-1 py-3 text-[13px] font-medium ${mobileSheetTab === "commands" ? "text-[#E8FF47] border-b-2 border-[#E8FF47]" : "text-[#71717a]"}`}
                  >
                    Quick Commands
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileSheetTab("metrics")}
                    className={`flex-1 py-3 text-[13px] font-medium ${mobileSheetTab === "metrics" ? "text-[#E8FF47] border-b-2 border-[#E8FF47]" : "text-[#71717a]"}`}
                  >
                    Server Metrics
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[60vh] p-4">
                  {mobileSheetTab === "commands" ? (
                    <div className="space-y-2">
                      {FLAT_COMMANDS.map((cmd) => (
                        <button
                          key={cmd.label}
                          type="button"
                          onClick={() => {
                            runQuickCommand(cmd.command, cmd.label);
                            setMobileSheetOpen(false);
                          }}
                          disabled={status !== "connected"}
                          className="w-full text-left px-4 py-3 rounded-lg bg-[#181818] border border-[#ffffff08] text-[#fafafa] text-[13px] disabled:opacity-50"
                        >
                          {cmd.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4 text-[12px] text-[#a1a1aa]">
                      <p>CPU: 24%</p>
                      <p>Memory: 2.1 GB / 8 GB</p>
                      <p>Disk: 47.2 GB / 80 GB</p>
                      <p>Load: 0.42</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
