"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PosterEditor } from "@/components/editor/PosterEditor";
import { getClientIdToken } from "@/lib/auth-client";
import type { PosterLayout } from "@/lib/generation/layoutTypes";
import Link from "next/link";

interface PosterData {
  id: string;
  layout: PosterLayout | null;
  hasEditableLayout: boolean;
  brandKitId: string | null;
  headline: string;
}

interface BrandKitData {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export default function EditPosterPage() {
  const params    = useParams();
  const router    = useRouter();
  const posterId  = typeof params.id === "string" ? params.id : "";

  const [poster,    setPoster]    = useState<PosterData | null>(null);
  const [brandKit,  setBrandKit]  = useState<BrandKitData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // ── Fetch poster ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!posterId) return;
    (async () => {
      try {
        const token = await getClientIdToken();
        const res = await fetch(`/api/posters/${posterId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Failed to load poster");
        }
        const data = (await res.json()) as PosterData;
        setPoster(data);

        // If not editable layout, redirect back to gallery
        if (!data.hasEditableLayout || !data.layout) {
          router.replace(`/dashboard/posters?id=${posterId}`);
          return;
        }

        // Fetch brand kit for color swatches
        if (data.brandKitId) {
          try {
            const bkRes = await fetch(`/api/brand-kits/${data.brandKitId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (bkRes.ok) {
              const bk = (await bkRes.json()) as BrandKitData;
              setBrandKit(bk);
            }
          } catch {
            // non-fatal
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, [posterId, router]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleSaved(newUrl: string, updatedLayout: PosterLayout) {
    // Update local poster layout state after save
    setPoster((prev) =>
      prev ? { ...prev, layout: updatedLayout } : prev
    );
    console.log("[edit page] Poster saved:", newUrl);
  }

  // ── Brand color swatches ──────────────────────────────────────────────────
  const brandColors: string[] = [
    brandKit?.primaryColor,
    brandKit?.secondaryColor,
    brandKit?.accentColor,
    "#FFFFFF",
    "#000000",
  ].filter((c): c is string => !!c && c.startsWith("#"));

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#080808]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#e8ff47] border-t-transparent
                          rounded-full animate-spin mx-auto" />
          <p className="text-[#555] text-sm">Loading editor…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#080808]">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-white font-semibold">Could not load poster</p>
          <p className="text-[#555] text-sm">{error}</p>
          <Link
            href="/dashboard/posters"
            className="inline-block text-sm text-[#e8ff47] underline underline-offset-4"
          >
            Back to posters
          </Link>
        </div>
      </div>
    );
  }

  if (!poster?.layout) {
    // Redirect already triggered in useEffect — show nothing while navigating
    return null;
  }

  return (
    <PosterEditor
      layout={{ ...poster.layout, posterId }}
      posterId={posterId}
      brandColors={brandColors.length > 0 ? brandColors : undefined}
      onSaved={handleSaved}
    />
  );
}
