"use client";

import Link from "next/link";
import { LayoutDashboard, Users, Sparkles, Images, BarChart3 } from "lucide-react";
import { StudioSidebar } from "./StudioSidebar";
import { StudioTopBar } from "./StudioTopBar";

export function StudioShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`studio-theme min-h-screen ${className}`.trim()} style={{ background: "var(--studio-bg-base)" }}>
      {/* Background effects — fixed, pointer-events-none */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 0% 0%, rgba(200,135,58,0.06) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(100,80,120,0.04) 0%, transparent 50%)
          `,
        }}
      />
      <div className="studio-grain">
        <svg xmlns="http://www.w3.org/2000/svg">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>

      <StudioSidebar />
      <StudioTopBar />

      {/* Main content — offset by sidebar on desktop */}
      <div className="relative z-10 md:ml-[220px] min-h-screen flex flex-col pt-14">
        <main className="flex-1 p-6 md:p-9 pb-24 md:pb-9">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center border-t pb-[env(safe-area-inset-bottom)]"
        style={{
          background: "var(--studio-bg-elevated)",
          borderColor: "var(--studio-topbar-border)",
        }}
      >
        {[
          { label: "Home", href: "/studio", Icon: LayoutDashboard },
          { label: "Clients", href: "/studio/clients", Icon: Users },
          { label: "Generate", href: "/studio/create", Icon: Sparkles },
          { label: "Posters", href: "/studio/posters", Icon: Images },
          { label: "More", href: "/studio/usage", Icon: BarChart3 },
        ].map(({ label, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-3 studio-font-ui text-[9px] tracking-wider transition-colors duration-150"
            style={{ color: "var(--studio-text-muted)" }}
          >
            <Icon size={20} strokeWidth={1.5} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
