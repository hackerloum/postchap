import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getUserPlan } from "@/lib/user-plan";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import type { PlanId } from "@/components/pricing/PricingPlans";
import { Zap } from "lucide-react";

export default async function UpgradePage() {
  let currentPlan: PlanId = "free";

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__session")?.value;
    if (token) {
      const decoded = await getAdminAuth().verifyIdToken(token);
      const plan = await getUserPlan(decoded.uid);
      currentPlan = plan;
    }
  } catch {
    // leave currentPlan as free
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5 mb-5">
            <Zap size={12} className="text-accent" />
            <span className="font-mono text-[11px] text-accent">
              UPGRADE YOUR PLAN
            </span>
          </div>
          <h1 className="font-semibold text-[32px] sm:text-[40px] text-text-primary tracking-tight leading-tight mb-4">
            Unlock more for your brand
          </h1>
          <p className="font-mono text-[13px] text-text-muted max-w-sm mx-auto leading-relaxed">
            You&apos;re on the{" "}
            <span className="text-text-primary capitalize font-semibold">
              {currentPlan}
            </span>{" "}
            plan. Upgrade to generate more and grow faster.
          </p>
        </div>

        <div className="max-w-lg mx-auto mb-10">
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 flex items-start gap-3">
            <Zap size={16} className="text-accent mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-[13px] text-text-primary">
                Reach more customers every day
              </p>
              <p className="font-mono text-[11px] text-text-muted mt-1 leading-relaxed">
                Pro users generate 12x more content and see 3x more engagement
                on average.
              </p>
            </div>
          </div>
        </div>

        <PricingPlans currentPlan={currentPlan} context="dashboard" />
      </div>
    </div>
  );
}
