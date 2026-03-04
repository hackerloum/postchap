import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout — ArtMaster",
  description: "Complete your ArtMaster plan upgrade.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
