"use client";

import { forwardRef } from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = "", id, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full min-h-[80px] py-3 px-[14px] rounded-lg text-[13px] text-[#fafafa] placeholder:text-[#71717a]
            bg-[#111111] border border-[#ffffff0f]
            focus:outline-none focus:border-[#E8FF4740] focus:ring-[3px] focus:ring-[#E8FF4708]
            transition-all duration-150 ${className}`}
          style={{ fontFamily: 'var(--studio-font, -apple-system, "SF Pro Text", BlinkMacSystemFont, sans-serif)' }}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = "StudioTextarea";
