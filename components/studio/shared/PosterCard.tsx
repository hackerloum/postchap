"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Download } from "lucide-react";
import { Avatar, Badge } from "@/components/studio/ui";

type PosterCardProps = {
  id: string;
  imageUrl: string;
  clientName?: string;
  clientId?: string;
  date?: string;
  status: string;
  format?: "grid" | "list";
  onApprove?: (id: string) => void;
  onRevise?: (id: string) => void;
  showActions?: boolean;
};

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger"> = {
  draft: "default",
  pending: "warning",
  approved: "success",
  revision_requested: "danger",
};

export function PosterCard({
  id,
  imageUrl,
  clientName,
  clientId,
  date,
  status,
  format = "grid",
  onApprove,
  onRevise,
  showActions = true,
}: PosterCardProps) {
  const [hover, setHover] = useState(false);

  if (format === "list") {
    return (
      <Link href={`/studio/posters?poster=${id}`}>
        <div className="flex items-center gap-4 py-3 border-b border-[#ffffff08] hover:bg-[#ffffff04] transition-colors">
          <div className="w-10 h-10 rounded-lg bg-[#181818] overflow-hidden shrink-0">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            {clientName && <p className="text-[13px] font-medium text-[#fafafa]">{clientName}</p>}
            {date && <p className="text-[11px] text-[#71717a]">{date}</p>}
          </div>
          <Badge variant={STATUS_VARIANT[status] ?? "default"}>{status.replace("_", " ")}</Badge>
        </div>
      </Link>
    );
  }

  return (
    <div
      className="relative rounded-[10px] bg-[#111111] border border-[#ffffff0f] overflow-hidden group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="aspect-square bg-[#181818] relative">
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2">
          <Badge variant={STATUS_VARIANT[status] ?? "default"}>{status.replace("_", " ")}</Badge>
        </div>
        {showActions && (onApprove || onRevise) && hover && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-2 transition-opacity">
            {onApprove && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onApprove(id); }}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4ade80] text-[#080808] text-[13px] font-medium hover:bg-[#4ade80]/90"
              >
                <CheckCircle2 size={16} />
                Approve
              </button>
            )}
            {onRevise && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onRevise(id); }}
                className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#ffffff18] text-[#fafafa] text-[13px] font-medium hover:bg-[#ffffff08]"
              >
                <MessageCircle size={16} />
                Revise
              </button>
            )}
          </div>
        )}
        {status === "approved" && showActions && (
          <Link
            href={`/api/posters/${id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[12px] font-medium text-[#E8FF47] hover:underline"
          >
            <Download size={14} />
            Download
          </Link>
        )}
      </div>
      {(clientName || date) && (
        <div className="flex items-center gap-2 p-2 border-t border-[#ffffff08]">
          {clientId && (
            <Avatar name={clientName ?? ""} id={clientId} size="sm" />
          )}
          {clientName && <span className="text-[11px] text-[#fafafa] truncate flex-1">{clientName}</span>}
          {date && <span className="text-[10px] text-[#71717a]">{date}</span>}
        </div>
      )}
    </div>
  );
}
