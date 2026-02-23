"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Palette } from "lucide-react";
import { toast } from "sonner";
import { getClientIdToken } from "@/lib/auth-client";
import { getBrandKitsAction, deleteBrandKitAction, duplicateBrandKitAction, type BrandKitItem } from "./actions";

type Props = { initialKits: BrandKitItem[] };

export function BrandKitsList({ initialKits }: Props) {
  const router = useRouter();
  const [brandKits, setBrandKits] = useState<BrandKitItem[]>(initialKits);
  const [loading, setLoading] = useState(initialKits.length === 0);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (initialKits.length > 0) {
      setBrandKits(initialKits);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const token = await getClientIdToken();
        const data = await getBrandKitsAction(token ?? undefined);
        setBrandKits(data);
      } catch {
        setBrandKits([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [initialKits.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (brandKits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-bg-surface border border-border-default rounded-2xl">
        <div className="w-20 h-20 rounded-2xl bg-bg-elevated border border-border-default flex items-center justify-center mb-4 text-text-muted">
          <Palette size={40} className="opacity-50" />
        </div>
        <h2 className="font-semibold text-lg text-text-primary mb-2">No brand kits</h2>
        <p className="font-mono text-xs text-text-muted text-center max-w-sm mb-6">Create your first brand kit to personalize poster generation</p>
        <Link href="/onboarding" className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-sm px-6 py-3 rounded-lg hover:bg-accent-dim transition-colors">
          Create brand kit →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {brandKits.map((kit) => (
        <div
          key={kit.id}
          className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden hover:border-border-strong transition-all"
        >
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {kit.logoUrl ? (
                  <img src={kit.logoUrl} alt="" className="w-14 h-14 rounded-xl object-contain bg-bg-elevated" />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg text-text-primary"
                    style={{ background: kit.primaryColor ? `${kit.primaryColor}33` : "#333", border: `2px solid ${kit.primaryColor || "#555"}` }}
                  >
                    {kit.brandName?.[0]?.toUpperCase() ?? "A"}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-base text-text-primary">{kit.brandName}</h3>
                  <p className="font-mono text-[11px] text-text-muted">{kit.industry} · {kit.brandLocation?.country || "—"}</p>
                  {kit.tagline && <p className="font-mono text-[11px] text-text-secondary mt-1">{kit.tagline}</p>}
                </div>
              </div>
              <span className="font-mono text-[10px] text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5 shrink-0">Active</span>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <span className="font-mono text-[10px] text-text-muted">Colors</span>
              <div className="flex gap-1.5">
                {[kit.primaryColor, kit.secondaryColor, kit.accentColor].map((c, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-lg border border-white/10 shrink-0"
                    style={{ background: c || "#333" }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-3 border-t border-border-subtle flex gap-2">
            <button
              onClick={() => router.push(`/dashboard/brand-kits/${kit.id}/edit`)}
              className="flex-1 py-2 rounded-lg bg-bg-elevated border border-border-default font-mono text-[11px] text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                if (busyId) return;
                setBusyId(kit.id);
                const token = await getClientIdToken();
                const result = await duplicateBrandKitAction(kit.id, token ?? undefined);
                setBusyId(null);
                if (result.success) {
                  const list = await getBrandKitsAction(token ?? undefined);
                  setBrandKits(list);
                  toast.success("Brand kit duplicated");
                } else toast.error(result.error ?? "Failed to duplicate");
              }}
              disabled={!!busyId}
              className="flex-1 py-2 rounded-lg bg-bg-elevated border border-border-default font-mono text-[11px] text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors disabled:opacity-50"
            >
              Duplicate
            </button>
            <button
              onClick={async () => {
                if (busyId || !confirm("Delete this brand kit? This cannot be undone.")) return;
                setBusyId(kit.id);
                const token = await getClientIdToken();
                const result = await deleteBrandKitAction(kit.id, token ?? undefined);
                setBusyId(null);
                if (result.success) {
                  setBrandKits((prev) => prev.filter((k) => k.id !== kit.id));
                  toast.success("Brand kit deleted");
                } else toast.error(result.error ?? "Failed to delete");
              }}
              disabled={!!busyId}
              className="px-4 py-2 rounded-lg font-mono text-[11px] text-error hover:bg-error/10 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
