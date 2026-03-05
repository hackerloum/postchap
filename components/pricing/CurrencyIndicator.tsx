"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrency } from "@/lib/geo/useCurrency";
import { SUPPORTED_CURRENCIES_LIST } from "@/lib/geo/currencyMap";

/**
 * Small line below pricing header: "Prices shown in X · Change currency" with dropdown.
 * Override is saved to localStorage (am_currency_override); "Auto-detect" clears it.
 */
export function CurrencyIndicator() {
  const { currency, setOverride, override } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label = override
    ? `${currency.symbol} ${currency.name} (${currency.code})`
    : `${currency.name} (${currency.code})`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6" ref={ref}>
      <span className="font-mono text-[11px] text-text-muted">
        Prices shown in {label}
      </span>
      <span className="font-mono text-[11px] text-text-muted">·</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="font-mono text-[11px] text-accent hover:underline focus:outline-none"
        >
          Change currency
        </button>
        {open && (
          <div
            className="absolute top-full left-0 mt-1 py-1 min-w-[180px] rounded-lg border border-border-default bg-bg-surface shadow-lg z-50 max-h-[280px] overflow-y-auto"
            role="listbox"
          >
            <button
              type="button"
              role="option"
              className="w-full text-left px-3 py-2 font-mono text-[11px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              onClick={() => {
                setOverride("auto");
                setOpen(false);
              }}
            >
              Auto-detect
            </button>
            {SUPPORTED_CURRENCIES_LIST.map((c) => (
              <button
                key={c.code}
                type="button"
                role="option"
                className={`w-full text-left px-3 py-2 font-mono text-[11px] hover:bg-bg-elevated ${
                  currency.code === c.code
                    ? "text-accent bg-accent/10"
                    : "text-text-secondary hover:text-text-primary"
                }`}
                onClick={() => {
                  setOverride(c.code);
                  setOpen(false);
                }}
              >
                {c.symbol} {c.name} ({c.code})
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
