"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, UserPlus, Sparkles } from "lucide-react";

const BREADCRUMB: Record<string, string> = {
  "/studio": "Overview",
  "/studio/clients": "Clients",
  "/studio/create": "Generate",
  "/studio/posters": "Posters",
  "/studio/usage": "Usage",
  "/studio/team": "Team",
  "/studio/settings": "Settings",
  "/studio/billing": "Billing",
  "/studio/occasions": "Occasions",
};

function getPageName(pathname: string): string {
  if (pathname === "/studio") return "Overview";
  for (const [path, label] of Object.entries(BREADCRUMB)) {
    if (path !== "/studio" && pathname.startsWith(path)) return label;
  }
  if (pathname.includes("/studio/clients/") && pathname.includes("brand-kits")) return "Clients";
  if (pathname.includes("/studio/clients/")) return "Clients";
  return "Overview";
}

type TopBarProps = {
  primaryAction?: "add-client" | "generate" | "invite" | null;
  onSearchClick?: () => void;
};

export function TopBar({ primaryAction = "generate", onSearchClick }: TopBarProps) {
  const pathname = usePathname();
  const pageName = getPageName(pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[52px] px-4 md:px-6 border-b border-[#ffffff08] bg-[#080808cc] backdrop-blur-[20px]">
      <p className="text-[11px] text-[#71717a]">
        Studio <span className="text-[#71717a]/80">/</span> {pageName}
      </p>

      {/* Center: search (desktop only) */}
      <div className="hidden lg:flex flex-1 justify-center max-w-[280px] mx-4">
        <div className="relative w-full max-w-[280px]">
          <button
            type="button"
            onClick={onSearchClick}
            className="w-full h-8 pl-9 pr-3 rounded-md text-left text-[12px] text-[#fafafa] placeholder:text-[#71717a] bg-[#111111] border border-[#ffffff0f] focus:outline-none focus:border-[#E8FF4740] transition-colors cursor-text"
          >
            <span className="text-[#71717a]">Search clients, posters...</span>
          </button>
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717a]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative p-2 rounded-lg text-[#a1a1aa] hover:bg-[#ffffff08] hover:text-[#fafafa] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E8FF47] shadow-[0_0_6px_#E8FF4740]" />
        </button>
        {primaryAction === "add-client" && (
          <Link
            href="/studio/clients/new"
            className="hidden sm:flex items-center gap-2 h-9 px-4 rounded-lg border border-[#ffffff0f] text-[13px] font-medium text-[#fafafa] hover:bg-[#181818] hover:border-[#ffffff18] transition-all"
          >
            <UserPlus size={14} />
            Add client
          </Link>
        )}
        {(primaryAction === "generate" || primaryAction === "invite" || !primaryAction) && (
          <Link
            href={primaryAction === "invite" ? "/studio/team" : "/studio/create"}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#E8FF47] text-[#080808] text-[13px] font-semibold hover:bg-[#B8CC38] hover:-translate-y-px shadow-[0_0_20px_rgba(232,255,71,0.2)] transition-all"
          >
            <Sparkles size={14} />
            {primaryAction === "invite" ? "Invite" : "Generate"}
          </Link>
        )}
      </div>
    </header>
  );
}
