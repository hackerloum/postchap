"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Zap,
} from "lucide-react";

export type NotificationItem = {
  id: string;
  type: "poster_approved" | "revision_requested" | "quota_warning" | "team_joined" | "occasion_reminder";
  title: string;
  message?: string;
  time: string;
  unread: boolean;
};

type NotificationDropdownProps = {
  open: boolean;
  onClose: () => void;
  anchor: React.RefObject<HTMLElement | null>;
  items?: NotificationItem[];
};

const ICONS: Record<string, React.ElementType> = {
  poster_approved: CheckCircle2,
  revision_requested: AlertCircle,
  quota_warning: AlertCircle,
  team_joined: Users,
  occasion_reminder: Calendar,
};

const ICON_COLORS: Record<string, string> = {
  poster_approved: "text-[#4ade80]",
  revision_requested: "text-[#fbbf24]",
  quota_warning: "text-[#ef4444]",
  team_joined: "text-[#4D9EFF]",
  occasion_reminder: "text-[#E8FF47]",
};

export function NotificationDropdown({
  open,
  onClose,
  anchor,
  items = [],
}: NotificationDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        anchor.current &&
        !anchor.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [open, onClose, anchor]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-[320px] rounded-[10px] bg-[#111111] border border-[#ffffff0f] shadow-[0_16px_48px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between p-3 border-b border-[#ffffff08]">
        <h3 className="text-[13px] font-semibold text-[#fafafa]">Notifications</h3>
        <button
          type="button"
          className="text-[12px] font-medium text-[#E8FF47] hover:underline"
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {items.length === 0 ? (
          <p className="p-4 text-[13px] text-[#71717a] text-center">
            No notifications yet
          </p>
        ) : (
          items.map((item) => {
            const Icon = ICONS[item.type] ?? Zap;
            return (
              <div
                key={item.id}
                className={`flex gap-3 p-3 border-b border-[#ffffff06] last:border-0 ${
                  item.unread ? "bg-[#E8FF4704]" : ""
                }`}
              >
                {item.unread && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8FF47] shrink-0 mt-1.5" />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    ICON_COLORS[item.type] ?? "text-[#71717a]"
                  } bg-[#ffffff08]`}
                >
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-[#fafafa]">{item.title}</p>
                  {item.message && (
                    <p className="text-[12px] text-[#71717a] truncate">{item.message}</p>
                  )}
                  <p className="text-[11px] text-[#71717a] mt-0.5">{item.time}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <Link
        href="/studio/usage"
        className="block p-3 text-center text-[12px] font-medium text-[#E8FF47] hover:bg-[#E8FF4708] transition-colors"
      >
        View all notifications →
      </Link>
    </div>
  );
}
