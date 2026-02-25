import Link from "next/link";
import { Sparkles, CalendarClock, Settings, ArrowRight } from "lucide-react";

export function QuickActions() {
  const actions = [
    { label: "Generate poster", href: "/dashboard/create", icon: <Sparkles size={13} />, accent: true },
    { label: "Set schedule", href: "/dashboard/schedule", icon: <CalendarClock size={13} /> },
    { label: "Brand settings", href: "/dashboard/brand-kits", icon: <Settings size={13} /> },
  ];

  return (
    <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border-subtle">
        <span className="font-semibold text-[13px] text-text-primary">Quick actions</span>
      </div>
      <div className="p-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-150 group ${
              action.accent ? "bg-accent/10 hover:bg-accent/15" : "hover:bg-bg-elevated"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={action.accent ? "text-accent" : "text-text-muted"}>{action.icon}</span>
              <span
                className={`text-[13px] font-medium ${
                  action.accent ? "text-accent" : "text-text-secondary group-hover:text-text-primary"
                }`}
              >
                {action.label}
              </span>
            </div>
            <ArrowRight
              size={12}
              className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
