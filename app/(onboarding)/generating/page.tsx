"use client";

import { useState, useEffect } from "react";
import { GeneratingScreen } from "@/components/onboarding/GeneratingScreen";

export default function GeneratingPage() {
  const [brandName, setBrandName] = useState("Your brand");
  useEffect(() => {
    setBrandName(
      typeof window !== "undefined"
        ? sessionStorage.getItem("welcome_brandName") || "Your brand"
        : "Your brand"
    );
  }, []);

  return <GeneratingScreen brandKitName={brandName} />;
}
