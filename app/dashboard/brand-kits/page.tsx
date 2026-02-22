import Link from "next/link";
import { BrandKitsList } from "./BrandKitsList";

export const dynamic = "force-dynamic";

export default function BrandKitsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/dashboard" className="font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1 mb-4">
            <span>←</span> Back to dashboard
          </Link>
          <h1 className="font-semibold text-2xl text-text-primary tracking-tight">Brand Kits</h1>
          <p className="mt-1 font-mono text-xs text-text-muted">Manage your brand identities</p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center gap-2 bg-accent text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-accent-dim transition-colors min-h-[44px] sm:self-end"
        >
          + New brand kit
        </Link>
      </div>

      <BrandKitsList />
    </div>
  );
}
