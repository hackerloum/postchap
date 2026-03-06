"use client";

type DividerProps = React.HTMLAttributes<HTMLHRElement>;

export function Divider({ className = "", ...props }: DividerProps) {
  return (
    <hr
      className={`border-0 h-px bg-[#ffffff08] ${className}`}
      {...props}
    />
  );
}
