import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — ArtMaster",
  description:
    "Sign in to your ArtMaster account to manage your brand kits and AI-generated social media posters.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
