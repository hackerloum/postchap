"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Modal } from "@/components/studio/ui";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  planName: string;
  blockingReason: string;
  benefits: string[];
  price: string;
};

export function UpgradeModal({
  open,
  onClose,
  planName,
  blockingReason,
  benefits,
  price,
}: UpgradeModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 max-w-[480px] mx-auto">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-[#E8FF4712] border border-[#E8FF4725] flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-[#E8FF47]" />
          </div>
          <h2 className="text-[20px] font-semibold text-[#fafafa] mb-2">
            Upgrade to {planName}
          </h2>
          <p className="text-[14px] text-[#a1a1aa] mb-4">{blockingReason}</p>
          <ul className="text-left w-full space-y-2 mb-6">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-2 text-[14px] text-[#a1a1aa]">
                <span className="text-[#E8FF47]">✓</span>
                {b}
              </li>
            ))}
          </ul>
          <p className="text-[24px] font-bold text-[#fafafa] mb-1">{price}</p>
          <p className="text-[12px] text-[#71717a] mb-4">billed monthly</p>
          <Link
            href="/studio/billing"
            className="w-full flex items-center justify-center h-11 rounded-lg bg-[#E8FF47] text-[#080808] text-[13px] font-semibold hover:bg-[#B8CC38] transition-colors mb-2"
          >
            Upgrade now
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] text-[#71717a] hover:text-[#a1a1aa]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </Modal>
  );
}
