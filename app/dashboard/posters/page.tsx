import Link from "next/link";
import { PostersList } from "./PostersList";

export default function PostersPage() {
  return (
    <div className="px-4 py-8 sm:px-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard" className="font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1 mb-4">
          <span>←</span> Back to dashboard
        </Link>
        <h1 className="font-semibold text-2xl text-text-primary tracking-tight">My Posters</h1>
        <p className="mt-1 font-mono text-xs text-text-muted">View and manage your generated posters</p>
      </div>

      <PostersList />
    </div>
  );
}
