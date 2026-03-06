"use client";

import Link from "next/link";
import { Avatar, Badge } from "@/components/studio/ui";

type ClientCardProps = {
  id: string;
  name: string;
  industry?: string;
  status: string;
  postersThisMonth: number;
  monthlyQuota: number;
  variant?: "row" | "card";
};

export function ClientCard({
  id,
  name,
  industry,
  status,
  postersThisMonth,
  monthlyQuota,
  variant = "row",
}: ClientCardProps) {
  const percent = monthlyQuota > 0 ? Math.min((postersThisMonth / monthlyQuota) * 100, 100) : 0;
  const statusVariant =
    status === "active" ? "success" : status === "paused" ? "warning" : "default";

  if (variant === "card") {
    return (
      <div className="p-4 rounded-[10px] bg-[#111111] border border-[#ffffff0f] hover:border-[#ffffff18] transition-all">
        <Link href={`/studio/clients/${id}`} className="block">
          <div className="flex items-start gap-3 mb-3">
            <Avatar name={name} id={id} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-[#fafafa] truncate">{name}</p>
              {industry && (
                <Badge variant="default" className="mt-1">
                  {industry}
                </Badge>
              )}
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#ffffff08] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E8FF47] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[12px] text-[#71717a]">
              {postersThisMonth} of {monthlyQuota} posters
            </span>
            <Badge variant={statusVariant}>{status}</Badge>
          </div>
        </Link>
        <Link
          href={`/studio/create?clientId=${id}`}
          className="mt-3 flex items-center justify-center w-full h-9 rounded-lg border border-[#ffffff0f] text-[13px] font-medium text-[#a1a1aa] hover:border-[#E8FF4730] hover:text-[#E8FF47] transition-colors"
        >
          Generate →
        </Link>
      </div>
    );
  }

  return (
    <Link href={`/studio/clients/${id}`}>
      <div className="flex items-center gap-4 py-3 px-2 -mx-2 rounded-lg hover:bg-[#ffffff04] transition-colors cursor-pointer border-b border-[#ffffff06] last:border-0">
        <Avatar name={name} id={id} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#fafafa] truncate">{name}</p>
          {industry && <p className="text-[11px] text-[#71717a] truncate">{industry}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[15px] font-semibold text-[#fafafa]">
            {postersThisMonth}
          </p>
          <p className="text-[10px] text-[#71717a]">of {monthlyQuota}</p>
          <div className="mt-1 h-[3px] w-12 rounded-full bg-[#ffffff08] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E8FF47]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
