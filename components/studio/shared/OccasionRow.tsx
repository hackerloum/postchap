"use client";

import Link from "next/link";
import { Badge } from "@/components/studio/ui";

type OccasionRowProps = {
  clientId: string;
  clientName: string;
  title: string;
  type?: string;
  date: string;
  daysUntil: number;
};

function urgencyVariant(days: number): "danger" | "warning" | "success" | "default" {
  if (days <= 3) return "danger";
  if (days <= 14) return "warning";
  return "success";
}

export function OccasionRow({
  clientId,
  clientName,
  title,
  type,
  date,
  daysUntil,
}: OccasionRowProps) {
  const daysLabel = daysUntil === 0 ? "TODAY" : `${daysUntil}d`;
  const parts = date.split("-");
  const dayNum = parts.length >= 3 ? parts[2] : "";
  const monthNum = parts.length >= 2 ? parts[1] : "";
  const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNum ? MONTHS[parseInt(monthNum, 10)] ?? monthNum : "";

  return (
    <div className="flex items-center gap-4 py-2.5 px-4 rounded-lg hover:bg-[#ffffff04] transition-colors">
      <div className="w-[52px] shrink-0 text-center">
        <p className="text-[22px] font-bold text-[#fafafa] leading-none">
          {dayNum || "—"}
        </p>
        <p className="text-[10px] uppercase text-[#71717a]">{month}</p>
      </div>
      <div className="w-px h-10 bg-[#ffffff08] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[#fafafa]">{title}</p>
        <p className="text-[12px] text-[#71717a]">{clientName}</p>
        {type && (
          <Badge variant="default" className="mt-1">
            {type}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={urgencyVariant(daysUntil)}>{daysLabel}</Badge>
        <Link
          href={`/studio/create?clientId=${clientId}`}
          className="text-[11px] font-medium text-[#E8FF47] hover:underline"
        >
          Generate →
        </Link>
      </div>
    </div>
  );
}
