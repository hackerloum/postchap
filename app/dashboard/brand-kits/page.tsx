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
        tone: data.tone,
        platforms: Array.isArray(data.platforms) ? data.platforms : undefined,
        language: data.language,
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
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <BrandKitsList initialKits={brandKits} />
      </div>
    </div>
  );
}
