"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Upload, X, ImageIcon } from "lucide-react";

interface Kit {
  brandName: string;
  industry: string;
  tagline: string;
  website: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  tone: string;
  styleNotes: string;
  targetAudience: string;
  language: string;
  logoUrl: string;
}

const DEFAULT: Kit = {
  brandName: "ArtMaster",
  industry: "SaaS / AI Tools",
  tagline: "AI-powered poster generation for your brand",
  website: "https://artmasterpro.com",
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  accentColor: "#a3e635",
  tone: "professional",
  styleNotes: "",
  targetAudience: "Small business owners, marketers, creators",
  language: "English",
  logoUrl: "",
};

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  name: keyof Kit;
  value: string;
  onChange: (k: keyof Kit, v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block font-mono text-[11px] text-text-muted mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
        />
      ) : type === "color" ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            className="w-10 h-10 rounded-lg border border-border-default cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            className="flex-1 bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary font-mono focus:outline-none focus:border-accent"
          />
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-[13px] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
      )}
    </div>
  );
}

export default function ArtMasterKitPage() {
  const [kit, setKit] = useState<Kit>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/artmaster-kit", { credentials: "same-origin" })
      .then((r) => r.ok && r.json())
      .then((d) => d && Object.keys(d).length > 0 && setKit({ ...DEFAULT, ...d }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(key: keyof Kit, value: string) {
    setKit((prev) => ({ ...prev, [key]: value }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Must be an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/logo", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Upload failed");
      setKit((prev) => ({ ...prev, logoUrl: data.url }));
      toast.success("Logo uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/artmaster-kit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(kit),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("ArtMaster brand kit saved.");
    } catch {
      toast.error("Failed to save brand kit.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={18} className="text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">ArtMaster Brand Kit</h1>
          <p className="font-mono text-[12px] text-text-muted mt-1">
            Used when creating self-promotion posters for ArtMaster
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-accent text-black font-semibold text-[13px] px-4 py-2.5 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50 min-h-[40px]"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      </div>

      <div className="space-y-5">
        {/* Logo upload */}
        <div>
          <label className="block font-mono text-[11px] text-text-muted mb-1.5 uppercase tracking-wide">
            Logo
          </label>
          <div className="flex items-center gap-4">
            {kit.logoUrl ? (
              <div className="relative w-20 h-20 rounded-xl border border-border-default bg-bg-elevated flex items-center justify-center overflow-hidden">
                <img
                  src={kit.logoUrl}
                  alt="ArtMaster logo"
                  className="w-full h-full object-contain p-2"
                />
                <button
                  type="button"
                  onClick={() => setKit((prev) => ({ ...prev, logoUrl: "" }))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-bg-base/80 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                >
                  <X size={10} className="text-text-muted" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border border-dashed border-border-default bg-bg-elevated flex items-center justify-center">
                <ImageIcon size={20} className="text-text-muted" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2 bg-bg-elevated border border-border-default text-text-primary font-medium text-[12px] px-3 py-2 rounded-lg hover:border-border-strong transition-colors disabled:opacity-50"
              >
                {uploadingLogo ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Upload size={12} />
                )}
                {uploadingLogo ? "Uploading..." : "Upload logo"}
              </button>
              <p className="font-mono text-[10px] text-text-muted">
                PNG, SVG or WebP · Max 5MB
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Brand name" name="brandName" value={kit.brandName} onChange={update} />
          <Field label="Industry" name="industry" value={kit.industry} onChange={update} />
        </div>
        <Field label="Tagline" name="tagline" value={kit.tagline} onChange={update} />
        <Field label="Website" name="website" value={kit.website} onChange={update} type="url" />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Primary color" name="primaryColor" value={kit.primaryColor} onChange={update} type="color" />
          <Field label="Secondary color" name="secondaryColor" value={kit.secondaryColor} onChange={update} type="color" />
          <Field label="Accent color" name="accentColor" value={kit.accentColor} onChange={update} type="color" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tone" name="tone" value={kit.tone} onChange={update} placeholder="professional, playful..." />
          <Field label="Language" name="language" value={kit.language} onChange={update} />
        </div>
        <Field label="Target audience" name="targetAudience" value={kit.targetAudience} onChange={update} />
        <Field label="Style notes" name="styleNotes" value={kit.styleNotes} onChange={update} type="textarea" placeholder="Any specific visual or copy guidelines..." />
      </div>
    </div>
  );
}
