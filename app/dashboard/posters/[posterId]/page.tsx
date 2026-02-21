"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PosterEditPage() {
  const params = useParams();
  const router = useRouter();
  const posterId = params.posterId as string;

  return (
    <div className="min-h-screen bg-bg-base px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Edit poster
        </h1>
        <p className="mt-2 font-sans text-sm text-text-secondary">
          Poster editing is available from your Brand Kit.
          You can approve or regenerate from the reveal screen.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-accent px-4 py-2.5 font-apple text-sm font-semibold text-black hover:opacity-90"
          >
            Back to dashboard
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border-default px-4 py-2.5 font-apple text-sm text-text-primary hover:bg-bg-surface"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
