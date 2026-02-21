"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  FileText,
  Image as ImageIcon,
  Layers,
  Upload,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { auth } from "@/lib/firebase/auth";
import { useGenerationStatus } from "@/hooks/useGenerationStatus";
import type { GenerationStatus } from "@/types";

const STEP_ORDER: GenerationStatus[] = [
  "generating_copy",
  "generating_image",
  "compositing",
  "uploading",
];

const STEPS = [
  { key: "generating_copy" as const, label: "Writing your copy" },
  { key: "generating_image" as const, label: "Generating artwork" },
  { key: "compositing" as const, label: "Building your poster" },
  { key: "uploading" as const, label: "Saving to library" },
];

function getStatusIcon(status: string | undefined) {
  const size = 20;
  const muted = "text-text-muted";
  const accent = "text-accent";
  const success = "text-status-success";
  const error = "text-status-error";
  switch (status) {
    case "pending":
      return <Clock size={size} className={muted} />;
    case "generating_copy":
      return <FileText size={size} className={accent} />;
    case "generating_image":
      return <ImageIcon size={size} className={accent} />;
    case "compositing":
      return <Layers size={size} className={accent} />;
    case "uploading":
      return <Upload size={size} className={accent} />;
    case "complete":
      return <Check size={size} className={success} />;
    case "failed":
      return <X size={size} className={error} />;
    default:
      return <Clock size={size} className={muted} />;
  }
}

function getStatusMessage(status: string | undefined): string {
  switch (status) {
    case "pending":
      return "Preparing your brand...";
    case "generating_copy":
      return "Crafting your copy...";
    case "generating_image":
      return "Freepik Mystic is rendering your artwork...";
    case "compositing":
      return "Compositing your poster...";
    case "uploading":
      return "Saving to your library...";
    case "complete":
      return "Your poster is ready.";
    case "failed":
      return "Something went wrong.";
    default:
      return "Preparing your brand...";
  }
}

function getStatusSub(status: string | undefined, errorMessage?: string): string {
  if (status === "failed" && errorMessage) return errorMessage;
  switch (status) {
    case "generating_copy":
      return "AI is writing headline, body, and hashtags";
    case "generating_image":
      return "High quality generation takes 30–60 seconds";
    case "compositing":
      return "Adding your logo and text overlay";
    case "uploading":
      return "Storing your poster securely";
    case "complete":
      return "Redirecting you now...";
    case "failed":
      return "We'll retry automatically";
    default:
      return "";
  }
}

export function GeneratingScreen({ brandKitName }: { brandKitName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const posterId = searchParams.get("posterId");
  const user = auth.currentUser;
  const userId = user?.uid ?? "";
  const generationStatus = useGenerationStatus(userId, posterId);
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const startTime = useRef(Date.now());
  const completeHandled = useRef(false);

  const currentStatus = generationStatus?.status ?? "pending";
  const currentIndex = STEP_ORDER.indexOf(currentStatus);

  useEffect(() => {
    if (!posterId) {
      router.replace("/dashboard");
      return;
    }
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [posterId, user, router]);

  useEffect(() => {
    if (currentStatus === "complete" && !completeHandled.current) {
      completeHandled.current = true;
      const t = setTimeout(() => {
        router.push(`/reveal?posterId=${posterId}`);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [currentStatus, posterId, router]);

  useEffect(() => {
    if (currentStatus === "complete" || currentStatus === "failed") return;
    // Image generation (Mystic) can take 30–90s; don't show timeout before 120s
    const timeoutMs = 120000;
    const interval = setInterval(() => {
      if (Date.now() - startTime.current >= timeoutMs) {
        setTimedOut(true);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [currentStatus]);

  const handleRetry = async () => {
    const bid = typeof window !== "undefined" ? localStorage.getItem("welcome_brandKitId") : null;
    if (!bid || !user) return;
    setRetrying(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brandKitId: bid }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { posterId: string };
      startTime.current = Date.now();
      setTimedOut(false);
      router.push(`/generating?posterId=${data.posterId}`);
    } catch {
      setRetrying(false);
    } finally {
      setRetrying(false);
    }
  };

  const goToDashboard = () => router.push("/dashboard");

  if (!posterId) return null;

  const isFailed = currentStatus === "failed";
  const errorMessage = generationStatus?.message;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6 py-12">
      <div className="mx-auto max-w-lg w-full">
        <p className="mb-12 text-center font-mono text-[11px] uppercase tracking-widest text-text-muted">
          Generating for {brandKitName}
        </p>

        <div className="relative mx-auto mb-10 h-32 w-32">
          <div className="absolute inset-0 rounded-full border-2 border-border-default" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent"
            style={{ animation: "spin 1.5s linear infinite" }}
          />
          <div className="absolute inset-3 flex items-center justify-center rounded-full border border-border-default bg-bg-surface">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStatus}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {getStatusIcon(currentStatus)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.h2
            key={generationStatus?.message ?? currentStatus}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center font-display text-2xl font-semibold text-text-primary"
          >
            {getStatusMessage(currentStatus)}
          </motion.h2>
        </AnimatePresence>
        <p className="mt-2 text-center font-mono text-xs text-text-muted">
          {getStatusSub(currentStatus, errorMessage)}
        </p>

        <div className="mt-10 w-full overflow-hidden rounded-full border border-border-default bg-bg-surface">
          <motion.div
            className="h-1.5 rounded-full bg-accent"
            initial={{ width: "0%" }}
            animate={{ width: `${generationStatus?.progress ?? 0}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 text-center font-mono text-[11px] text-text-muted">
          {generationStatus?.progress ?? 0}%
        </p>

        <div className="mt-8 space-y-3 border-l border-border-subtle pl-5">
          {STEPS.map((step, i) => {
            const isCompleted = currentIndex > i || currentStatus === "complete";
            const isActive = STEP_ORDER.indexOf(currentStatus) === i;
            return (
              <div key={step.key} className="flex items-center gap-3">
                {isCompleted ? (
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-status-success/20">
                    <Check size={10} className="text-status-success" />
                  </div>
                ) : isActive ? (
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-accent">
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  </div>
                ) : (
                  <div className="h-5 w-5 flex-shrink-0 rounded-full border border-border-default" />
                )}
                <span
                  className={`font-mono text-xs ${
                    isCompleted ? "text-status-success" : isActive ? "text-text-primary" : "text-text-muted"
                  }`}
                >
                  {step.label}
                </span>
                {isActive && (
                  <span className="ml-auto font-mono text-[11px] text-accent">working...</span>
                )}
                {isCompleted && (
                  <span className="ml-auto font-mono text-[11px] text-status-success">done</span>
                )}
              </div>
            );
          })}
        </div>

        {(isFailed || timedOut) && (
          <div className="mt-8 flex flex-col gap-3">
            {timedOut && !isFailed && (
              <p className="text-center font-mono text-xs text-status-warning">
                This is taking longer than usual. You can retry or go to the dashboard.
              </p>
            )}
            {isFailed && (
              <>
                <div className="flex justify-center">
                  <AlertCircle size={24} className="text-status-error" />
                </div>
                <p className="text-center font-display text-lg font-semibold text-text-primary">
                  Generation failed
                </p>
              </>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="rounded-lg bg-accent px-4 py-2.5 font-apple text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
              >
                {retrying ? "Starting…" : "Try again"}
              </button>
              <button
                type="button"
                onClick={goToDashboard}
                className="rounded-lg border border-border-default bg-bg-surface px-4 py-2.5 font-apple text-sm text-text-primary hover:bg-bg-elevated"
              >
                Go to dashboard →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
