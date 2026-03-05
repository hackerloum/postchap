/** Instant loading UI while Studio layout/page resolve. Keeps navigation feeling fast. */
export default function StudioLoading() {
  return (
    <div className="max-w-[1100px] mx-auto space-y-6">
      <div className="h-8 w-56 bg-bg-surface rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-bg-surface border border-border-subtle rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-bg-surface border border-border-subtle rounded-2xl animate-pulse" />
        <div className="h-48 bg-bg-surface border border-border-subtle rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
