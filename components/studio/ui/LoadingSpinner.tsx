"use client";

type LoadingSpinnerProps = { className?: string };

export function LoadingSpinner({ className = "" }: LoadingSpinnerProps) {
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full border-2 border-[rgba(255,255,255,0.15)] border-t-[#E8FF47] animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
