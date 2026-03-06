"use client";

import { forwardRef } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const base =
  "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]";

const variants = {
  primary:
    "bg-[#E8FF47] text-[#080808] font-semibold hover:bg-[#B8CC38] hover:-translate-y-px shadow-[0_0_20px_rgba(232,255,71,0.125)]",
  secondary:
    "bg-[#111111] border border-[#ffffff0f] text-[#fafafa] hover:bg-[#181818] hover:border-[#ffffff18]",
  ghost:
    "bg-transparent text-[#a1a1aa] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#fafafa]",
  danger:
    "bg-transparent border border-[rgba(239,68,68,0.3)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)]",
};

const sizes = {
  sm: "h-8 px-3 text-[13px] min-h-[32px]",
  md: "h-[38px] px-4 text-[13px] min-h-[38px]",
  lg: "h-11 px-5 text-[13px] min-h-[44px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      className = "",
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ fontFamily: 'var(--studio-font, -apple-system, "SF Pro Text", BlinkMacSystemFont, sans-serif)' }}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = "StudioButton";
