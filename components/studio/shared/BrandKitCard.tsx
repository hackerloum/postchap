"use client";

import Link from "next/link";
import { Badge } from "@/components/studio/ui";

type BrandKitCardProps = {
  id: string;
  clientId: string;
  name: string;
  isDefault: boolean;
  colors?: string[];
  selected?: boolean;
};

export function BrandKitCard({
  id,
  clientId,
  name,
  isDefault,
  colors = [],
  selected = false,
}: BrandKitCardProps) {
  return (
    <div
      className={`rounded-[10px] border p-4 transition-all ${
        selected
          ? "bg-[#E8FF4706] border-[#E8FF4740]"
          : "bg-[#111111] border-[#ffffff0f] hover:border-[#E8FF4730]"
      }`}
    >
      {colors.length > 0 && (
        <div className="flex mb-3">
          {colors.slice(0, 5).map((c, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border border-[#ffffff12] -ml-1 first:ml-0"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[13px] font-medium text-[#fafafa]">{name}</p>
        {isDefault && <Badge variant="accent">Default</Badge>}
      </div>
      <div className="flex items-center gap-3 text-[12px]">
        <Link
          href={`/studio/clients/${clientId}/brand-kits/${id}/edit`}
          className="text-[#a1a1aa] hover:text-[#E8FF47] transition-colors"
        >
          Edit →
        </Link>
        <Link
          href={`/studio/create?clientId=${clientId}&kitId=${id}`}
          className="text-[#a1a1aa] hover:text-[#E8FF47] transition-colors"
        >
          Generate with kit →
        </Link>
      </div>
    </div>
  );
}
