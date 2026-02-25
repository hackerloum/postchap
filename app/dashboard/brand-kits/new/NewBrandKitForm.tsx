"use client";

import { useRouter } from "next/navigation";
import BrandKitWizard from "@/components/BrandKitWizard";

export function NewBrandKitForm() {
  const router = useRouter();
  return (
    <BrandKitWizard
      submitButtonLabel="Create brand kit"
      onSuccess={() => router.push("/dashboard/brand-kits")}
      backHref="/dashboard/brand-kits"
    />
  );
}
