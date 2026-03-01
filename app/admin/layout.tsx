"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Sparkles,
  CalendarClock,
  Users,
  Palette,
  Settings,
  ExternalLink,
} from "lucide-react";

const NAV = [
  { label: "Overview", href: "/admin", icon: <LayoutDashboard size={14} /> },
  { label: "Create Poster", href: "/admin/create", icon: <Sparkles size={14} /> },
  { label: "Schedule", href: "/admin/schedule", icon: <CalendarClock size={14} /> },
  { label: "Users", href: "/admin/users", icon: <Users size={14} /> },
  { label: "Brand Kits", href: "/admin/brand-kits", icon: <Palette size={14} /> },
  { label: "ArtMaster Kit", href: "/admin/artmaster-kit", icon: <Settings size={14} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border-default bg-bg-surface flex flex-col">
        <div className="px-5 py-5 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Image
              src="/artmasterwordmarklogo-03-03.webp"
              alt="ArtMaster"
              width={110}
              height={32}
              className="h-6 w-auto object-contain"
              priority
            />
            <span className="text-[10px] font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded-md font-semibold tracking-wide">
              ADMIN
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                }`}
              >
                <span className={active ? "text-accent" : "text-text-muted"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border-subtle">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <ExternalLink size={13} />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
