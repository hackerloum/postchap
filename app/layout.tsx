import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ArtMaster — Your brand posts itself. Every day.",
  description:
    "ArtMaster Platform automates daily social media poster generation for East African brands. AI-powered, brand-aware, one-click approve.",
  metadataBase: new URL("https://artmasterpro.com"),
  openGraph: {
    siteName: "ArtMaster Platform",
  },
  twitter: {
    site: "@artmasterpro",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              borderRadius: "12px",
            },
          }}
        />
      </body>
    </html>
  );
}
