import Link from "next/link";
import { LayoutDashboard, Sparkles, Image, Palette, CalendarClock } from "lucide-react";
import { SessionRefresher } from "./SessionRefresher";
import { CookiePreferencesLink } from "@/components/CookiePreferencesLink";
import { DashboardPlanTrigger } from "./DashboardPlanTrigger";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { label: "Overview", href: "/dashboard", icon: <LayoutDashboard size={14} /> },
    { label: "Generate Poster", href: "/dashboard/create", icon: <Sparkles size={14} /> },
    { label: "My Posters", href: "/dashboard/posters", icon: <Image size={14} /> },
    { label: "Brand Kits", href: "/dashboard/brand-kits", icon: <Palette size={14} /> },
    { label: "Schedule", href: "/dashboard/schedule", icon: <CalendarClock size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <SessionRefresher />
      <header className="h-14 border-b border-border-subtle flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-bg-base/95 backdrop-blur z-20">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-text-primary">ArtMaster</span>
            <span className="font-mono text-[9px] text-accent border border-accent/30 rounded px-1 py-0.5 tracking-widest">PLATFORM</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-[11px] text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <span className="opacity-70 flex items-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <DashboardPlanTrigger />
          <CookiePreferencesLink className="font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors hidden sm:block">
            Cookie preferences
          </CookiePreferencesLink>
          <Link href="/api/auth/logout" className="font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors">Sign out</Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
