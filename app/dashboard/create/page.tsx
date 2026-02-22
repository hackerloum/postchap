import { cookies } from "next/headers";
import Link from "next/link";
import { getAdminDb } from "@/lib/firebase/admin";
import { CreatePosterForm } from "./CreatePosterForm";

export const dynamic = "force-dynamic";

async function getBrandKits(uid: string) {
  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .get();
    const withTime = snap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt?.toMillis?.() ?? 0;
      return {
        id: d.id,
        brandName: data.brandName,
        industry: data.industry,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        _createdAt: createdAt,
      };
    });
    withTime.sort((a, b) => b._createdAt - a._createdAt);
    return withTime.map(({ _createdAt, ...k }) => k);
  } catch {
    return [];
  }
}

export default async function CreatePosterPage() {
  let brandKits: Awaited<ReturnType<typeof getBrandKits>> = [];
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__session")?.value;
    if (token) {
      const { getAdminAuth } = await import("@/lib/firebase/admin");
      const decoded = await getAdminAuth().verifyIdToken(token);
      brandKits = await getBrandKits(decoded.uid);
    }
  } catch {
    brandKits = [];
  }

  return (
    <div className="px-4 py-8 sm:px-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard" className="font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1 mb-4">
          <span>←</span> Back to dashboard
        </Link>
        <h1 className="font-semibold text-2xl text-text-primary tracking-tight">Generate Poster</h1>
        <p className="mt-1 font-mono text-xs text-text-muted">Create a brand-perfect social poster in seconds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CreatePosterForm brandKits={brandKits} />
        </div>

        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
            <h3 className="font-semibold text-sm text-text-primary mb-3">Tips</h3>
            <ul className="space-y-2 font-mono text-[11px] text-text-secondary">
              <li className="flex gap-2">
                <span className="text-accent">✦</span>
                Keep headlines under 10 words for impact
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✦</span>
                Use specific dates and events when relevant
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✦</span>
                AI considers your brand tone and audience
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✦</span>
                Preview before downloading or scheduling
              </li>
            </ul>
          </div>

          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6">
            <h3 className="font-semibold text-sm text-text-primary mb-2">Platform sizes</h3>
            <p className="font-mono text-[11px] text-text-muted mb-3">Export formats available</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "Instagram", size: "1080×1080" },
                { name: "Facebook", size: "1200×630" },
                { name: "Twitter/X", size: "1200×675" },
                { name: "LinkedIn", size: "1200×627" },
                { name: "TikTok", size: "1080×1920" },
              ].map((p) => (
                <div key={p.name} className="flex justify-between items-center bg-bg-base/50 rounded-lg px-3 py-2">
                  <span className="font-mono text-[10px] text-text-secondary">{p.name}</span>
                  <span className="font-mono text-[10px] text-text-muted">{p.size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
