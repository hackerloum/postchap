"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard } from "lucide-react";
import { PricingModal } from "@/components/PricingModal";
import type { PlanId } from "@/lib/plans";

export function DashboardPlanTrigger() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<PlanId>("free");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [countryCode, setCountryCode] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        setPlan((data.plan as PlanId) ?? "free");
        setCountryCode(data.countryCode ?? null);
      }
    } catch {
      // keep default free
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  useEffect(() => {
    if (searchParams.get("plan") === "open") {
      setModalOpen(true);
      const u = new URL(window.location.href);
      u.searchParams.delete("plan");
      window.history.replaceState({}, "", u.pathname + u.search);
    }
  }, [searchParams]);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors px-3 py-2 rounded-lg hover:bg-bg-elevated"
      >
        <CreditCard size={14} className="opacity-70" />
        {loading ? "Plan…" : `Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)}`}
      </button>
      <PricingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        currentPlan={plan}
        countryCode={countryCode}
        onPlanSelected={fetchPlan}
      />
    </>
  );
}
