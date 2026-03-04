import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Free Account — AI Poster Generator | ArtMaster",
  description:
    "Join ArtMaster free. Set up your brand kit in 5 minutes and start getting AI-generated social media posters every day — no designer, no effort.",
  alternates: { canonical: "https://artmasterpro.com/signup" },
  openGraph: {
    title: "Create Your Free ArtMaster Account",
    description:
      "Join thousands of African businesses posting every day on social media with ArtMaster AI.",
    url: "https://artmasterpro.com/signup",
    images: [
      {
        url: "/og/signup.png",
        width: 1200,
        height: 630,
        alt: "Sign up for ArtMaster",
      },
    ],
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
