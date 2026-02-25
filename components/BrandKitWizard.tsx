"use client";

import { useState } from "react";
import Link from "next/link";
import { getAuthClient } from "@/lib/firebase/client";
import { getClientIdToken } from "@/lib/auth-client";
import { toast } from "sonner";
import { BrandCoachPanel } from "@/app/dashboard/brand-kits/BrandCoachPanel";
import {
  ShoppingBag,
  UtensilsCrossed,
  Shirt,
  Monitor,
  CreditCard,
  HeartPulse,
  BookOpen,
  Building2,
  Building,
  Radio,
  Smartphone,
  MoreHorizontal,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Music2,
  MessageCircle,
  Briefcase,
  Zap,
  Sun,
  Square,
  Gem,
  Flame,
  Image as ImageIcon,
  CheckCircle,
  ArrowRight,
  Clock,
  Banknote,
  Languages,
} from "lucide-react";

export type Industry =
  | "retail"
  | "finance"
  | "telecom"
  | "hospitality"
  | "healthcare"
  | "education"
  | "food_beverage"
  | "fashion"
  | "technology"
  | "real_estate"
  | "media"
  | "other";

export type Tone =
  | "professional"
  | "bold"
  | "friendly"
  | "minimal"
  | "luxury"
  | "energetic";

export type Platform =
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "whatsapp";

export interface WizardData {
  brandName: string;
  industry: Industry | "";
  tagline: string;
  website: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoFile: File | null;
  logoPreview: string;
  continent: string;
  country: string;
  countryCode: string;
  timezone: string;
  currency: string;
  languages: string[];
  city: string;
  targetAudience: string;
  ageRange: string;
  platforms: Platform[];
  language: string;
  tone: Tone | "";
  styleNotes: string;
  sampleContent: string;
}

export const defaultData: WizardData = {
  brandName: "",
  industry: "",
  tagline: "",
  website: "",
  primaryColor: "#E8FF47",
  secondaryColor: "#080808",
  accentColor: "#FFFFFF",
  logoFile: null,
  logoPreview: "",
  continent: "",
  country: "",
  countryCode: "",
  timezone: "",
  currency: "",
  languages: [],
  city: "",
  targetAudience: "",
  ageRange: "",
  platforms: [],
  language: "en",
  tone: "",
  styleNotes: "",
  sampleContent: "",
};

export const COUNTRIES = [
  { name: "Nigeria", code: "NG", continent: "Africa", timezone: "Africa/Lagos", currency: "NGN", languages: ["English", "Hausa", "Yoruba", "Igbo"] },
  { name: "Kenya", code: "KE", continent: "Africa", timezone: "Africa/Nairobi", currency: "KES", languages: ["English", "Swahili"] },
  { name: "South Africa", code: "ZA", continent: "Africa", timezone: "Africa/Johannesburg", currency: "ZAR", languages: ["English", "Zulu", "Xhosa", "Afrikaans"] },
  { name: "Tanzania", code: "TZ", continent: "Africa", timezone: "Africa/Dar_es_Salaam", currency: "TZS", languages: ["Swahili", "English"] },
  { name: "Ghana", code: "GH", continent: "Africa", timezone: "Africa/Accra", currency: "GHS", languages: ["English", "Twi"] },
  { name: "Ethiopia", code: "ET", continent: "Africa", timezone: "Africa/Addis_Ababa", currency: "ETB", languages: ["Amharic", "English"] },
  { name: "Egypt", code: "EG", continent: "Africa", timezone: "Africa/Cairo", currency: "EGP", languages: ["Arabic"] },
  { name: "Uganda", code: "UG", continent: "Africa", timezone: "Africa/Kampala", currency: "UGX", languages: ["English", "Swahili"] },
  { name: "Rwanda", code: "RW", continent: "Africa", timezone: "Africa/Kigali", currency: "RWF", languages: ["Kinyarwanda", "English", "French"] },
  { name: "Morocco", code: "MA", continent: "Africa", timezone: "Africa/Casablanca", currency: "MAD", languages: ["Arabic", "French"] },
  { name: "Senegal", code: "SN", continent: "Africa", timezone: "Africa/Dakar", currency: "XOF", languages: ["French", "Wolof"] },
  { name: "Cameroon", code: "CM", continent: "Africa", timezone: "Africa/Douala", currency: "XAF", languages: ["French", "English"] },
  { name: "Côte d'Ivoire", code: "CI", continent: "Africa", timezone: "Africa/Abidjan", currency: "XOF", languages: ["French"] },
  { name: "Angola", code: "AO", continent: "Africa", timezone: "Africa/Luanda", currency: "AOA", languages: ["Portuguese"] },
  { name: "Mozambique", code: "MZ", continent: "Africa", timezone: "Africa/Maputo", currency: "MZN", languages: ["Portuguese"] },
  { name: "Zambia", code: "ZM", continent: "Africa", timezone: "Africa/Lusaka", currency: "ZMW", languages: ["English"] },
  { name: "Zimbabwe", code: "ZW", continent: "Africa", timezone: "Africa/Harare", currency: "ZWL", languages: ["English", "Shona"] },
  { name: "United States", code: "US", continent: "Americas", timezone: "America/New_York", currency: "USD", languages: ["English"] },
  { name: "United Kingdom", code: "GB", continent: "Europe", timezone: "Europe/London", currency: "GBP", languages: ["English"] },
  { name: "UAE", code: "AE", continent: "Middle East", timezone: "Asia/Dubai", currency: "AED", languages: ["Arabic", "English"] },
  { name: "India", code: "IN", continent: "Asia", timezone: "Asia/Kolkata", currency: "INR", languages: ["Hindi", "English"] },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ["Brand", "Visual", "Audience", "Content"];
  return (
    <div>
      <div className="w-full h-1 bg-bg-elevated rounded-full">
        <div
          className="h-1 bg-accent rounded-full transition-all duration-500"
          style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-3">
        {labels.map((label, i) => {
          const num = i + 1;
          const done = num < current;
          const active = num === current;
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] transition-all duration-300 ${
                  done
                    ? "bg-accent text-black"
                    : active
                    ? "bg-accent/20 border border-accent text-accent"
                    : "bg-bg-elevated text-text-muted"
                }`}
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span className={`font-mono text-[9px] tracking-wider hidden sm:block ${active ? "text-text-primary" : "text-text-muted"}`}>
                {label.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Step1Brand({
  data,
  update,
  onNext,
}: {
  data: WizardData;
  update: (f: Partial<WizardData>) => void;
  onNext: () => void;
}) {
  const [error, setError] = useState("");
  const industries: { value: Industry; label: string; icon: React.ReactNode }[] = [
    { value: "retail", label: "Retail", icon: <ShoppingBag size={16} /> },
    { value: "food_beverage", label: "Food & Drink", icon: <UtensilsCrossed size={16} /> },
    { value: "fashion", label: "Fashion", icon: <Shirt size={16} /> },
    { value: "technology", label: "Technology", icon: <Monitor size={16} /> },
    { value: "finance", label: "Finance", icon: <CreditCard size={16} /> },
    { value: "healthcare", label: "Healthcare", icon: <HeartPulse size={16} /> },
    { value: "education", label: "Education", icon: <BookOpen size={16} /> },
    { value: "hospitality", label: "Hospitality", icon: <Building2 size={16} /> },
    { value: "real_estate", label: "Real Estate", icon: <Building size={16} /> },
    { value: "telecom", label: "Telecom", icon: <Radio size={16} /> },
    { value: "media", label: "Media", icon: <Smartphone size={16} /> },
    { value: "other", label: "Other", icon: <MoreHorizontal size={16} /> },
  ];

  function handleNext() {
    if (!data.brandName.trim()) {
      setError("Brand name is required.");
      return;
    }
    if (!data.industry) {
      setError("Please select your industry.");
      return;
    }
    setError("");
    onNext();
  }

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h2 className="font-semibold text-xl text-text-primary tracking-tight">Tell us about your brand</h2>
        <p className="mt-1 font-mono text-xs text-text-muted">This helps ArtMaster create content that matches your identity.</p>
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Brand name *</label>
        <input
          type="text"
          value={data.brandName}
          onChange={(e) => update({ brandName: e.target.value })}
          placeholder="e.g. Kilimo Fresh"
          className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-strong transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Industry *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {industries.map((ind) => (
            <button
              key={ind.value}
              type="button"
              onClick={() => update({ industry: ind.value })}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-sm transition-all duration-150 ${
                data.industry === ind.value ? "border-accent bg-accent/10 text-text-primary" : "border-border-default bg-bg-elevated text-text-secondary hover:border-border-strong"
              }`}
            >
              <span className="text-text-primary flex items-center">{ind.icon}</span>
              <span className="text-xs font-medium">{ind.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Tagline <span className="normal-case">(optional)</span></label>
        <input
          type="text"
          value={data.tagline}
          onChange={(e) => update({ tagline: e.target.value })}
          placeholder="e.g. Fresh from the farm to your table"
          className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-strong transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Website <span className="normal-case">(optional)</span></label>
        <input
          type="url"
          value={data.website}
          onChange={(e) => update({ website: e.target.value })}
          placeholder="https://yourwebsite.com"
          className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-strong transition-colors"
        />
      </div>

      {error && <p className="font-mono text-xs text-error">{error}</p>}

      <button onClick={handleNext} className="w-full bg-accent text-black font-semibold text-sm py-3 rounded-lg hover:bg-accent-dim transition-colors min-h-[48px] inline-flex items-center justify-center gap-2">
        Continue <ArrowRight size={14} />
      </button>
    </div>
  );
}

function Step2Visual({
  data,
  update,
  onBack,
  onNext,
}: {
  data: WizardData;
  update: (f: Partial<WizardData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const presets = [
    { primary: "#E8FF47", secondary: "#080808", accent: "#FFFFFF", name: "Neon Dark" },
    { primary: "#FF6B35", secondary: "#1A0A00", accent: "#FFD700", name: "Warm Fire" },
    { primary: "#00D4AA", secondary: "#001A14", accent: "#FFFFFF", name: "Emerald" },
    { primary: "#7C3AED", secondary: "#0D0015", accent: "#E8FF47", name: "Purple" },
    { primary: "#F43F5E", secondary: "#1A0008", accent: "#FFFFFF", name: "Rose" },
  ];

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    update({ logoFile: file, logoPreview: url });
  }

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h2 className="font-semibold text-xl text-text-primary tracking-tight">Brand colors & logo</h2>
        <p className="mt-1 font-mono text-xs text-text-muted">These will be used in every poster ArtMaster generates.</p>
      </div>

      <div className="space-y-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Quick presets</label>
        <div className="flex gap-2 flex-wrap">
          {presets.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => update({ primaryColor: p.primary, secondaryColor: p.secondary, accentColor: p.accent })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated border border-border-default rounded-full hover:border-border-strong transition-colors"
              title={p.name}
            >
              <div className="flex gap-0.5">
                {[p.primary, p.secondary, p.accent].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span className="font-mono text-[10px] text-text-muted">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { key: "primaryColor" as const, label: "Primary" },
          { key: "secondaryColor" as const, label: "Secondary" },
          { key: "accentColor" as const, label: "Accent" },
        ].map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">{label}</label>
            <div className="flex items-center gap-2 bg-bg-elevated border border-border-default rounded-lg px-3 py-2 hover:border-border-strong transition-colors">
              <label className="cursor-pointer">
                <div className="w-7 h-7 rounded-md border border-border-default" style={{ background: data[key] }} />
                <input
                  type="color"
                  value={data[key]}
                  onChange={(e) => update({ [key]: e.target.value })}
                  className="sr-only"
                />
              </label>
              <input
                type="text"
                value={data[key]}
                onChange={(e) => {
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) || e.target.value === "") update({ [key]: e.target.value });
                }}
                className="flex-1 bg-transparent text-xs font-mono text-text-primary outline-none uppercase"
                maxLength={7}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Preview</label>
        <div className="rounded-xl overflow-hidden aspect-square max-w-[200px] mx-auto relative" style={{ background: data.secondaryColor }}>
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              {data.logoPreview ? (
                <img src={data.logoPreview} alt="logo" className="w-8 h-8 object-contain rounded" />
              ) : (
                <div
                  className="w-8 h-8 rounded border-2 flex items-center justify-center font-bold text-xs"
                  style={{ borderColor: data.primaryColor, color: data.primaryColor }}
                >
                  {data.brandName?.[0]?.toUpperCase() || "A"}
                </div>
              )}
              <span className="text-xs font-semibold truncate max-w-[100px]" style={{ color: data.primaryColor }}>
                {data.brandName || "Your Brand"}
              </span>
            </div>
            <div className="space-y-1">
              <div className="h-3 w-3/4 rounded" style={{ background: data.primaryColor + "99" }} />
              <div className="h-2 w-full rounded" style={{ background: data.primaryColor + "44" }} />
              <div className="h-2 w-2/3 rounded" style={{ background: data.primaryColor + "44" }} />
              <div className="mt-2 inline-flex px-3 py-1 rounded-full text-[9px] font-bold" style={{ background: data.accentColor, color: data.secondaryColor }}>
                Shop Now
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Logo <span className="normal-case">(optional)</span></label>
        <label className="flex flex-col items-center justify-center border border-dashed border-border-default rounded-xl p-6 cursor-pointer hover:border-border-strong hover:bg-bg-elevated transition-all text-center">
          {data.logoPreview ? (
            <div className="space-y-2">
              <img src={data.logoPreview} alt="logo" className="max-h-16 mx-auto object-contain" />
              <p className="font-mono text-xs text-accent">Tap to change</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center text-text-muted"><ImageIcon size={32} /></div>
              <p className="font-mono text-xs text-text-muted">Tap to upload logo</p>
              <p className="font-mono text-[10px] text-text-muted">PNG, JPG, SVG · Max 5MB</p>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleLogoChange} className="sr-only" />
        </label>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 bg-transparent border border-border-default text-text-secondary text-sm font-medium py-3 rounded-lg hover:border-border-strong transition-colors min-h-[48px]">
          ← Back
        </button>
        <button onClick={onNext} className="flex-1 bg-accent text-black font-semibold text-sm py-3 rounded-lg hover:bg-accent-dim transition-colors min-h-[48px] inline-flex items-center justify-center gap-2">
          Continue <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function Step3Audience({
  data,
  update,
  onBack,
  onNext,
}: {
  data: WizardData;
  update: (f: Partial<WizardData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountries, setShowCountries] = useState(false);
  const filtered = COUNTRIES.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()));

  function selectCountry(c: (typeof COUNTRIES)[0]) {
    update({
      country: c.name,
      countryCode: c.code,
      continent: c.continent,
      timezone: c.timezone,
      currency: c.currency,
      languages: c.languages,
      language: c.languages.includes("English") ? "en" : c.languages[0].toLowerCase().slice(0, 2),
    });
    setShowCountries(false);
    setCountrySearch("");
  }

  function getFlagEmoji(code: string) {
    return code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
  }

  const platforms: { value: Platform; label: string; icon: React.ReactNode }[] = [
    { value: "instagram", label: "Instagram", icon: <Instagram size={16} /> },
    { value: "facebook", label: "Facebook", icon: <Facebook size={16} /> },
    { value: "twitter", label: "Twitter/X", icon: <Twitter size={16} /> },
    { value: "linkedin", label: "LinkedIn", icon: <Linkedin size={16} /> },
    { value: "tiktok", label: "TikTok", icon: <Music2 size={16} /> },
    { value: "whatsapp", label: "WhatsApp", icon: <MessageCircle size={16} /> },
  ];

  function togglePlatform(p: Platform) {
    const current = data.platforms;
    if (current.includes(p)) update({ platforms: current.filter((x) => x !== p) });
    else update({ platforms: [...current, p] });
  }

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h2 className="font-semibold text-xl text-text-primary tracking-tight">Your audience & location</h2>
        <p className="mt-1 font-mono text-xs text-text-muted">Helps ArtMaster create culturally relevant content.</p>
      </div>

      <div className="space-y-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Country *</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCountries((v) => !v)}
            className="w-full flex items-center justify-between bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-left hover:border-border-strong transition-colors min-h-[44px]"
          >
            {data.country ? (
              <span className="flex items-center gap-2 text-text-primary">
                <span>{getFlagEmoji(data.countryCode)}</span>
                <span>{data.country}</span>
              </span>
            ) : (
              <span className="text-text-muted">Select your country</span>
            )}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showCountries && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-bg-surface border border-border-default rounded-xl shadow-xl z-20 overflow-hidden">
              <div className="p-2 border-b border-border-subtle">
                <input
                  autoFocus
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search country..."
                  className="w-full bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted rounded-lg outline-none"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filtered.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => selectCountry(c)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-primary text-left hover:bg-bg-elevated transition-colors"
                  >
                    <span>{getFlagEmoji(c.code)}</span>
                    <span>{c.name}</span>
                    <span className="ml-auto font-mono text-[10px] text-text-muted">{c.currency}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {data.country && (
          <div className="bg-bg-elevated border border-border-default rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getFlagEmoji(data.countryCode)}</span>
              <span className="font-semibold text-sm text-text-primary">{data.country}</span>
            </div>
            <p className="font-mono text-[11px] text-text-muted flex items-center gap-1.5">
              <Clock size={12} className="shrink-0" /> {data.timezone} · <Banknote size={12} className="shrink-0 inline" /> {data.currency}
            </p>
            <p className="font-mono text-[11px] text-text-muted flex items-center gap-1.5">
              <Languages size={12} className="shrink-0" /> {data.languages.join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">City <span className="normal-case">(optional)</span></label>
        <input
          type="text"
          value={data.city}
          onChange={(e) => update({ city: e.target.value })}
          placeholder="e.g. Lagos, Nairobi, Accra"
          className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-strong transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Target audience</label>
        <textarea
          value={data.targetAudience}
          onChange={(e) => update({ targetAudience: e.target.value })}
          placeholder="e.g. Young professionals aged 25-40 who care about quality"
          rows={2}
          className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-strong transition-colors resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Platforms</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {platforms.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => togglePlatform(p.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all duration-150 ${
                data.platforms.includes(p.value) ? "border-accent bg-accent/10 text-text-primary" : "border-border-default bg-bg-elevated text-text-secondary hover:border-border-strong"
              }`}
            >
              <span className="text-text-primary flex items-center">{p.icon}</span>
              <span className="text-xs font-medium">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 bg-transparent border border-border-default text-text-secondary text-sm font-medium py-3 rounded-lg hover:border-border-strong transition-colors min-h-[48px]">
          Back
        </button>
        <button onClick={onNext} className="flex-1 bg-accent text-black font-semibold text-sm py-3 rounded-lg hover:bg-accent-dim transition-colors min-h-[48px] inline-flex items-center justify-center gap-2">
          Continue <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function Step4Content({
  data,
  update,
  onBack,
  onSubmit,
  submitting,
  submitButtonLabel = "Launch ArtMaster",
}: {
  data: WizardData;
  update: (f: Partial<WizardData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitButtonLabel?: string;
}) {
  const tones: { value: Tone; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: "professional", label: "Professional", desc: "Formal, trustworthy", icon: <Briefcase size={16} /> },
    { value: "bold", label: "Bold", desc: "Strong, confident", icon: <Zap size={16} /> },
    { value: "friendly", label: "Friendly", desc: "Warm, approachable", icon: <Sun size={16} /> },
    { value: "minimal", label: "Minimal", desc: "Clean, simple", icon: <Square size={16} /> },
    { value: "luxury", label: "Luxury", desc: "Premium, elegant", icon: <Gem size={16} /> },
    { value: "energetic", label: "Energetic", desc: "Fun, vibrant", icon: <Flame size={16} /> },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h2 className="font-semibold text-xl text-text-primary tracking-tight">Voice & content style</h2>
        <p className="mt-1 font-mono text-xs text-text-muted">How should ArtMaster sound when writing for your brand?</p>
      </div>

      <div className="space-y-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Brand tone *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {tones.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => update({ tone: t.value })}
              className={`flex flex-col items-start gap-0.5 px-3 py-3 rounded-lg border text-left transition-all duration-150 ${
                data.tone === t.value ? "border-accent bg-accent/10" : "border-border-default bg-bg-elevated hover:border-border-strong"
              }`}
            >
              <span className="text-text-primary flex items-center">{t.icon}</span>
              <span className="text-xs font-semibold text-text-primary">{t.label}</span>
              <span className="text-[10px] font-mono text-text-muted">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Style notes <span className="normal-case">(optional)</span></label>
        <textarea
          value={data.styleNotes}
          onChange={(e) => update({ styleNotes: e.target.value })}
          placeholder="e.g. Always use 'we' not 'I'. Avoid jargon. Speak like a trusted friend."
          rows={2}
          className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-strong transition-colors resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Sample post <span className="normal-case">(optional)</span></label>
        <textarea
          value={data.sampleContent}
          onChange={(e) => update({ sampleContent: e.target.value })}
          placeholder="Paste an example of content you like — ArtMaster will match this style."
          rows={3}
          className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-border-strong transition-colors resize-none"
        />
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-2">
        <p className="font-mono text-[11px] text-accent uppercase tracking-widest">Ready to launch</p>
        <div className="space-y-1">
          {[`Brand: ${data.brandName}`, `Industry: ${data.industry}`, `Country: ${data.country || "Not set"}`, `Tone: ${data.tone || "Not set"}`].map((item) => (
            <p key={item} className="font-mono text-xs text-text-secondary flex items-center gap-2">
              <CheckCircle size={12} className="text-accent shrink-0" />
              {item}
            </p>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} disabled={submitting} className="flex-1 bg-transparent border border-border-default text-text-secondary text-sm font-medium py-3 rounded-lg hover:border-border-strong transition-colors min-h-[48px] disabled:opacity-50">
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting || !data.tone}
          className="flex-1 bg-accent text-black font-semibold text-sm py-3 rounded-lg hover:bg-accent-dim transition-colors min-h-[48px] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Setting up...
            </>
          ) : (
            <>{submitButtonLabel} <ArrowRight size={14} /></>
          )}
        </button>
      </div>
    </div>
  );
}

export interface BrandKitWizardProps {
  submitButtonLabel: string;
  onSuccess: () => void;
  refreshSessionAfterSuccess?: boolean;
  backHref?: string;
}

export default function BrandKitWizard({ submitButtonLabel, onSuccess, refreshSessionAfterSuccess, backHref }: BrandKitWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(defaultData);
  const [submitting, setSubmitting] = useState(false);

  const update = (fields: Partial<WizardData>) => setData((prev) => ({ ...prev, ...fields }));

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const auth = getAuthClient();
      const user = auth.currentUser;
      if (!user) {
        toast.error("Please log in to continue.");
        return;
      }

      const token = await user.getIdToken(true);

      let logoUrl = "";
      if (data.logoFile) {
        try {
          const formData = new FormData();
          formData.append("file", data.logoFile);
          const uploadRes = await fetch("/api/upload/logo", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            logoUrl = uploadData.url;
          }
        } catch {
          // Non-fatal — continue without logo
        }
      }

      const payload = {
        brandName: data.brandName,
        industry: data.industry || "other",
        tagline: data.tagline,
        website: data.website,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        logoUrl,
        brandLocation: {
          country: data.country || "Unknown",
          countryCode: data.countryCode || "XX",
          city: data.city || "",
          continent: data.continent || "Global",
          timezone: data.timezone || "UTC",
          currency: data.currency || "USD",
          languages: data.languages.length ? data.languages : ["English"],
        },
        targetAudience: data.targetAudience,
        ageRange: data.ageRange,
        platforms: data.platforms,
        language: data.language,
        tone: data.tone || "professional",
        styleNotes: data.styleNotes,
        sampleContent: data.sampleContent,
      };

      const res = await fetch("/api/brand-kits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to save brand kit");
      }

      if (refreshSessionAfterSuccess) {
        const freshToken = await user.getIdToken(true);
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: freshToken }),
        });
      }

      toast.success("Brand kit created!");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const coachStep = (step === 1 ? "brand" : step === 2 ? "visual" : step === 3 ? "audience" : "content") as "brand" | "visual" | "audience" | "content";
  const coachPayload = {
    brandName: data.brandName,
    industry: data.industry,
    tagline: data.tagline,
    website: data.website,
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    accentColor: data.accentColor,
    logoUrl: data.logoPreview || undefined,
    brandLocation: data.country
      ? {
          country: data.country,
          countryCode: data.countryCode,
          continent: data.continent,
          timezone: data.timezone,
          currency: data.currency,
          languages: data.languages,
        }
      : undefined,
    targetAudience: data.targetAudience,
    platforms: data.platforms,
    language: data.language,
    tone: data.tone,
    styleNotes: data.styleNotes,
    sampleContent: data.sampleContent,
    step: coachStep,
  };

  function handleApplyCoachSuggestion(field: string, value: string) {
    const key = field as keyof WizardData;
    if (key in defaultData) update({ [key]: value } as Partial<WizardData>);
    else if (["country", "city", "continent", "timezone", "currency", "languages"].includes(field)) {
      const c = COUNTRIES.find((x) => x.name === value || x.currency === value);
      if (c) {
        update({
          country: c.name,
          countryCode: c.code,
          continent: c.continent,
          timezone: c.timezone,
          currency: c.currency,
          languages: c.languages,
          language: c.languages.includes("English") ? "en" : c.languages[0].toLowerCase().slice(0, 2),
        });
      } else {
        update({ [field === "city" ? "city" : "country"]: value } as Partial<WizardData>);
      }
    }
  }

  return (
    <div>
      {backHref && (
        <Link
          href={backHref}
          className="text-[13px] text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1.5 mb-6"
        >
          ← Back to brand kits
        </Link>
      )}
      <StepIndicator current={step} total={4} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 1 && <Step1Brand data={data} update={update} onNext={() => setStep(2)} />}
          {step === 2 && <Step2Visual data={data} update={update} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && <Step3Audience data={data} update={update} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
          {step === 4 && (
            <Step4Content
              data={data}
              update={update}
              onBack={() => setStep(3)}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitButtonLabel={submitButtonLabel}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <BrandCoachPanel
              payload={coachPayload}
              step={coachStep}
              onApplySuggestion={handleApplyCoachSuggestion}
              getToken={getClientIdToken}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
