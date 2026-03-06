"use client";

import Link from "next/link";
import {
  BarChart3,
  Users,
  Settings,
  Zap,
  ExternalLink,
  LogOut,
  X,
} from "lucide-react";
import { Modal } from "@/components/studio/ui";

const ITEMS = [
  { label: "Usage", href: "/studio/usage", icon: BarChart3 },
  { label: "Team", href: "/studio/team", icon: Users },
  { label: "Settings", href: "/studio/settings", icon: Settings },
  { label: "Upgrade", href: "/studio/billing", icon: Zap },
  { label: "My Brand", href: "/dashboard", icon: ExternalLink },
];

type MobileMoreSheetProps = { open: boolean; onClose: () => void };

export function MobileMoreSheet({ open, onClose }: MobileMoreSheetProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="rounded-t-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#ffffff08]">
          <h2 className="text-[15px] font-semibold text-[#fafafa]">More</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#71717a] hover:bg-[#ffffff08]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-2 max-h-[70vh] overflow-y-auto">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 h-12 px-4 rounded-lg text-[14px] text-[#fafafa] hover:bg-[#ffffff08] transition-colors"
            >
              <item.icon size={20} className="text-[#71717a]" />
              {item.label}
            </Link>
          ))}
          <a
            href="/api/auth/logout?returnTo=/studio/login"
            className="flex items-center gap-3 h-12 px-4 rounded-lg text-[14px] text-[#a1a1aa] hover:bg-[#ffffff08] hover:text-[#ef4444] transition-colors"
          >
            <LogOut size={20} />
            Sign out
          </a>
        </div>
      </div>
    </Modal>
  );
}
