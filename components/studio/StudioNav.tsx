"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Images,
  BarChart3,
  Settings,
  LogOut,
  User,
  Zap,
  MoreHorizontal,
  X,
  ExternalLink,
  Bell,
} from "lucide-react";
import { getAuthClient } from "@/lib/firebase/client";

const TOP_NAV_ITEMS = [
  { label: "Overview",  href: "/studio",           icon: <LayoutDashboard size={13} /> },
  { label: "Clients",   href: "/studio/clients",   icon: <Users size={13} /> },
  { label: "Generate",  href: "/studio/create",    icon: <Sparkles size={13} /> },
  { label: "Posters",   href: "/studio/posters",   icon: <Images size={13} /> },
  { label: "Usage",     href: "/studio/usage",     icon: <BarChart3 size={13} /> },
  { label: "Team",      href: "/studio/team",      icon: <Users size={13} /> },
  { label: "Settings",  href: "/studio/settings",  icon: <Settings size={13} /> },
];

const BOTTOM_NAV_ITEMS = [
  { label: "Home",     href: "/studio",         icon: <LayoutDashboard size={18} /> },
  { label: "Clients",  href: "/studio/clients", icon: <Users size={18} /> },
  { label: "Generate", href: "/studio/create",  icon: <Sparkles size={18} /> },
  { label: "Posters",  href: "/studio/posters", icon: <Images size={18} /> },
];

const MORE_ITEMS = [
  { label: "Usage",    href: "/studio/usage",     icon: <BarChart3 size={20} /> },
  { label: "Team",     href: "/studio/team",      icon: <Users size={20} /> },
  { label: "Settings", href: "/studio/settings",  icon: <Settings size={20} /> },
  { label: "Upgrade",  href: "/studio/billing",   icon: <Zap size={20} /> },
];

function usePlan() {
  const [plan, setPlan] = useState<string>("starter");
  useEffect(() => {
    fetch("/api/studio/agency", { credentials: "same-origin" })
      .then((r) => r.ok && r.json())
      .then((d) => d?.agency && setPlan(d.agency.plan ?? "starter"))
      .catch(() => {});
  }, []);
  return plan;
}

export function StudioNav() {
  const pathname = usePathname();
  const plan = usePlan();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userInitial, setUserInitial] = useState("?");
  const [userEmail, setUserEmail] = useState("");
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const auth = getAuthClient();
    const user = auth.currentUser;
    const initial = user?.displayName?.trim()?.[0]?.toUpperCase()
      || user?.email?.trim()?.[0]?.toUpperCase()
      || "?";
    setUserInitial(initial);
    setUserEmail(user?.email ?? "");
    const unsub = auth.onAuthStateChanged((u) => {
      const i = u?.displayName?.trim()?.[0]?.toUpperCase()
        || u?.email?.trim()?.[0]?.toUpperCase()
        || "?";
      setUserInitial(i);
      setUserEmail(u?.email ?? "");
    });
    return () => unsub();
  }, []);

  useEffect(() => { setMoreOpen(false); }, [pathname]);

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

  function isActive(href: string) {
    if (href === "/studio") return pathname === "/studio";
    return pathname.startsWith(href);
  }

  const planLabel = plan === "starter" ? "STARTER" : plan === "pro" ? "PRO" : plan === "agency" ? "AGENCY" : "STARTER";

  return (
    <>
      <header className="h-12 bg-bg-base border-b border-border-subtle sticky top-0 z-50">
        <div className="max-w-full px-5 flex items-center justify-between h-12">
          <div className="flex items-center gap-4">
            <Link href="/studio" className="flex items-center gap-2 flex-shrink-0">
              <Image
                src="/artmasterwordmarklogo-03-03.webp"
                alt="ArtMaster"
                width={120}
                height={32}
                className="h-5 w-auto object-contain object-left"
              />
              <span className="hidden sm:inline font-mono text-[10px] text-text-muted bg-bg-elevated border border-border-default rounded px-1.5 py-0.5">
                STUDIO
              </span>
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
              <div className="w-1.5 h-1.5 rounded-full bg-info" />
              <span className="font-mono text-[10px] text-text-muted">{planLabel} STUDIO</span>
            </div>
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 text-text-muted font-medium text-[12px] px-3 py-1.5 rounded-lg hover:bg-bg-surface hover:text-text-secondary transition-colors"
            >
              <ExternalLink size={11} />
              My Brand
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
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-bg-overlay border border-border-default rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <div className="px-3 py-2 border-b border-border-subtle">
                    <p className="font-mono text-[10px] text-text-muted truncate">{userEmail}</p>
                  </div>
                  <Link
                    href="/studio/settings"
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
                    onClick={() => setAvatarOpen(false)}
                  >
                    <User size={14} />
                    Studio settings
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
                    onClick={() => setAvatarOpen(false)}
                  >
                    <ExternalLink size={14} />
                    Switch to My Brand
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

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-base border-t border-border-subtle flex md:hidden items-center pb-[env(safe-area-inset-bottom)] z-50">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-center transition-colors ${
              isActive(item.href) ? "text-info" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {item.icon}
            <span className="font-mono text-[9px] tracking-wider">{item.label.toUpperCase()}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-center transition-colors ${
            moreOpen ? "text-info" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <MoreHorizontal size={18} />
          <span className="font-mono text-[9px] tracking-wider">MORE</span>
        </button>
      </nav>

      {moreOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60] md:hidden" onClick={() => setMoreOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] md:hidden bg-bg-base rounded-t-2xl border-t border-border-default shadow-2xl pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Studio</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mx-4 mb-3 px-3 py-2.5 bg-bg-surface border border-border-default rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center font-semibold text-[12px] text-text-primary shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[13px] text-text-primary truncate">{userEmail || "Your account"}</p>
                <p className="font-mono text-[10px] text-text-muted">{planLabel} Studio plan</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 pb-4">
              {MORE_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-colors ${
                    isActive(item.href)
                      ? "bg-info/10 text-info border border-info/20"
                      : "bg-bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-border-strong"
                  }`}
                >
                  {item.icon}
                  <span className="font-mono text-[10px] tracking-wide">{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 px-4 pb-5">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-bg-surface border border-border-default text-text-secondary text-[13px] hover:border-border-strong transition-colors"
              >
                <ExternalLink size={15} />
                My Brand
              </Link>
              <Link
                href="/api/auth/logout"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-bg-surface border border-border-default text-red-400 text-[13px] hover:border-red-500/40 transition-colors"
              >
                <LogOut size={15} />
                Sign out
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
