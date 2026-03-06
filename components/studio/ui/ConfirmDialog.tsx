"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  requireTypedName?: string;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  requireTypedName,
}: ConfirmDialogProps) {
  const [typedName, setTypedName] = useState("");
  const [loading, setLoading] = useState(false);

  const mustType: boolean = Boolean(requireTypedName && typedName.trim() !== requireTypedName);

  async function handleConfirm() {
    if (mustType) return;
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setTypedName("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
            style={{
              backgroundColor: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <span className="text-[#ef4444] text-lg">⚠</span>
          </div>
          <h2 className="text-[17px] font-semibold text-[#fafafa] mb-2">
            {title}
          </h2>
          <p className="text-[14px] text-[#a1a1aa] mb-4">{description}</p>
          {requireTypedName && (
            <input
              type="text"
              placeholder={`Type "${requireTypedName}" to confirm`}
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className="w-full max-w-xs h-[38px] px-3 rounded-lg text-[13px] text-[#fafafa] placeholder:text-[#71717a] bg-[#111111] border border-[#ffffff0f] mb-4 focus:outline-none focus:border-[#E8FF4740]"
            />
          )}
          <div className="flex gap-3 w-full max-w-xs">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleConfirm}
              disabled={loading || mustType}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
