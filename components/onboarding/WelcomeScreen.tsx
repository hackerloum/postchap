"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Check } from "lucide-react";
import { auth } from "@/lib/firebase/auth";
import { ConfettiEffect } from "./ConfettiEffect";

export function WelcomeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const posterIdRef = useRef<string | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    const brandKitId =
      searchParams.get("brandKitId") ||
      (typeof window !== "undefined" ? localStorage.getItem("welcome_brandKitId") : null);
    if (!brandKitId) {
      router.replace("/dashboard");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("welcome_brandKitId", brandKitId);
    }

    let mounted = true;
    const user = auth?.currentUser ?? null;
    if (!user) {
      router.replace("/login");
      return;
    }

    let minElapsed = false;
    const navigate = () => {
      if (hasNavigated.current) return;
      const id = posterIdRef.current || (typeof window !== "undefined" ? localStorage.getItem("pendingPosterId") : null);
      if (id) {
        hasNavigated.current = true;
        router.push(`/generating?posterId=${id}`);
      } else if (minElapsed) {
        hasNavigated.current = true;
        router.push("/dashboard");
      }
    };

    const timeoutId = setTimeout(() => {
      minElapsed = true;
      navigate();
    }, 3000);

    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ brandKitId }),
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Generation failed");
        }
        const data = (await res.json()) as { posterId: string };
        const posterId = data.posterId;
        if (!mounted || hasNavigated.current) return;
        posterIdRef.current = posterId;
        if (typeof window !== "undefined") {
          localStorage.setItem("pendingPosterId", posterId);
        }
        if (minElapsed) navigate();
      } catch {
        if (mounted && !hasNavigated.current) {
          router.replace("/dashboard");
        }
      }
    })();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [router, searchParams]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg-base px-6 py-12">
      <ConfettiEffect />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="animate-scale-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-accent">
            <Sparkles size={36} className="text-black" />
          </div>
        </div>

        <h1
          className="mt-8 font-display text-4xl font-semibold tracking-tight text-text-primary md:text-5xl animate-fade-up"
          style={{ animationDelay: "200ms", opacity: 0, animationFillMode: "forwards" }}
        >
          Your brand kit is live.
        </h1>

        <p
          className="mx-auto mt-4 max-w-md font-sans text-base leading-relaxed text-text-secondary animate-fade-up"
          style={{ animationDelay: "400ms", opacity: 0, animationFillMode: "forwards" }}
        >
          ArtMaster is generating your first poster right now. This usually takes about 30 seconds.
        </p>

        <div
          className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-up"
          style={{ animationDelay: "600ms", opacity: 0, animationFillMode: "forwards" }}
        >
          {[
            { icon: Check, label: "Brand Kit saved" },
            { icon: Check, label: "Daily schedule enabled" },
            { icon: Check, label: "First poster generating" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-border-default bg-bg-surface px-4 py-2"
            >
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-status-success/20">
                <Icon size={10} className="text-status-success" />
              </div>
              <span className="font-mono text-[11px] text-text-secondary">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: "800ms", opacity: 0, animationFillMode: "forwards" }}>
          <p className="mb-3 font-mono text-[11px] text-text-muted">
            Taking you to your first poster...
          </p>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-accent"
                style={{
                  animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
