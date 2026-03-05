import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Blog | ArtMaster",
  description:
    "Tips and guides for creating professional posters and social media content for your business. Free poster maker guides for African businesses.",
  openGraph: {
    title: "Blog | ArtMaster — Poster & Social Media Tips for African Businesses",
    description:
      "How-to guides, design tips, and marketing advice for small businesses. Free poster maker and Canva alternatives.",
    url: "https://artmasterpro.com/blog",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base">
      <header className="sticky top-0 z-50 bg-bg-base/90 backdrop-blur border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/artmasterwordmarklogo-03-03.webp"
              alt="ArtMaster"
              width={200}
              height={52}
              className="h-6 w-auto sm:h-8 object-contain"
            />
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/blog"
              className="text-sm font-medium text-accent"
            >
              Blog
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-text-muted hover:text-text-primary"
            >
              Pricing
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-accent text-black font-semibold px-4 py-2 rounded-lg hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
