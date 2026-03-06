"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { value: string; label: string }[];
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#71717a]"
            style={{ fontFamily: 'var(--studio-font)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={`w-full h-[38px] pl-[14px] pr-9 rounded-lg text-[13px] text-[#fafafa]
              bg-[#111111] border border-[#ffffff0f]
              focus:outline-none focus:border-[#E8FF4740] focus:ring-[3px] focus:ring-[#E8FF4708]
              transition-all duration-150 appearance-none cursor-pointer ${className}`}
            style={{
              fontFamily: 'var(--studio-font, -apple-system, "SF Pro Text", BlinkMacSystemFont, sans-serif)',
            }}
            {...props}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a] pointer-events-none"
            strokeWidth={2}
          />
        </div>
      </div>
    );
  }
);
Select.displayName = "StudioSelect";
