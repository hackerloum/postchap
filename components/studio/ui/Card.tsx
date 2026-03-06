"use client";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-[10px] bg-[#111111] border border-[#ffffff0f] transition-[border-color] duration-150 hover:border-[#ffffff18] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
