"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function getScore(password: string): number {
  if (!password || password.length === 0) return 0;
  let score = 0;
  if (password.length >= 6) score = 1;
  if (score >= 1 && /\d/.test(password)) score = 2;
  if (score >= 2 && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
    score = 3;
  if (score >= 3 && password.length >= 12) score = 4;
  return score;
}

function getLabel(score: number): { text: string; className: string } {
  switch (score) {
    case 1:
      return { text: "Weak", className: "text-status-error" };
    case 2:
      return { text: "Fair", className: "text-status-warning" };
    case 3:
      return { text: "Good", className: "text-accent" };
    case 4:
      return { text: "Strong", className: "text-status-success" };
    default:
      return { text: "", className: "" };
  }
}

export interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const score = getScore(password);
  const { text, className } = getLabel(score);

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i < score
                ? score === 1
                  ? "bg-status-error"
                  : score === 2
                    ? "bg-status-warning"
                    : score === 3
                      ? "bg-accent/70"
                      : "bg-status-success"
                : "bg-bg-elevated"
            )}
          />
        ))}
      </div>
      {text && (
        <p className={cn("mt-1.5 font-mono text-[11px]", className)}>{text}</p>
      )}
    </div>
  );
}
