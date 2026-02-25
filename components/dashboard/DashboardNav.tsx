"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Images,
  Palette,
  CalendarClock,
  Zap,
  LogOut,
  User,
} from "lucide-react";
import { getAuthClient } from "@/lib/firebase/client";

const TOP_NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: <LayoutDashboard size={13} /> },
  { label: "Generate", href: "/dashboard/create", icon: <Sparkles size={13} /> },
  { label: "Posters", href: "/dashboard/posters", icon: <Images size={13} /> },
  { label: "Brand Kits", href: "/dashboard/brand-kits", icon: <Palette size={13} /> },
  { label: "Schedule", href: "/dashboard/schedule", icon: <CalendarClock size={13} /> },
];

const BOTTOM_NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Generate", href: "/dashboard/create", icon: <Sparkles size={18} /> },
  { label: "Posters", href: "/dashboard/posters", icon: <Images size={18} /> },
  { label: "Kits", href: "/dashboard/brand-kits", icon: <Palette size={18} /> },
];

function usePlan() {
  const [plan, setPlan] = useState<string>("free");
  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => r.ok && r.json())
      .then((d) => d && setPlan((d.plan as string) ?? "free"))
      .catch(() => {});
  }, []);
  return plan;
}

export function DashboardNav() {
  const pathname = usePathname();
  const plan = usePlan();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [userInitial, setUserInitial] = useState("?");
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const auth = getAuthClient();
    const user = auth.currentUser;
    const initial = user?.displayName?.trim()?.[0]?.toUpperCase()
      || user?.email?.trim()?.[0]?.toUpperCase()
      || "?";
    setUserInitial(initial);
    const unsub = auth.onAuthStateChanged((u) => {
      const i = u?.displayName?.trim()?.[0]?.toUpperCase()
        || u?.email?.trim()?.[0]?.toUpperCase()
        || "?";
      setUserInitial(i);
    });
    return () => unsub();
  }, []);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    if (avatarOpen) {
      document.addEventListener("pointerdown", onPointerDown);
      return () => document.removeEventListener("pointerdown", onPointerDown);
    }
  }, [avatarOpen]);

  return (
    <>
      <header className="h-12 bg-bg-base border-b border-border-subtle sticky top-0 z-50">
        <div className="max-w-full px-5 flex items-center justify-between h-12">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center flex-shrink-0">
              <Image
                src="/artmasterwordmarklogo-03-03.webp"
                alt="ArtMaster"
                width={120}
                height={32}
                className="h-5 w-auto object-contain object-left"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {TOP_NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                    isActive(item.href)
                      ? "bg-bg-elevated text-text-primary"
                      : "text-text-muted hover:text-text-secondary hover:bg-bg-surface"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-bg-surface border border-border-default rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-mono text-[10px] text-text-muted">
                {plan === "free" ? "FREE PLAN" : `${plan.toUpperCase()} PLAN`}
              </span>
            </div>
            <Link
              href="/pricing"
              className="hidden sm:inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent font-semibold text-[12px] px-3 py-1.5 rounded-lg hover:bg-accent/15 transition-colors"
            >
              <Zap size={11} />
              Upgrade
            </Link>
            <div className="relative" ref={avatarRef}>
              <button
                type="button"
                onClick={() => setAvatarOpen((o) => !o)}
                className="w-7 h-7 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center font-semibold text-[11px] text-text-primary cursor-pointer hover:border-border-strong transition-colors select-none"
              >
                {userInitial}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-bg-overlay border border-border-default rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
                    onClick={() => setAvatarOpen(false)}
                  >
                    <User size={14} />
                    Profile
                  </Link>
                  <Link
                    href="/api/auth/logout"
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
                    onClick={() => setAvatarOpen(false)}
                  >
                    <LogOut size={14} />
                    Sign out
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-bg-base border-t border-border-subtle flex md:hidden items-center pb-[env(safe-area-inset-bottom)] z-50">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-center transition-colors ${
              isActive(item.href) ? "text-accent" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {item.icon}
            <span className="font-mono text-[9px] tracking-wider">{item.label.toUpperCase()}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
