"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Instagram, Facebook, Twitter, Linkedin, Music, MessageCircle, Search } from "lucide-react";
import { AuthInput } from "@/components/auth/AuthInput";
import { COUNTRIES, CONTINENTS, SWAHILI_COUNTRY_CODES } from "@/lib/constants/countries";
import { getFlagEmoji } from "@/lib/utils/location";
import type { WizardFormData, Platform, Language } from "@/types";
import type { CountryData } from "@/types";

const AGE_OPTIONS = ["18–24", "25–34", "35–44", "45–54", "55+", "All ages"];

const PLATFORMS: { value: Platform; label: string; size: string; Icon: React.ElementType }[] = [
  { value: "instagram", label: "Instagram", size: "1080×1080 · 1080×1350", Icon: Instagram },
  { value: "facebook", label: "Facebook", size: "1080×1080", Icon: Facebook },
  { value: "twitter", label: "Twitter / X", size: "1600×900", Icon: Twitter },
  { value: "linkedin", label: "LinkedIn", size: "1200×627", Icon: Linkedin },
  { value: "tiktok", label: "TikTok", size: "1080×1920", Icon: Music },
  { value: "whatsapp", label: "WhatsApp", size: "1080×1080", Icon: MessageCircle },
];

type LanguageOption = { value: Language; label: string; flag: string; key: string };

function getLanguageOptions(country: CountryData | null): LanguageOption[] {
  if (!country) {
    return [
      { value: "en", label: "English", flag: "🇬🇧", key: "en" },
      { value: "en", label: "French", flag: "🇫🇷", key: "fr" },
      { value: "en", label: "Arabic", flag: "🇸🇦", key: "ar" },
      { value: "both", label: "Other", flag: "🌐", key: "other" },
    ];
  }
  const code = country.code;
  const langs = country.languages;

  if (SWAHILI_COUNTRY_CODES.has(code)) {
    return [
      { value: "en", label: "English", flag: "🇬🇧", key: "en" },
      { value: "sw", label: "Swahili", flag: "🇹🇿", key: "sw" },
      { value: "both", label: "Both", flag: "⚡", key: "both" },
    ];
  }
  if (code === "NG") {
    return [
      { value: "en", label: "English", flag: "🇬🇧", key: "en" },
      { value: "both", label: "Yoruba / Hausa / Igbo", flag: "🇳🇬", key: "ng" },
      { value: "both", label: "Mix", flag: "⚡", key: "mix" },
    ];
  }
  if (["MA", "TN", "DZ"].includes(code)) {
    return [
      { value: "en", label: "Arabic", flag: "🇸🇦", key: "ar" },
      { value: "en", label: "French", flag: "🇫🇷", key: "fr" },
      { value: "both", label: "Both", flag: "⚡", key: "both" },
    ];
  }
  if (code === "ZA") {
    return [
      { value: "en", label: "English", flag: "🇬🇧", key: "en" },
      { value: "both", label: "Afrikaans", flag: "🇿🇦", key: "af" },
      { value: "both", label: "Zulu", flag: "🇿🇦", key: "zu" },
      { value: "both", label: "Other", flag: "🌐", key: "other" },
    ];
  }
  if (["EG", "SA", "AE"].includes(code)) {
    return [
      { value: "en", label: "Arabic", flag: "🇸🇦", key: "ar" },
      { value: "en", label: "English", flag: "🇬🇧", key: "en" },
      { value: "both", label: "Both", flag: "⚡", key: "both" },
    ];
  }
  const primary = langs[0] ?? "English";
  const primaryFlag = code ? getFlagEmoji(code) : "🌐";
  return [
    { value: "en", label: "English", flag: "🇬🇧", key: "en" },
    { value: "both", label: primary, flag: primaryFlag, key: "local" },
    { value: "both", label: "Both", flag: "⚡", key: "both" },
  ];
}

export function Step3Audience({
  formData,
  updateForm,
  onBack,
  onNext,
}: {
  formData: WizardFormData;
  updateForm: (fields: Partial<WizardFormData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [error, setError] = useState("");
  const [continent, setContinent] = useState<string>("");
  const [countrySearch, setCountrySearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  const filteredCountries = useMemo(() => {
    const list = [...COUNTRIES];
    if (continent) {
      const inContinent = list.filter((c) => c.continent === continent);
      const rest = list.filter((c) => c.continent !== continent);
      return [...inContinent, ...rest];
    }
    return list;
  }, [continent]);

  const searchFiltered = useMemo(() => {
    if (!countrySearch.trim()) return filteredCountries;
    const q = countrySearch.toLowerCase();
    return filteredCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [filteredCountries, countrySearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languageOptions = useMemo(
    () => getLanguageOptions(formData.selectedCountry),
    [formData.selectedCountry]
  );

  function handleNext() {
    if (formData.targetAudience.trim().length < 10) {
      setError("Please describe your target audience (at least 10 characters)");
      return;
    }
    setError("");
    onNext();
  }

  function togglePlatform(p: Platform) {
    const next = formData.platforms.includes(p)
      ? formData.platforms.filter((x) => x !== p)
      : [...formData.platforms, p];
    updateForm({ platforms: next });
  }

  function selectCountry(c: CountryData) {
    updateForm({ selectedCountry: c });
    setCountryOpen(false);
    setCountrySearch("");
  }

  return (
    <div>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        Who are you talking to?
      </h2>
      <p className="mt-2 font-sans text-sm text-text-secondary">
        ArtMaster crafts content that speaks directly to your audience.
      </p>
      <div className="mt-8 space-y-6">
        <div>
          <label className="font-apple text-xs font-medium text-text-secondary">
            Describe your target audience (required)
          </label>
          <textarea
            value={formData.targetAudience}
            onChange={(e) => updateForm({ targetAudience: e.target.value })}
            placeholder="e.g. Young professionals aged 25-35 interested in digital banking and financial independence"
            rows={3}
            maxLength={300}
            className="mt-1.5 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 font-apple text-sm text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
          />
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            {formData.targetAudience.length}/300
          </p>
          {error && (
            <p className="mt-1 font-mono text-[11px] text-status-error">{error}</p>
          )}
        </div>

        <div>
          <label className="font-apple text-xs font-medium text-text-secondary">
            Age range
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {AGE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => updateForm({ ageRange: opt })}
                className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                  formData.ageRange === opt
                    ? "border-accent bg-accent/10 text-text-primary"
                    : "border-border-default bg-bg-elevated hover:border-border-strong"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* ——— Where is your brand based? ——— */}
        <div>
          <h3 className="font-sans text-sm font-semibold text-text-primary mb-3">
            Where is your brand based?
          </h3>

          {/* Subsection A: Continent */}
          <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-2">
            Select your region
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {CONTINENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setContinent(c.id);
                  updateForm({ selectedCountry: null });
                }}
                className={`font-mono text-xs px-4 py-2 rounded-full border cursor-pointer transition-colors ${
                  continent === c.id
                    ? "bg-accent/10 border-accent text-text-primary"
                    : "border-border-default bg-bg-elevated hover:border-border-strong"
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {/* Subsection B: Country (shown after continent or always) */}
          {continent && (
            <>
              <label className="font-apple text-xs font-medium text-text-secondary block mb-1.5">
                Country
              </label>
              <div className="relative" ref={countryRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setCountryOpen(true);
                    }}
                    onFocus={() => setCountryOpen(true)}
                    placeholder="Search country..."
                    className="w-full rounded-xl border border-border-default bg-bg-elevated pl-9 pr-3 py-2.5 font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
                  />
                </div>
                {countryOpen && (
                  <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-border-default bg-bg-overlay shadow-lg">
                    {searchFiltered.length === 0 ? (
                      <div className="px-3 py-4 font-sans text-sm text-text-muted">
                        No countries found
                      </div>
                    ) : (
                      searchFiltered.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => selectCountry(c)}
                          className="w-full px-3 py-2 font-sans text-sm text-left hover:bg-bg-elevated flex items-center gap-2"
                        >
                          <span>{getFlagEmoji(c.code)}</span>
                          <span className="text-text-primary">{c.name}</span>
                          <span className="font-mono text-[11px] text-text-muted">
                            {c.code}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Preview card */}
              {formData.selectedCountry && (
                <div className="mt-3 rounded-xl border border-border-default bg-bg-surface p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">
                      {getFlagEmoji(formData.selectedCountry.code)}
                    </span>
                    <span className="font-sans text-sm font-semibold text-text-primary">
                      {formData.selectedCountry.name}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-bg-elevated text-text-muted">
                      {formData.selectedCountry.code}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-text-muted">
                    Timezone: {formData.selectedCountry.timezone} · Currency:{" "}
                    {formData.selectedCountry.currency}
                  </p>
                  <p className="font-mono text-[11px] text-text-muted">
                    Languages: {formData.selectedCountry.languages.join(", ")}
                  </p>
                </div>
              )}

              {/* Subsection C: City */}
              <div className="mt-4">
                <AuthInput
                  label="City (optional)"
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateForm({ city: e.target.value })}
                  placeholder="e.g. Lagos, Nairobi, Cairo"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="font-apple text-xs font-medium text-text-secondary">
            Which platforms do you post on?
          </label>
          <p className="mt-0.5 font-mono text-[11px] text-text-muted">
            ArtMaster will optimize poster sizes for these platforms
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PLATFORMS.map(({ value, label, size, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => togglePlatform(value)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${
                  formData.platforms.includes(value)
                    ? "border-accent bg-accent/5"
                    : "border-border-default bg-bg-surface hover:border-border-strong"
                }`}
              >
                <Icon size={24} className="text-text-muted" />
                <span className="font-sans text-sm font-medium text-text-primary">
                  {label}
                </span>
                <span className="font-mono text-[10px] text-text-muted">
                  {size}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-apple text-xs font-medium text-text-secondary">
            Content language
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {languageOptions.map((opt) => {
              const selected = formData.selectedCountry
                ? formData.language === opt.value
                : (formData.primaryLanguageKey ?? formData.language) === opt.key || (formData.primaryLanguageKey == null && opt.value === formData.language);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() =>
                    updateForm({
                      language: opt.value,
                      primaryLanguageKey: formData.selectedCountry ? undefined : opt.key,
                    })
                  }
                  className={`flex flex-col items-center gap-1 rounded-xl border p-4 transition-colors ${
                    selected
                      ? "border-accent bg-accent/5"
                      : "border-border-default bg-bg-surface hover:border-border-strong"
                  }`}
                >
                  <span className="text-lg">{opt.flag}</span>
                  <span className="font-sans text-sm font-medium text-text-primary text-center">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border-default bg-transparent px-4 py-2.5 font-apple text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="rounded-lg bg-accent px-4 py-2.5 font-apple text-sm font-semibold text-black transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
