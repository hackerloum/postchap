"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PosterEditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PosterEditError]", error);
  }, [error]);

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-[#080808] gap-4 p-8">
      <p className="text-white font-semibold text-center">Something went wrong in the editor</p>
      <p className="text-[#888] text-sm text-center max-w-sm font-mono break-all">
        {error.message || "Unknown error"}
      </p>
      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#e8ff47] text-black text-sm font-bold rounded hover:bg-yellow-300 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard/posters"
          className="text-sm text-[#555] underline underline-offset-4 hover:text-white"
        >
          Back to posters
        </Link>
      </div>
    </div>
  );
}
