import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { LayoutDashboard, Sparkles, Image as ImageIcon, Palette, CalendarClock, User } from "lucide-react";
import { SessionRefresher } from "./SessionRefresher";
import { CookiePreferencesLink } from "@/components/CookiePreferencesLink";
import { DashboardPlanTrigger } from "./DashboardPlanTrigger";
import { WhatsNewTrigger } from "./WhatsNewTrigger";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { label: "Overview", href: "/dashboard", icon: <LayoutDashboard size={14} /> },
    { label: "Generate Poster", href: "/dashboard/create", icon: <Sparkles size={14} /> },
    { label: "My Posters", href: "/dashboard/posters", icon: <ImageIcon size={14} /> },
    { label: "Brand Kits", href: "/dashboard/brand-kits", icon: <Palette size={14} /> },
    { label: "Schedule", href: "/dashboard/schedule", icon: <CalendarClock size={14} /> },
    { label: "Profile", href: "/dashboard/profile", icon: <User size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <SessionRefresher />
      <header className="h-14 border-b border-border-subtle flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-bg-base/95 backdrop-blur z-20">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center flex-shrink-0">
            <Image
              src="/artmasterwordmarklogo-03-03.webp"
              alt="Art Master"
              width={200}
              height={52}
              className="h-6 w-auto sm:h-10 object-contain object-left"
            />
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
          <WhatsNewTrigger />
          <Suspense fallback={<span className="font-mono text-[11px] text-text-muted">Plan…</span>}>
            <DashboardPlanTrigger />
          </Suspense>
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
