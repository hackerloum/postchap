import { SessionRefresher } from "./SessionRefresher";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

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
