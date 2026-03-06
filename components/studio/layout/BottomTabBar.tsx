"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Sparkles, Images, MoreHorizontal } from "lucide-react";

const TABS = [
  { label: "Home", href: "/studio", icon: LayoutDashboard },
  { label: "Clients", href: "/studio/clients", icon: Users },
  { label: "Generate", href: "/studio/create", icon: Sparkles, center: true },
  { label: "Posters", href: "/studio/posters", icon: Images },
  { label: "More", href: "#more", icon: MoreHorizontal, openSheet: true },
];

type BottomTabBarProps = { onOpenMore?: () => void };

export function BottomTabBar({ onOpenMore }: BottomTabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around h-16 pt-2 pb-[env(safe-area-inset-bottom)] border-t border-[#ffffff08] bg-[#080808]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
    >
      {TABS.map((tab) => {
        const isActive =
          tab.href === "#more"
            ? false
            : tab.href === "/studio"
              ? pathname === "/studio"
              : pathname.startsWith(tab.href);
        const isCenter = tab.center;

        if (tab.openSheet) {
          return (
            <button
              key="more"
              type="button"
              onClick={onOpenMore}
              className="flex flex-col items-center gap-1 flex-1 py-2 text-[10px] font-medium text-[#71717a]"
            >
              <MoreHorizontal size={20} />
              More
            </button>
          );
        }

        if (isCenter) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center flex-1"
            >
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-full shadow-[0_0_20px_rgba(232,255,71,0.3)] transition-transform ${
                  isActive ? "bg-[#E8FF47] text-[#080808]" : "bg-[#E8FF47] text-[#080808]"
                }`}
              >
                <Sparkles size={22} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-medium text-[#71717a] mt-1">Generate</span>
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-1 flex-1 py-2 text-[10px] font-medium transition-colors ${
              isActive ? "text-[#E8FF47]" : "text-[#71717a]"
            }`}
          >
            <tab.icon size={20} strokeWidth={1.5} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
