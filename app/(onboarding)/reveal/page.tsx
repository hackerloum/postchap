"use client";

import { useState, useEffect } from "react";
import { PosterReveal } from "@/components/onboarding/PosterReveal";

export default function RevealPage() {
  const [brandName, setBrandName] = useState("Your brand");
  useEffect(() => {
    setBrandName(
      typeof window !== "undefined"
        ? sessionStorage.getItem("welcome_brandName") || "Your brand"
        : "Your brand"
    );
  }, []);

  return <PosterReveal brandKitName={brandName} />;
}
