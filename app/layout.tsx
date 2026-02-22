import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArtMaster Platform",
  description: "AI-powered daily poster generation for your brand",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
