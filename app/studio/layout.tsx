import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Playfair_Display, DM_Mono } from "next/font/google";
import { verifyCookieAuth } from "@/lib/firebase/verify-auth";
import { getAgencyForUser } from "@/lib/studio/db";
import { SessionRefresher } from "@/app/dashboard/SessionRefresher";
import { StudioShell } from "@/components/studio/StudioShell";
import "./studio-theme.css";

export const metadata: Metadata = {
  title: "ArtMaster Studio",
  robots: { index: false, follow: false, noarchive: true },
};

// Routes that don't require an agency or auth (Studio has its own login/signup)
const BYPASS_ROUTES = ["/studio/onboarding", "/studio/join", "/studio/portal", "/studio/login", "/studio/signup"];

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
    redirect("/studio/login");
  }

  if (!uid) redirect("/studio/login");

  let agency = null;
  try {
    agency = await getAgencyForUser(uid);
  } catch {
    // Firestore unavailable or index missing — treat as no agency yet
  }
  if (!agency) {
    redirect("/studio/onboarding");
  }

  const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
  });
  const dmMono = DM_Mono({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-dm-mono",
    display: "swap",
  });

  return (
    <>
      <SessionRefresher />
      <StudioShell className={`${playfair.variable} ${dmMono.variable}`}>{children}</StudioShell>
    </>
  );
}
