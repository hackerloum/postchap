"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import BrandKitWizard from "@/components/BrandKitWizard";

export default function NewClientBrandKitPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const router = useRouter();

  async function handleSubmit(kitData: Record<string, unknown>) {
    const token = await getClientIdToken();
    const res = await fetch(`/api/studio/clients/${clientId}/brand-kits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(kitData),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to create brand kit");
    }

    return res.json();
  }

  return (
    <div>
      <div className="max-w-3xl mx-auto px-5 pt-6">
        <Link
          href={`/studio/clients/${clientId}`}
          className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors font-mono text-[12px] mb-2"
        >
          <ArrowLeft size={14} />
          Back to client
        </Link>
      </div>
      <BrandKitWizard
        submitButtonLabel="Create brand kit"
        studioMode={{ clientId, onSubmit: handleSubmit }}
        onSuccess={() => router.push(`/studio/clients/${clientId}`)}
      />
    </div>
  );
}
