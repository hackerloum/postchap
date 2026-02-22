import { cookies } from "next/headers";
import Link from "next/link";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

async function getBrandKits(uid: string) {
  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
      id: string;
      brandName?: string;
      industry?: string;
      tagline?: string;
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      logoUrl?: string;
      brandLocation?: { country?: string };
    }>;
  } catch {
    return [];
  }
}

export default async function BrandKitsPage() {
  const uid = await getUser();
  const brandKits = uid ? await getBrandKits(uid) : [];

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

      {brandKits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-bg-surface border border-border-default rounded-2xl">
          <div className="w-20 h-20 rounded-2xl bg-bg-elevated border border-border-default flex items-center justify-center mb-4">
            <span className="text-3xl opacity-50">🎨</span>
          </div>
          <h2 className="font-semibold text-lg text-text-primary mb-2">No brand kits</h2>
          <p className="font-mono text-xs text-text-muted text-center max-w-sm mb-6">Create your first brand kit to personalize poster generation</p>
          <Link href="/onboarding" className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-sm px-6 py-3 rounded-lg hover:bg-accent-dim transition-colors">
            Create brand kit →
          </Link>
        </div>
      ) : (
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
                <button className="flex-1 py-2 rounded-lg bg-bg-elevated border border-border-default font-mono text-[11px] text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors">
                  Edit
                </button>
                <button className="flex-1 py-2 rounded-lg bg-bg-elevated border border-border-default font-mono text-[11px] text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors">
                  Duplicate
                </button>
                <button className="px-4 py-2 rounded-lg font-mono text-[11px] text-error hover:bg-error/10 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
