import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookieAuth } from "@/lib/firebase/verify-auth";

export const metadata: Metadata = {
  title: "Set up ArtMaster Studio",
  robots: { index: false, follow: false },
};

export default async function StudioOnboardingLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;

  try {
    await verifyCookieAuth(token);
  } catch {
    redirect("/login");
  }

  return <>{children}</>;
}
