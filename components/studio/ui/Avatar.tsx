"use client";

const COLORS = [
  "#E8FF47",
  "#4D9EFF",
  "#4ade80",
  "#fbbf24",
  "#ef4444",
  "#a78bfa",
  "#2dd4bf",
];

function getColor(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return COLORS[n % COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name.trim().slice(0, 2) || "?").toUpperCase();
}

type AvatarProps = {
  name: string;
  id?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = { sm: 28, md: 36, lg: 48 };

export function Avatar({ name, id = name, size = "md", className = "" }: AvatarProps) {
  const px = sizes[size];
  const color = getColor(id);
  return (
    <div
      className={`flex items-center justify-center rounded-lg font-bold flex-shrink-0 ${className}`}
      style={{
        width: px,
        height: px,
        backgroundColor: `${color}15`,
        border: `1px solid ${color}40`,
        color,
        fontSize: size === "sm" ? 11 : size === "md" ? 13 : 16,
        fontFamily: 'var(--studio-font, -apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif)',
      }}
    >
      {initials(name)}
    </div>
  );
}
