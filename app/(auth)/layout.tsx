"use client";

import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-bg-base">
      <div className="flex w-full flex-col md:w-[60%] lg:w-1/2">
        {children}
      </div>
      <div className="hidden md:flex md:w-[40%] lg:w-1/2">
        <AuthVisualPanel />
      </div>
    </div>
  );
}
