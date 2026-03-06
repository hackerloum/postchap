"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "./Button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "primary" | "secondary" | "ghost";
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = "primary",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <Icon
        className="text-[#ffffff15] mb-4"
        size={32}
        strokeWidth={1.5}
      />
      <h3
        className="text-[15px] font-medium text-[#fafafa] mb-1"
        style={{ fontFamily: 'var(--studio-font)' }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-[13px] text-[#71717a] max-w-[280px] mb-4">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant={actionVariant} size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
