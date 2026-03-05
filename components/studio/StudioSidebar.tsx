"use client";

import { useState, useEffect } from "react";
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
  ExternalLink,
  Zap,
} from "lucide-react";
import { getAuthClient } from "@/lib/firebase/client";

const NAV_ITEMS = [
  { label: "Overview", href: "/studio", icon: LayoutDashboard },
  { label: "Clients", href: "/studio/clients", icon: Users },
  { label: "Generate", href: "/studio/create", icon: Sparkles },
  { label: "Posters", href: "/studio/posters", icon: Images },
  { label: "Usage", href: "/studio/usage", icon: BarChart3 },
  { label: "Team", href: "/studio/team", icon: Users },
  { label: "Settings", href: "/studio/settings", icon: Settings },
];

export function StudioSidebar() {
  const pathname = usePathname();
  const [agencyName, setAgencyName] = useState("Volta Creative");
  const [plan, setPlan] = useState("TRIAL");
  const [userInitial, setUserInitial] = useState("V");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetch("/api/studio/agency", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.agency) {
          setAgencyName(d.agency.agencyName || "Volta Creative");
          const p = d.agency.plan ?? "trial";
          setPlan(
            p === "agency" ? "AGENCY STUDIO" : p === "pro" ? "PRO STUDIO" : p === "starter" ? "STARTER STUDIO" : "TRIAL"
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const auth = getAuthClient();
    const u = auth.currentUser;
    const i = u?.displayName?.trim()?.[0]?.toUpperCase() || u?.email?.trim()?.[0]?.toUpperCase() || "?";
    setUserInitial(i);
    const unsub = auth.onAuthStateChanged((user) => {
      const initial = user?.displayName?.trim()?.[0]?.toUpperCase() || user?.email?.trim()?.[0]?.toUpperCase() || "?";
      setUserInitial(initial);
    });
    return () => unsub();
  }, []);

  const isActive = (href: string) =>
    href === "/studio" ? pathname === "/studio" : pathname.startsWith(href);

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden md:flex flex-col w-[220px] h-screen border-r"
      style={{
        background: "var(--studio-bg-elevated)",
        borderColor: "var(--studio-sidebar-border)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: "var(--studio-border-subtle)" }}>
        <Link href="/studio" className="flex items-center gap-2">
          <Image
            src="/artmasterwordmarklogo-03-03.webp"
            alt="ArtMaster Studio"
            width={120}
            height={28}
            className="h-5 w-auto object-contain"
          />
          <span
            className="text-[10px] font-semibold tracking-wider"
            style={{ color: "var(--studio-accent)" }}
          >
            STUDIO
          </span>
        </Link>
      </div>

      {/* Agency card */}
      <div
        className="mx-3 mt-3 mb-2 p-3 rounded-lg"
        style={{ background: "var(--studio-bg-base)", border: "1px solid var(--studio-border-subtle)" }}
      >
        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--studio-text-primary)" }}>
          {agencyName}
        </p>
        <p
          className="text-[9px] mt-0.5 tracking-widest font-medium"
          style={{ color: plan === "TRIAL" ? "var(--studio-text-muted)" : "var(--studio-accent)", opacity: plan === "TRIAL" ? 1 : 0.7 }}
        >
          {plan}
        </p>
      </div>

      {plan === "TRIAL" && (
        <Link
          href="/studio/billing"
          className="mx-3 mb-3 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-semibold transition-all"
          style={{
            background: "var(--studio-accent)",
            color: "#080808",
            border: "1px solid transparent",
          }}
        >
          <Zap size={12} />
          Upgrade to use Studio
        </Link>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-[12px] font-medium ${
                active ? "" : "hover:bg-white/[0.04]"
              }`}
              style={{
                background: active ? "rgba(232,255,71,0.07)" : "transparent",
                color: active ? "var(--studio-accent)" : "var(--studio-text-secondary)",
              }}
            >
              {active ? (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: "var(--studio-accent)", boxShadow: "0 0 8px var(--studio-accent-glow)" }}
                />
              ) : (
                <span className="w-1.5 shrink-0" />
              )}
              <Icon size={14} className="shrink-0 opacity-80" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — account dropdown (one account for both Studio and Dashboard) */}
      <div className="p-3 border-t space-y-2" style={{ borderColor: "var(--studio-border-subtle)" }}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors duration-150 hover:bg-white/[0.04]"
            style={{ color: "var(--studio-text-secondary)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold"
              style={{
                background: "var(--studio-border)",
                color: "var(--studio-text-primary)",
              }}
            >
              {userInitial}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] font-medium truncate" style={{ color: "var(--studio-text-primary)" }}>
                Account
              </p>
              <p className="text-[8px] truncate" style={{ color: "var(--studio-text-muted)" }}>
                {plan}
              </p>
            </div>
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div
                className="absolute bottom-full left-0 right-0 mb-1 py-1 rounded-lg border z-50 overflow-hidden"
                style={{
                  background: "var(--studio-bg-elevated)",
                  borderColor: "var(--studio-border)",
                  boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
                }}
              >
                <Link
                  href="/studio/settings"
                  className="flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-white/[0.04] transition-colors"
                  style={{ color: "var(--studio-text-secondary)" }}
                  onClick={() => setDropdownOpen(false)}
                >
                  <User size={12} />
                  Studio settings
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-white/[0.04] transition-colors"
                  style={{ color: "var(--studio-text-secondary)" }}
                  onClick={() => setDropdownOpen(false)}
                >
                  <ExternalLink size={12} />
                  My Brand (dashboard)
                </Link>
                <Link
                  href="/api/auth/logout?returnTo=/studio/login"
                  className="flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-white/[0.04] transition-colors"
                  style={{ color: "var(--studio-text-secondary)" }}
                  onClick={() => setDropdownOpen(false)}
                >
                  <LogOut size={12} />
                  Sign out
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
