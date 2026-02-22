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
    <div className="px-4 py-8 sm:px-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-semibold text-2xl text-text-primary tracking-tight">
          Good morning 👋
        </h1>
        <p className="mt-1 font-mono text-xs text-text-muted">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="space-y-8">
        <DashboardContent initialKits={brandKits} />
      </div>
    </div>
  );
}
