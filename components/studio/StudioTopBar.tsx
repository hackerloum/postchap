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
        background: "rgba(8, 8, 8, 0.85)",
        borderColor: "var(--studio-topbar-border)",
      }}
    >
      <p
        className="text-[10px] font-medium tracking-[0.2em]"
        style={{ color: "var(--studio-text-muted)" }}
      >
        STUDIO / {page}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative p-2 rounded-lg transition-colors duration-150 hover:bg-white/[0.05]"
          style={{ color: "var(--studio-text-secondary)" }}
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--studio-accent)", boxShadow: "0 0 6px var(--studio-accent-glow)" }}
          />
        </button>

        <Link
          href="/studio/clients/new"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-[11px] font-medium tracking-wide transition-all duration-150 hover:border-white/20 hover:text-white"
          style={{
            borderColor: "var(--studio-border)",
            color: "var(--studio-text-secondary)",
          }}
        >
          <UserPlus size={13} />
          ADD CLIENT
        </Link>

        <Link
          href="/studio/create"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
          style={{
            background: "var(--studio-accent)",
            color: "#080808",
            boxShadow: "0 2px 16px var(--studio-accent-glow)",
          }}
        >
          <Sparkles size={13} />
          GENERATE
        </Link>
      </div>
    </header>
  );
}
