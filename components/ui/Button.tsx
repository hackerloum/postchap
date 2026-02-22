import { forwardRef } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
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
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
      primary:
        "bg-accent text-black hover:bg-accent-dim focus:ring-2 focus:ring-accent/50",
      secondary:
        "bg-bg-surface border border-border-default text-text-primary hover:bg-bg-elevated hover:border-border-strong",
      ghost:
        "bg-transparent text-text-primary hover:bg-bg-elevated",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-xs min-h-[32px]",
      md: "px-4 py-2 text-sm min-h-[40px]",
      lg: "px-6 py-3 text-sm min-h-[48px]",
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
