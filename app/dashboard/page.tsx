import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import {
  getBrandKits,
  getPosters,
  getActivity,
  getPosterJobs,
} from "@/lib/firebase/firestore";
import { DashboardClient } from "./DashboardClient";

const SESSION_COOKIE = "__session";

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (typeof v === "object" && v !== null && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function")
    return (v as { toDate: () => Date }).toDate();
  if (typeof v === "string") return new Date(v);
  return null;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) redirect("/login");

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(session);
    uid = decoded.uid;
  } catch {
    redirect("/login");
  }

  const [brandKits, posters, activity, jobs] = await Promise.all([
    getBrandKits(uid),
    getPosters(uid),
    getActivity(uid, 10),
    getPosterJobs(uid),
  ]);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const postersThisWeek = posters.filter((p) => {
    const d = toDate(p.createdAt);
    return d && d >= startOfWeek;
  }).length;

  const approvedCount = posters.filter((p) => p.status === "approved").length;
  const approvalRate =
    posters.length > 0 ? Math.round((approvedCount / posters.length) * 100) : 0;

  const enabledBrandKitIds = new Set(
    jobs.filter((j) => j.enabled).map((j) => j.brandKitId)
  );
  const activeBrandKits = brandKits.filter((k) =>
    enabledBrandKitIds.has(k.id)
  ).length;

  const lastGenerated =
    posters.length > 0 ? toDate(posters[0].createdAt) : null;

  const serializedPosters = posters.map((p) => ({
    ...p,
    createdAt: toDate(p.createdAt)?.toISOString() ?? null,
    updatedAt: toDate(p.updatedAt)?.toISOString() ?? null,
  }));
  const serializedActivity = activity.map((a) => ({
    ...a,
    createdAt: toDate(a.createdAt)?.toISOString() ?? null,
  }));

  return (
    <DashboardClient
      brandKits={brandKits}
      posters={serializedPosters}
      activity={serializedActivity}
      postersThisWeek={postersThisWeek}
      approvalRate={approvalRate}
      activeBrandKits={activeBrandKits}
      lastGenerated={lastGenerated?.toISOString() ?? null}
    />
  );
}
