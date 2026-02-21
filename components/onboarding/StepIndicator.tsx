"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";

const STEP_LABELS = [
  "Brand Identity",
  "Visual Identity",
  "Your Audience",
  "Content Strategy",
];

export function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex w-full items-start justify-center gap-0">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const completed = step < currentStep;
        const active = step === currentStep;
        return (
          <div key={step} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {step > 1 && (
                <div className="flex flex-1 flex-col justify-center">
                  <div className="h-px w-full bg-border-default">
                    <motion.div
                      className="h-full bg-accent"
                      initial={false}
                      animate={{
                        width: currentStep >= step ? "100%" : "0%",
                      }}
                      transition={{ duration: 0.4 }}
                      style={{
                        width: currentStep >= step ? "100%" : "0%",
                        maxWidth: "100%",
                      }}
                    />
                  </div>
                </div>
              )}
              <motion.div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  completed
                    ? "border-accent bg-accent"
                    : active
                      ? "border-accent bg-bg-base"
                      : "border-border-default bg-bg-elevated"
                }`}
                animate={active ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                {completed ? (
                  <Check size={14} className="text-black" />
                ) : active ? (
                  <div className="h-2 w-2 rounded-full bg-accent" />
                ) : null}
              </motion.div>
              {step < totalSteps && (
                <div className="flex flex-1 flex-col justify-center">
                  <div className="h-px w-full bg-border-default">
                    <motion.div
                      className="h-full bg-accent"
                      initial={false}
                      animate={{
                        width: completed ? "100%" : "0%",
                      }}
                      transition={{ duration: 0.4 }}
                      style={{
                        width: completed ? "100%" : "0%",
                        maxWidth: "100%",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <span
              className={`mt-2 text-center font-mono text-[11px] uppercase tracking-wider ${
                active
                  ? "font-medium text-text-primary"
                  : completed
                    ? "text-text-secondary"
                    : "text-text-muted"
              }`}
            >
              {STEP_LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
