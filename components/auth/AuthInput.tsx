"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AuthInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  rightElement?: React.ReactNode;
  disabled?: boolean;
  autoComplete?: string;
  name?: string;
}

export function AuthInput({
  label,
  type,
  value,
  onChange,
  error,
  placeholder,
  rightElement,
  disabled,
  autoComplete,
  name,
}: AuthInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-apple text-xs font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            "w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 font-apple text-sm text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none transition-colors duration-150",
            error &&
              "border-status-error focus:border-status-error"
          )}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="font-mono text-[11px] text-status-error">{error}</p>
      )}
    </div>
  );
}
