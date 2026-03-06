"use client";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`rounded studio-shimmer ${className}`}
      {...props}
    />
  );
}
