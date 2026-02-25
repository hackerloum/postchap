export function AuthFormPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg-base overflow-y-auto">
      {/* Mobile logo — only visible on mobile */}
      <div className="flex lg:hidden items-center gap-2 px-6 pt-8 mb-8">
        <div className="w-6 h-6 bg-accent rounded-[4px] flex items-center justify-center">
          <div className="w-3 h-3 bg-black rounded-[2px]" />
        </div>
        <span className="font-semibold text-[14px] text-text-primary">
          ArtMaster
        </span>
      </div>

      {/* Form centered vertically */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center">
        <p className="font-mono text-[11px] text-text-muted">
          © {new Date().getFullYear()} ArtMaster Platform
        </p>
      </div>
    </div>
  );
}
