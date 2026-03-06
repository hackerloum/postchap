"use client";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "accent" | "success" | "warning" | "danger";
};

const variants = {
  default:
    "bg-[rgba(255,255,255,0.05)] border border-[#ffffff0f] text-[#a1a1aa]",
  accent:
    "bg-[#E8FF4712] border border-[#E8FF4725] text-[#E8FF47]",
  success:
    "bg-[#4ade8012] border border-[#4ade8025] text-[#4ade80]",
  warning:
    "bg-[#fbbf2412] border border-[#fbbf2425] text-[#fbbf24]",
  danger:
    "bg-[#ef444412] border border-[#ef444425] text-[#ef4444]",
};

export function Badge({
  variant = "default",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.08em] rounded border ${variants[variant]} ${className}`}
      style={{ fontFamily: 'var(--studio-font, -apple-system, "SF Pro Text", BlinkMacSystemFont, sans-serif)' }}
      {...props}
    />
  );
}
