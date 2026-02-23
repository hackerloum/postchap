import type { Metadata } from "next";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArtMaster Platform",
  description: "AI-powered daily poster generation for your brand",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-base text-text-primary antialiased">
        {children}
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
