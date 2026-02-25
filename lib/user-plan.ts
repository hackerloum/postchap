import { getAdminDb } from "@/lib/firebase/admin";
import { getPlanLimits, type PlanId } from "@/lib/plans";

/**
 * Server-only: fetch user's plan from Firestore.
 */
export async function getUserPlan(uid: string): Promise<PlanId> {
  const snap = await getAdminDb().collection("users").doc(uid).get();
  const plan = snap.exists ? (snap.data()?.plan as string | undefined) : undefined;
  return (plan === "pro" || plan === "business" ? plan : "free") as PlanId;
}
