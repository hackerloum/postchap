import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PosterChap",
  description: "AI-powered daily poster generation for your brand.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
