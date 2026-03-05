"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Sparkles, UserPlus } from "lucide-react";

const BREADCRUMB: Record<string, string> = {
  "/studio": "OVERVIEW",
  "/studio/clients": "CLIENTS",
  "/studio/create": "GENERATE",
  "/studio/posters": "POSTERS",
  "/studio/usage": "USAGE",
  "/studio/team": "TEAM",
  "/studio/settings": "SETTINGS",
  "/studio/billing": "BILLING",
  "/studio/occasions": "OCCASIONS",
};

function getBreadcrumb(pathname: string): string {
  if (pathname === "/studio") return "OVERVIEW";
  for (const [path, label] of Object.entries(BREADCRUMB)) {
    if (path !== "/studio" && pathname.startsWith(path)) return label;
  }
  if (pathname.startsWith("/studio/clients/new")) return "CLIENTS";
  if (pathname.includes("/studio/clients/") && pathname.includes("/brand-kits")) return "CLIENTS";
  if (pathname.includes("/studio/clients/")) return "CLIENTS";
  return "OVERVIEW";
}

export function StudioTopBar() {
  const pathname = usePathname();
  const page = getBreadcrumb(pathname);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between h-14 px-6 border-b backdrop-blur-[20px]"
      style={{
        background: "rgba(15, 13, 11, 0.8)",
        borderColor: "var(--studio-topbar-border)",
      }}
    >
      <p
        className="studio-font-ui text-[10px] tracking-[0.2em]"
        style={{ color: "var(--studio-text-muted)" }}
      >
        STUDIO / {page}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative p-2 rounded-lg transition-colors duration-150 hover:bg-white/5"
          style={{ color: "var(--studio-text-secondary)" }}
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "var(--studio-accent)", boxShadow: "0 0 6px var(--studio-accent-glow)" }}
          />
        </button>
        <Link
          href="/studio/clients/new"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border studio-font-ui text-[11px] font-medium tracking-wide transition-all duration-150 hover:border-[var(--studio-accent)]"
          style={{
            borderColor: "var(--studio-border)",
            color: "var(--studio-text-secondary)",
          }}
        >
          <UserPlus size={14} />
          ADD CLIENT
        </Link>
        <Link
          href="/studio/create"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg studio-font-ui text-[11px] font-semibold tracking-wide transition-all duration-150 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #c8873a 0%, #a66b2a 100%)",
            color: "#0f0d0b",
            boxShadow: "0 4px 20px var(--studio-accent-glow)",
          }}
        >
          <Sparkles size={14} />
          GENERATE
        </Link>
      </div>
    </header>
  );
}
