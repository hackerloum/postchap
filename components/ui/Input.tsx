import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-mono text-[11px] text-text-muted"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2.5 bg-bg-surface border border-border-default
            rounded-lg text-sm text-text-primary placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
            transition-colors ${className}`}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
