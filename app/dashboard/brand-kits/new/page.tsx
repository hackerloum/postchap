import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { getPlanLimits } from "@/lib/plans";
import { getUserPlan } from "@/lib/user-plan";
import { NewBrandKitForm } from "./NewBrandKitForm";

export const dynamic = "force-dynamic";

async function getKitCount(uid: string): Promise<number> {
  const snap = await getAdminDb()
    .collection("users")
    .doc(uid)
    .collection("brand_kits")
    .count()
    .get();
  return snap.data()?.count ?? 0;
}

export default async function NewBrandKitPage() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__session")?.value;
    if (!token) redirect("/login");
    const { getAdminAuth } = await import("@/lib/firebase/admin");
    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;
    const plan = await getUserPlan(uid);
    const limits = getPlanLimits(plan);
    const count = await getKitCount(uid);
    const canCreate = limits.brandKits === -1 || count < limits.brandKits;
    if (!canCreate) redirect("/dashboard/upgrade");
    return <NewBrandKitForm />;
  } catch {
    redirect("/login");
  }
}
