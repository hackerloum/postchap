export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-6">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-border-default border-t-accent"
          aria-hidden
        />
        <p className="font-mono text-sm text-text-muted">Loading dashboard…</p>
      </div>
    </div>
  );
}
