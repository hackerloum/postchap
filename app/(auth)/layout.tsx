import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";
import { AuthFormPanel } from "@/components/auth/AuthFormPanel";

export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-bg-base">
      <AuthLeftPanel />
      <AuthFormPanel>{children}</AuthFormPanel>
    </div>
  );
}
