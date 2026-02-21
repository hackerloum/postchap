import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded bg-bg-elevated animate-pulse", className)}
      aria-hidden
    />
  );
}

export function BrandKitCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-surface">
      <div className="skeleton h-2 w-full" />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="flex-1">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton mt-1 h-3 w-20" />
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          <div className="skeleton h-8 w-16" />
          <div className="skeleton h-8 w-16" />
          <div className="skeleton h-8 w-20" />
        </div>
        <div className="skeleton mt-4 h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-default bg-bg-surface p-6">
      <div className="skeleton h-3 w-20" />
      <div className="skeleton mt-2 h-8 w-16" />
      <div className="skeleton mt-1 h-4 w-24" />
    </div>
  );
}

export function PosterRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border-default bg-bg-surface px-4 py-3">
      <div className="skeleton h-12 w-12 rounded-lg" />
      <div className="flex-1">
        <div className="skeleton h-4 w-48" />
        <div className="skeleton mt-1 h-3 w-32" />
      </div>
      <div className="skeleton h-8 w-20 rounded" />
    </div>
  );
}
