import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password — ArtMaster",
  description: "Reset your ArtMaster account password.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
