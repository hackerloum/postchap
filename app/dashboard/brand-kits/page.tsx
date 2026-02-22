import Link from "next/link";
import { cookies } from "next/headers";
import { getAdminDb } from "@/lib/firebase/admin";
import { BrandKitsList } from "./BrandKitsList";

export const dynamic = "force-dynamic";

async function getBrandKits(uid: string) {
  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .get();
    const kits = snap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt?.toMillis?.() ?? data.createdAt ?? 0;
      return {
        id: d.id,
        brandName: data.brandName,
        industry: data.industry,
        tagline: data.tagline,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        logoUrl: data.logoUrl,
        brandLocation: data.brandLocation,
        _createdAt: createdAt,
      };
    });
    kits.sort((a, b) => (b._createdAt as number) - (a._createdAt as number));
    return kits.map(({ _createdAt, ...k }) => k);
  } catch {
    return [];
  }
}

export default async function BrandKitsPage() {
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

      <BrandKitsList initialKits={brandKits} />
    </div>
  );
}
