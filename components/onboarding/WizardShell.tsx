"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "@/lib/firebase/auth";
import { getClientStorage } from "@/lib/firebase/storage.client";
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
    const user = auth?.currentUser ?? null;
    if (!user) {
      router.push("/login");
      return;
    }
    setIsSubmitting(true);
    let logoUrl: string | undefined;
    try {
      if (formData.logoFile) {
        const path = `logos/${user.uid}/${Date.now()}-${formData.logoFile.name}`;
        const storage = getClientStorage();
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
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: newToken }),
        credentials: "include",
      });
      if (!sessionRes.ok) {
        throw new Error("Session could not be saved. Please try again.");
      }
      // Let the browser commit the session cookie before navigating so /welcome isn't sent without it
      await new Promise((r) => setTimeout(r, 150));
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
        {currentStep === 1 && (
          <div key="step1" className="animate-fade-up" style={{ animationDuration: "0.25s" }}>
            <Step1Brand formData={formData} updateForm={updateForm} onNext={nextStep} />
          </div>
        )}
        {currentStep === 2 && (
          <div key="step2" className="animate-fade-up" style={{ animationDuration: "0.25s" }}>
            <Step2Visual formData={formData} updateForm={updateForm} onBack={prevStep} onNext={nextStep} />
          </div>
        )}
        {currentStep === 3 && (
          <div key="step3" className="animate-fade-up" style={{ animationDuration: "0.25s" }}>
            <Step3Audience formData={formData} updateForm={updateForm} onBack={prevStep} onNext={nextStep} />
          </div>
        )}
        {currentStep === 4 && (
          <div key="step4" className="animate-fade-up" style={{ animationDuration: "0.25s" }}>
            <Step4Content
              formData={formData}
              updateForm={updateForm}
              onBack={prevStep}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}
