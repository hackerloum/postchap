"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Sparkles } from "lucide-react";
import type { CoachPayload } from "@/app/api/brand-kits/coach/route";

interface BrandCoachPanelProps {
  /** Current brand data (partial) to send to coach API */
  payload: CoachPayload;
  /** Wizard step or "edit" for edit page */
  step?: "brand" | "visual" | "audience" | "content" | "edit";
  /** Callback when user clicks to apply a suggested field value */
  onApplySuggestion?: (field: string, value: string) => void;
  /** Debounce ms before calling API */
  debounceMs?: number;
  /** Auth token for API */
  getToken?: () => Promise<string | null>;
  className?: string;
}

interface CoachResult {
  recommendations: string[];
  questions: string[];
  suggestedFields?: Record<string, string>;
}

export function BrandCoachPanel({
  payload,
  step = "edit",
  onApplySuggestion,
  debounceMs = 800,
  getToken,
  className = "",
}: BrandCoachPanelProps) {
  const [result, setResult] = useState<CoachResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPayloadRef = useRef<string>("");

  const fetchCoach = useCallback(
    async (body: CoachPayload) => {
      const token = getToken ? await getToken() : null;
      const res = await fetch("/api/brand-kits/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...body, step }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to load suggestions");
      }
      return res.json() as Promise<CoachResult>;
    },
    [step, getToken]
  );

  useEffect(() => {
    const payloadStr = JSON.stringify(payload);
    if (payloadStr === lastPayloadRef.current) return;
    lastPayloadRef.current = payloadStr;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setLoading(true);
      setError(null);
      fetchCoach(payload)
        .then((data) => {
          setResult(data);
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Something went wrong");
          setResult(null);
        })
        .finally(() => setLoading(false));
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [payload, debounceMs, fetchCoach]);

  const hasContent = result && (result.recommendations?.length > 0 || result.questions?.length > 0);
  const hasSuggestions = result?.suggestedFields && Object.keys(result.suggestedFields).length > 0;

  return (
    <div
      className={`rounded-xl border border-border-default bg-bg-elevated overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
          AI Brand Coach
        </span>
      </div>
      <div className="p-4 space-y-4 min-h-[120px]">
        {loading && (
          <div className="flex items-center gap-2 text-text-muted font-mono text-xs">
            <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Getting recommendations...
          </div>
        )}
        {error && (
          <p className="font-mono text-xs text-error">{error}</p>
        )}
        {!loading && hasContent && (
          <>
            {result!.recommendations.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
                  Recommendations
                </p>
                <ul className="space-y-1.5">
                  {result!.recommendations.map((r, i) => (
                    <li
                      key={i}
                      className="text-sm text-text-secondary flex items-start gap-2"
                    >
                      <span className="text-accent mt-0.5">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result!.questions.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
                  Questions to know your brand better
                </p>
                <ul className="space-y-1.5">
                  {result!.questions.map((q, i) => (
                    <li
                      key={i}
                      className="text-sm text-text-secondary flex items-start gap-2"
                    >
                      <span className="text-accent mt-0.5">?</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hasSuggestions && onApplySuggestion && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
                  Suggested answers
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result!.suggestedFields!).map(([field, value]) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => onApplySuggestion(field, value)}
                      className="px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs text-text-primary hover:bg-accent/20 transition-colors"
                    >
                      Use for {field}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {!loading && !error && !hasContent && (
          <p className="font-mono text-xs text-text-muted">
            Add a bit more about your brand to get tailored recommendations and questions.
          </p>
        )}
      </div>
    </div>
  );
}
