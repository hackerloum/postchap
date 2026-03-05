import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookieAuth } from "@/lib/firebase/verify-auth";
import { getAgencyForUser } from "@/lib/studio/db";
import { SessionRefresher } from "@/app/dashboard/SessionRefresher";
import { StudioNav } from "@/components/studio/StudioNav";

export const metadata: Metadata = {
  title: "ArtMaster Studio",
  robots: { index: false, follow: false, noarchive: true },
};

// Routes that don't require an agency (onboarding, team join, client portal)
const BYPASS_ROUTES = ["/studio/onboarding", "/studio/join", "/studio/portal"];

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-invoke-path") ?? "";

  // Skip agency check for public/pre-agency routes
  const isBypassRoute = BYPASS_ROUTES.some((r) => pathname.startsWith(r));
  if (isBypassRoute) {
    return <>{children}</>;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;

  let uid: string | null = null;
  try {
    const decoded = await verifyCookieAuth(token);
    uid = decoded.uid;
  } catch {
    redirect("/login");
  }

  if (!uid) redirect("/login");

  const agency = await getAgencyForUser(uid);
  if (!agency) {
    redirect("/studio/onboarding");
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <SessionRefresher />
      <StudioNav />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
