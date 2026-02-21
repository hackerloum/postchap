"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "@/lib/firebase/auth";
import { storage } from "@/lib/firebase/client";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { Step1Brand } from "@/components/onboarding/steps/Step1Brand";
import { Step2Visual } from "@/components/onboarding/steps/Step2Visual";
import { Step3Audience } from "@/components/onboarding/steps/Step3Audience";
import { Step4Content } from "@/components/onboarding/steps/Step4Content";
import { toast } from "sonner";
import type { WizardFormData } from "@/types";

const INITIAL_FORM: WizardFormData = {
  brandName: "",
  industry: "",
  tagline: "",
  website: "",
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  accentColor: "#E8FF47",
  logoFile: null,
  logoPreviewUrl: "",
  targetAudience: "",
  ageRange: "",
  selectedCountry: null,
  city: "",
  platforms: [],
  language: "en",
  tone: "",
  styleNotes: "",
  sampleContent: "",
  competitors: "",
};

export function WizardShell() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM);

  const updateForm = (fields: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  async function handleSubmit() {
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }
    setIsSubmitting(true);
    let logoUrl: string | undefined;
    try {
      if (formData.logoFile) {
        const path = `logos/${user.uid}/${Date.now()}-${formData.logoFile.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, formData.logoFile, {
          contentType: formData.logoFile.type,
        });
        logoUrl = await getDownloadURL(storageRef);
      }

      const brandLocation = formData.selectedCountry
        ? {
            country: formData.selectedCountry.name,
            countryCode: formData.selectedCountry.code,
            city: formData.city || "",
            region: formData.selectedCountry.continent,
            continent: formData.selectedCountry.continent,
            timezone: formData.selectedCountry.timezone,
            currency: formData.selectedCountry.currency,
            languages: formData.selectedCountry.languages,
          }
        : {
            country: "Unknown",
            countryCode: "XX",
            city: "",
            region: "Global",
            continent: "Global",
            timezone: "UTC",
            currency: "USD",
            languages: ["English"],
          };

      const token = await user.getIdToken(true);
      console.log("[Wizard] Got ID token, length:", token.length);
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          brandName: formData.brandName,
          industry: formData.industry,
          tagline: formData.tagline || undefined,
          website: formData.website || undefined,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          logoUrl,
          targetAudience: formData.targetAudience,
          ageRange: formData.ageRange,
          brandLocation,
          platforms: formData.platforms,
          language: formData.language,
          tone: formData.tone,
          styleNotes: formData.styleNotes || undefined,
          sampleContent: formData.sampleContent || undefined,
          competitors: formData.competitors || undefined,
        }),
      });
      console.log("[Wizard] API response status:", res.status);
      const data = (await res.json()) as {
        success?: boolean;
        brandKitId?: string;
        error?: string;
        detail?: string;
        details?: string;
      };
      if (!res.ok) {
        const msg = data.details ?? data.detail ?? data.error ?? "Failed to complete onboarding";
        console.error("[Wizard] API error:", data);
        throw new Error(msg);
      }
      console.log("[Wizard] Success:", data);

      if (typeof window !== "undefined" && data.brandKitId) {
        sessionStorage.setItem("welcome_brandName", formData.brandName);
      }

      const newToken = await user.getIdToken(true);
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: newToken }),
        credentials: "include",
      });
      router.push(`/welcome?brandKitId=${data.brandKitId ?? ""}`);
    } catch (err) {
      console.error("[Wizard] Submit failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create brand kit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <StepIndicator currentStep={currentStep} totalSteps={4} />
      <div className="mt-10">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              <Step1Brand formData={formData} updateForm={updateForm} onNext={nextStep} />
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              <Step2Visual formData={formData} updateForm={updateForm} onBack={prevStep} onNext={nextStep} />
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              <Step3Audience formData={formData} updateForm={updateForm} onBack={prevStep} onNext={nextStep} />
            </motion.div>
          )}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              <Step4Content
                formData={formData}
                updateForm={updateForm}
                onBack={prevStep}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
