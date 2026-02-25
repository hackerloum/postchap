import { getAdminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { DashboardContent } from "./DashboardContent";

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
        brandLocation: data.brandLocation,
        tone: data.tone,
        platforms: Array.isArray(data.platforms) ? data.platforms : undefined,
        _createdAt: createdAt,
      };
    });
    withTime.sort((a, b) => b._createdAt - a._createdAt);
    return withTime.slice(0, 5).map(({ _createdAt, ...k }) => k);
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <DashboardContent initialKits={brandKits} />
    </div>
  );
}
