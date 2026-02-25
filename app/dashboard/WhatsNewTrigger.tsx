"use client";

import { useState, useEffect, useCallback } from "react";
import { Megaphone, X } from "lucide-react";

const CHANGELOG = [
  { date: "2026-02", items: ["Usage dashboard: see posters used this month and upgrade link.", "Onboarding checklist: complete profile, first poster, set schedule.", "AI-generated templates only: better style prompts from Freepik.", "Contact on posters: add phone, location, and website from brand kit.", "Platform sizes: pick Instagram, Facebook, X when creating.", "Inspiration flow: upload a reference image to match its style."] },
];

export function WhatsNewTrigger() {
  const [open, setOpen] = useState(false);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors hidden sm:flex items-center gap-1.5"
        title="What's new"
      >
        <Megaphone size={12} className="opacity-70" />
        What&apos;s new
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="bg-bg-base border border-border-default rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border-default">
              <h2 className="font-semibold text-base text-text-primary flex items-center gap-2">
                <Megaphone size={18} className="text-accent" />
                What&apos;s new
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {CHANGELOG.map((entry) => (
                <div key={entry.date}>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">{entry.date}</p>
                  <ul className="space-y-2">
                    {entry.items.map((item, i) => (
                      <li key={i} className="text-sm text-text-secondary flex gap-2">
                        <span className="text-accent shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
