"use client";

type ToggleProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label"?: string;
};

export function Toggle({
  checked,
  onCheckedChange,
  className = "",
  "aria-label": ariaLabel = "Toggle",
  ...props
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-4 w-7 shrink-0 rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808] ${
        checked ? "bg-[#E8FF47]" : "bg-[rgba(255,255,255,0.15)]"
      } ${className}`}
      {...props}
    >
      <span
        className={`absolute top-1 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-150 ${
          checked ? "translate-x-3" : "translate-x-0"
        }`}
      />
    </button>
  );
}
