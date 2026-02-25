"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sparkles,
  Palette,
  Pencil,
  Copy,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { getAuthClient } from "@/lib/firebase/client";
import { getClientIdToken, refreshSessionCookie } from "@/lib/auth-client";
import { getPlanLimits } from "@/lib/plans";
import {
  getBrandKitsAction,
  deleteBrandKitAction,
  duplicateBrandKitAction,
  type BrandKitItem,
} from "./actions";

type Props = { initialKits: BrandKitItem[]; brandKitLimit?: number };

function BrandKitCard({
  kit,
  onEdit,
  onDuplicate,
  onDelete,
  onGenerate,
  busyId,
}: {
  kit: BrandKitItem;
  onEdit: (kit: BrandKitItem) => void;
  onDuplicate: (kit: BrandKitItem) => void;
  onDelete: (kit: BrandKitItem) => void;
  onGenerate: (kit: BrandKitItem) => void;
  busyId: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const colors = [kit.primaryColor, kit.secondaryColor, kit.accentColor].filter(Boolean);

  return (
    <div className="group relative bg-bg-surface border border-border-default rounded-2xl overflow-hidden hover:border-border-strong transition-all duration-200 flex flex-col">
      <div className="flex h-2 shrink-0">
        {colors.length > 0 ? (
          colors.map((color, i) => (
            <div key={i} className="flex-1" style={{ background: color }} />
          ))
        ) : (
          <div className="flex-1 bg-bg-elevated" />
        )}
        {colors.length < 3 &&
          Array.from({ length: 3 - colors.length }).map((_, i) => (
            <div key={`filler-${i}`} className="flex-1 bg-bg-elevated" />
          ))}
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden bg-bg-elevated border border-border-default flex items-center justify-center">
            {kit.logoUrl ? (
              <img
                src={kit.logoUrl}
                alt={kit.brandName ?? ""}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="font-bold text-[18px] text-text-primary">
                {kit.brandName?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-[15px] text-text-primary truncate">
                {kit.brandName}
              </p>
              {kit.enabled !== false && (
                <div className="flex items-center gap-1 bg-success/10 border border-success/20 rounded-full px-2 py-0.5 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="font-mono text-[9px] text-success">Active</span>
                </div>
              )}
            </div>
            <p className="font-mono text-[11px] text-text-muted capitalize">
              {kit.industry}
              {kit.brandLocation?.country ? ` · ${kit.brandLocation.country}` : ""}
            </p>
            {kit.tagline && (
              <p className="font-mono text-[11px] text-text-muted/70 mt-1 truncate italic">
                &quot;{kit.tagline}&quot;
              </p>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={15} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-8 z-20 w-44 bg-bg-elevated border border-border-default rounded-xl shadow-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(kit);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-colors text-left"
                  >
                    <Pencil size={13} />
                    Edit brand kit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDuplicate(kit);
                      setMenuOpen(false);
                    }}
                    disabled={!!busyId}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-colors text-left disabled:opacity-50"
                  >
                    <Copy size={13} />
                    Duplicate
                  </button>
                  <div className="h-px bg-border-subtle mx-2 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(kit);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-error hover:bg-error/5 transition-colors text-left"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {[
            { label: "Tone", value: kit.tone },
            {
              label: "Platforms",
              value: kit.platforms?.length ? `${kit.platforms.length} platforms` : null,
            },
            { label: "Language", value: kit.language },
            { label: "City", value: kit.brandLocation?.city },
          ]
            .filter((r) => r.value)
            .map((row) => (
              <div key={row.label}>
                <p className="font-mono text-[9px] uppercase tracking-wider text-text-muted mb-0.5">
                  {row.label}
                </p>
                <p className="font-mono text-[11px] text-text-secondary capitalize truncate">
                  {String(row.value)}
                </p>
              </div>
            ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">
            Palette
          </span>
          <div className="flex gap-1.5 items-center">
            {[
              { color: kit.primaryColor, label: "Primary" },
              { color: kit.secondaryColor, label: "Secondary" },
              { color: kit.accentColor, label: "Accent" },
            ]
              .filter((c) => c.color)
              .map((c) => (
                <div
                  key={c.label}
                  className="w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform cursor-default"
                  style={{ background: c.color }}
                  title={`${c.label}: ${c.color}`}
                />
              ))}
            {kit.primaryColor && (
              <span className="font-mono text-[9px] text-text-muted/50 ml-1 truncate max-w-[80px]">
                {kit.primaryColor}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-border-subtle/50 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onGenerate(kit)}
          className="flex items-center gap-1.5 bg-accent text-black font-semibold text-[12px] px-3 py-1.5 rounded-lg hover:bg-accent-dim transition-colors min-h-[32px]"
        >
          <Sparkles size={12} />
          Generate poster
        </button>
        <button
          type="button"
          onClick={() => onEdit(kit)}
          className="flex items-center gap-1.5 text-text-muted font-mono text-[11px] hover:text-text-secondary transition-colors"
        >
          <Pencil size={11} />
          Edit
        </button>
      </div>
    </div>
  );
}

export function BrandKitsList({ initialKits, brandKitLimit = 1 }: Props) {
  const router = useRouter();
  const [brandKits, setBrandKits] = useState<BrandKitItem[]>(initialKits);
  const [loading, setLoading] = useState(initialKits.length === 0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrandKitItem | null>(null);
  const authChecked = useRef(false);
  const canCreateMore = brandKitLimit === -1 || brandKits.length < brandKitLimit;

  useEffect(() => {
    if (initialKits.length > 0) {
      setBrandKits(initialKits);
      setLoading(false);
      authChecked.current = true;
      return;
    }
  }, [initialKits]);

  useEffect(() => {
    if (initialKits.length > 0) return;
    const auth = getAuthClient();
    let cancelled = false;
    const fetchWithAuth = async () => {
      setLoading(true);
      try {
        await refreshSessionCookie();
        const token = await getClientIdToken();
        const data = await getBrandKitsAction(token ?? undefined);
        if (!cancelled) setBrandKits(data);
      } catch {
        if (!cancelled) setBrandKits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const unsubscribe = auth.onAuthStateChanged((user) => {
      authChecked.current = true;
      if (cancelled) return;
      if (user) {
        fetchWithAuth();
      } else {
        setBrandKits([]);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [initialKits.length]);

  async function handleCreateNew() {
    const token = await getClientIdToken();
    const [kits, meRes] = await Promise.all([
      getBrandKitsAction(token ?? undefined),
      fetch("/api/me", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    ]);
    const plan = meRes.ok ? ((await meRes.json()) as { plan?: string })?.plan ?? "free" : "free";
    const limit = getPlanLimits(plan).brandKits;
    const allowed = limit === -1 || kits.length < limit;
    if (!allowed) {
      router.push("/dashboard/upgrade");
      return;
    }
    if (kits.length === 0) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard/brand-kits/new");
    }
  }

  function handleEdit(kit: BrandKitItem) {
    router.push(`/dashboard/brand-kits/${kit.id}/edit`);
  }

  async function handleDuplicate(kit: BrandKitItem) {
    if (busyId) return;
    setBusyId(kit.id);
    const token = await getClientIdToken();
    const result = await duplicateBrandKitAction(kit.id, token ?? undefined);
    setBusyId(null);
    if (result.success) {
      const list = await getBrandKitsAction(token ?? undefined);
      setBrandKits(list);
      toast.success("Brand kit duplicated");
    } else {
      toast.error(result.error ?? "Failed to duplicate");
    }
  }

  async function handleDelete(kit: BrandKitItem) {
    if (busyId) return;
    setBusyId(kit.id);
    const token = await getClientIdToken();
    const result = await deleteBrandKitAction(kit.id, token ?? undefined);
    setBusyId(null);
    setDeleteTarget(null);
    if (result.success) {
      setBrandKits((prev) => prev.filter((k) => k.id !== kit.id));
      toast.success("Brand kit deleted");
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
  }

  function handleGenerate(kit: BrandKitItem) {
    router.push("/dashboard/create");
  }

  return (
    <>
      {/* Page header — always visible */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-semibold text-[20px] text-text-primary tracking-tight">
            Brand Kits
          </h1>
          <p className="font-mono text-[12px] text-text-muted mt-1">
            {loading ? "0" : brandKits.length} kit{(loading ? 0 : brandKits.length) !== 1 ? "s" : ""} · Define your brand identity for poster generation
          </p>
        </div>
        {canCreateMore ? (
          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-[13px] px-4 py-2.5 rounded-lg hover:bg-accent-dim transition-colors min-h-[40px]"
          >
            <Plus size={14} />
            New brand kit
          </button>
        ) : (
          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center gap-2 bg-bg-elevated border border-border-default text-text-secondary font-semibold text-[13px] px-4 py-2.5 rounded-lg hover:border-accent/40 hover:text-accent transition-colors min-h-[40px]"
          >
            Upgrade to add more
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="h-2 bg-bg-elevated" />
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-bg-elevated" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-bg-elevated rounded" />
                    <div className="h-3 w-1/2 bg-bg-elevated rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="space-y-1">
                      <div className="h-2 w-12 bg-bg-elevated rounded" />
                      <div className="h-3 w-20 bg-bg-elevated rounded" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-12 bg-bg-elevated/50 mx-5 mb-5 rounded-lg" />
            </div>
          ))}
        </div>
      ) : brandKits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-bg-surface border border-border-default flex items-center justify-center mb-4">
            <Palette size={24} className="text-text-muted" />
          </div>
          <h2 className="font-semibold text-[17px] text-text-primary mb-2">
            No brand kits yet
          </h2>
          <p className="font-mono text-[12px] text-text-muted max-w-xs mb-6 leading-relaxed">
            Create your first brand kit to start generating on-brand social media posters automatically.
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            className="bg-accent text-black font-semibold text-[13px] px-6 py-3 rounded-xl hover:bg-accent-dim transition-colors inline-flex items-center gap-2 min-h-[44px]"
          >
            <Plus size={15} />
            Create first brand kit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {brandKits.map((kit) => (
            <BrandKitCard
              key={kit.id}
              kit={kit}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={setDeleteTarget}
              onGenerate={handleGenerate}
              busyId={busyId}
            />
          ))}
          {canCreateMore ? (
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border-default hover:border-accent/40 hover:bg-accent/3 transition-all duration-200 min-h-[280px] group"
            >
              <div className="w-10 h-10 rounded-xl border-2 border-dashed border-border-default group-hover:border-accent/40 flex items-center justify-center transition-colors">
                <Plus size={18} className="text-text-muted group-hover:text-accent transition-colors" />
              </div>
              <p className="font-mono text-[11px] text-text-muted group-hover:text-text-secondary transition-colors">
                New brand kit
              </p>
            </button>
          ) : (
            <Link
              href="/dashboard/upgrade"
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border-default hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 min-h-[280px] group"
            >
              <p className="font-semibold text-[13px] text-text-primary">
                Free plan: 1 brand kit
              </p>
              <p className="font-mono text-[11px] text-text-muted text-center px-4">
                Upgrade to add more brand kits
              </p>
              <span className="text-accent font-mono text-[11px] group-hover:underline">
                Upgrade plan →
              </span>
            </Link>
          )}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-[16px] text-text-primary mb-2">
              Delete brand kit?
            </h3>
            <p className="font-mono text-[12px] text-text-muted mb-6 leading-relaxed">
              &quot;{deleteTarget.brandName}&quot; will be permanently deleted. This
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-bg-elevated border border-border-default text-text-secondary font-medium text-[13px] py-2.5 rounded-lg hover:border-border-strong transition-colors min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 bg-error/10 border border-error/30 text-error font-semibold text-[13px] py-2.5 rounded-lg hover:bg-error/15 transition-colors min-h-[40px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
