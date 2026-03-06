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
  ExternalLink,
} from "lucide-react";
import { getAuthClient } from "@/lib/firebase/client";
import { Avatar, Badge } from "@/components/studio/ui";

const NAV_ITEMS = [
  { label: "Overview", href: "/studio", icon: LayoutDashboard },
  { label: "Clients", href: "/studio/clients", icon: Users },
  { label: "Generate", href: "/studio/create", icon: Sparkles },
  { label: "Posters", href: "/studio/posters", icon: Images },
  { label: "Usage", href: "/studio/usage", icon: BarChart3 },
  { label: "Team", href: "/studio/team", icon: Users },
  { label: "Settings", href: "/studio/settings", icon: Settings },
];

export function Sidebar({
  collapsed,
  onExpand,
  onCollapse,
}: {
  collapsed?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}) {
  const pathname = usePathname();
  const [agencyName, setAgencyName] = useState("");
  const [plan, setPlan] = useState("trial");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const tokenP = typeof window !== "undefined" ? fetch("/api/studio/agency", { credentials: "same-origin" }) : null;
    if (tokenP)
      tokenP
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.agency) {
            setAgencyName(d.agency.agencyName || "Agency");
            setPlan((d.agency.plan ?? "trial").toLowerCase());
          }
        })
        .catch(() => {});
  }, []);

  useEffect(() => {
    const auth = getAuthClient();
    const u = auth.currentUser;
    setUserName(u?.displayName?.trim() || u?.email?.trim() || "User");
    const unsub = auth.onAuthStateChanged((user) => {
      setUserName(user?.displayName?.trim() || user?.email?.trim() || "User");
    });
    return () => unsub();
  }, []);

  const isActive = (href: string) =>
    href === "/studio" ? pathname === "/studio" : pathname.startsWith(href);

  const planLabel =
    plan === "agency" ? "AGENCY" : plan === "pro" ? "PRO" : plan === "starter" ? "STARTER" : "TRIAL";

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden md:flex flex-col h-screen border-r border-[#ffffff08] bg-[#080808] transition-all duration-150 w-14 lg:w-[232px] ${
        collapsed ? "" : "!w-[232px]"
      }`}
      onMouseEnter={collapsed ? onExpand : undefined}
      onMouseLeave={collapsed ? onCollapse : undefined}
    >
      {/* Logo */}
      <div className="flex items-center justify-between shrink-0 p-5 border-b border-[#ffffff08]">
        {!collapsed && (
          <Link href="/studio" className="flex items-center gap-2 min-w-0">
            <Image
              src="/artmasterwordmarklogo-03-03.webp"
              alt="ArtMaster"
              width={100}
              height={24}
              className="h-[15px] w-auto object-contain"
            />
            <Badge variant="accent">STUDIO</Badge>
          </Link>
        )}
        {collapsed && (
          <Link href="/studio" className="flex justify-center w-full" aria-label="Studio home">
            <Image
              src="/artmasterwordmarklogo-03-03.webp"
              alt="ArtMaster"
              width={24}
              height={24}
              className="h-6 w-6 object-contain opacity-90"
            />
          </Link>
        )}
      </div>

      {/* Agency card */}
      {!collapsed && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-[#ffffff05] border border-[#ffffff08]">
          <div className="flex items-center gap-3">
            <Avatar name={agencyName || "A"} id={agencyName} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[#fafafa] truncate">
                {agencyName || "—"}
              </p>
              <Badge variant={plan === "trial" ? "default" : "accent"} className="mt-1">
                {planLabel}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 py-2 text-[9px] font-medium uppercase tracking-[0.1em] text-[#71717a]">
            Menu
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 h-9 px-3 rounded-lg transition-all duration-150 ${
                active
                  ? "bg-[#E8FF4710] border border-[#E8FF4720] text-[#E8FF47] font-medium"
                  : "text-[#a1a1aa] hover:bg-[#ffffff08] hover:text-[#fafafa]"
              } ${collapsed ? "justify-center px-0" : ""}`}
              style={active && !collapsed ? { borderLeft: "2px solid #E8FF47", borderRadius: "1px" } : undefined}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span className="text-[13px]">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 p-3 border-t border-[#ffffff08] space-y-2">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 h-8 px-3 rounded-lg text-[13px] text-[#a1a1aa] hover:bg-[#ffffff08] hover:text-[#fafafa] transition-all duration-150 w-full"
          >
            <ExternalLink size={14} />
            My Brand
          </Link>
        )}
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <Avatar name={userName} size="sm" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-[#a1a1aa] truncate">{userName}</p>
              <span className="text-[9px] text-[#71717a]">{planLabel}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
