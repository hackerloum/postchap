import type { Metadata } from "next";
import { SessionRefresher } from "./SessionRefresher";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <SessionRefresher />
      <DashboardNav />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
