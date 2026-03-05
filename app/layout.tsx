import type { Metadata } from "next";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/CookieConsent";
import { SessionRefresher } from "@/app/dashboard/SessionRefresher";
import { CurrencyProvider } from "@/lib/geo/CurrencyContext";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://artmasterpro.com"),
  title: {
    template: "%s | ArtMaster",
    default: "ArtMaster — AI Poster Generator for African Businesses",
  },
  description:
    "ArtMaster generates professional social media posters every day, tailored to your brand. Set up your brand kit once — get daily AI-crafted posters automatically. Built for Africa, used worldwide.",
  keywords: [
    "AI poster generator",
    "social media poster maker Africa",
    "automated brand posters",
    "daily Instagram posts",
    "AI marketing tool Tanzania",
    "AI marketing tool Kenya",
    "AI marketing tool Nigeria",
    "brand kit poster generator",
    "poster maker Africa",
    "social media automation Africa",
    "no designer needed",
    "Canva alternative Africa",
  ],
  authors: [{ name: "ArtMaster", url: "https://artmasterpro.com" }],
  creator: "ArtMaster",
  publisher: "ArtMaster",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://artmasterpro.com",
    siteName: "ArtMaster",
    title: "ArtMaster — AI Poster Generator for African Businesses",
    description:
      "Generate stunning daily social media posters tailored to your brand. Set up once, post every day. Built for Africa.",
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "ArtMaster — AI Poster Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArtMaster — AI Poster Generator for African Businesses",
    description:
      "Generate stunning daily social media posters tailored to your brand.",
    images: ["/og/default.png"],
    creator: "@artmasterpro",
    site: "@artmasterpro",
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
  alternates: { canonical: "https://artmasterpro.com" },
  verification: {
    google: "googlea2b9b8ae9ae8f569",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-base text-text-primary antialiased">
        <CurrencyProvider>
          {/* Keeps the __session cookie valid on every page, not just the dashboard */}
          <SessionRefresher />
          {children}
        </CurrencyProvider>
        <CookieConsent />
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "#fafafa",
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, "Segoe UI", Roboto, sans-serif',
              fontSize: "12px",
              borderRadius: "12px",
            },
          }}
        />
      </body>
    </html>
  );
}
