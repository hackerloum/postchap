"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  updatePassword,
  reauthenticateWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { getAuthClient } from "@/lib/firebase/client";
import { getClientIdToken } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Loader2, User, Eye, EyeOff } from "lucide-react";

const COUNTRY_OPTIONS: { code: string; label: string }[] = [
  { code: "TZ", label: "Tanzania" },
  { code: "KE", label: "Kenya" },
  { code: "UG", label: "Uganda" },
  { code: "ZA", label: "South Africa" },
  { code: "NG", label: "Nigeria" },
  { code: "GH", label: "Ghana" },
  { code: "ET", label: "Ethiopia" },
  { code: "EG", label: "Egypt" },
  { code: "RW", label: "Rwanda" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "ZW", label: "Zimbabwe" },
  { code: "IN", label: "India" },
  { code: "AE", label: "UAE" },
  { code: "", label: "Other" },
];

type Profile = {
  email: string;
  displayName: string;
  phoneNumber: string | null;
  country: string | null;
  countryCode: string | null;
  currency: string | null;
};

/** Returns true if user has email/password provider (not just Google). */
function hasPasswordProvider(user: { providerData?: Array<{ providerId: string }> } | null): boolean {
  if (!user?.providerData) return false;
  return user.providerData.some((p) => p.providerId === "password");
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  const [form, setForm] = useState({
    displayName: "",
    phoneNumber: "",
    countryCode: "",
  });

  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getClientIdToken();
        const res = await fetch("/api/me", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (cancelled) return;
        if (!res.ok) {
          setProfile(null);
          return;
        }
        const data = await res.json();
        setProfile({
          email: data.email ?? "",
          displayName: data.displayName ?? "",
          phoneNumber: data.phoneNumber ?? null,
          country: data.country ?? null,
          countryCode: data.countryCode ?? null,
          currency: data.currency ?? null,
        });
        setForm({
          displayName: data.displayName ?? "",
          phoneNumber: data.phoneNumber ?? "",
          countryCode: data.countryCode ?? "",
        });
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Detect if user signed up with Google only (no password provider)
  useEffect(() => {
    const auth = getAuthClient();
    const check = (user: { providerData?: Array<{ providerId: string }> } | null) => {
      setHasPassword(user ? hasPasswordProvider(user) : null);
    };
    check(auth.currentUser);
    const unsub = auth.onAuthStateChanged(check);
    return () => unsub();
  }, []);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    const { password, confirmPassword } = passwordForm;
    if (password.length < 8) {
      setPasswordMessage({ type: "err", text: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirmPassword) {
      setPasswordMessage({ type: "err", text: "Passwords do not match." });
      return;
    }
    setPasswordSaving(true);
    try {
      const auth = getAuthClient();
      const user = auth.currentUser;
      if (!user) {
        setPasswordMessage({ type: "err", text: "Not signed in. Please sign in again." });
        return;
      }
      try {
        await updatePassword(user, password);
        setPasswordForm({ password: "", confirmPassword: "" });
        setHasPassword(true);
        setPasswordMessage({ type: "ok", text: "Password set. You can now sign in with email and password." });
      } catch (err: unknown) {
        const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
        if (code === "auth/requires-recent-login") {
          const provider = new GoogleAuthProvider();
          await reauthenticateWithPopup(user, provider);
          await updatePassword(user, password);
          setPasswordForm({ password: "", confirmPassword: "" });
          setHasPassword(true);
          setPasswordMessage({ type: "ok", text: "Password set. You can now sign in with email and password." });
        } else {
          setPasswordMessage({
            type: "err",
            text: code === "auth/weak-password" ? "Password must be at least 6 characters." : "Failed to set password. Try again.",
          });
        }
      }
    } catch {
      setPasswordMessage({ type: "err", text: "Failed to set password. Try again." });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      const token = await getClientIdToken();
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          displayName: form.displayName.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || null,
          countryCode: form.countryCode.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Failed to save" });
        return;
      }
      setProfile({
        ...profile!,
        displayName: data.displayName ?? "",
        phoneNumber: data.phoneNumber ?? null,
        countryCode: data.countryCode ?? null,
      });
      setMessage({ type: "ok", text: "Profile saved." });
    } catch {
      setMessage({ type: "err", text: "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 max-w-2xl mx-auto flex items-center justify-center min-h-[40vh]">
        <Loader2 size={24} className="text-accent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-4 py-8 sm:px-6 max-w-2xl mx-auto">
        <p className="text-text-muted">Could not load profile. Try signing in again.</p>
        <Link href="/dashboard" className="text-accent hover:underline mt-2 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-8 pb-24 md:pb-8 sm:px-6 max-w-2xl mx-auto">
      <Link href="/dashboard" className="font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors inline-flex gap-1 mb-6">
        <span>←</span> Back to dashboard
      </Link>
      <div className="flex items-center gap-2 mb-6">
        <User size={20} className="text-accent" />
        <h1 className="font-semibold text-2xl text-text-primary tracking-tight">Profile</h1>
      </div>
      <p className="font-mono text-xs text-text-muted mb-6">
        Your name and phone are used for payments (e.g. mobile money). Country affects pricing.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="profile-email" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted mb-1.5">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={profile.email}
            readOnly
            className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-muted cursor-not-allowed"
          />
          <p className="font-mono text-[10px] text-text-muted mt-1">Managed by your sign-in account.</p>
        </div>

        <div>
          <label htmlFor="profile-displayName" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted mb-1.5">
            Name
          </label>
          <input
            id="profile-displayName"
            type="text"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder="Your name"
            className="w-full rounded-lg border border-border-default bg-bg-base px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted mb-1.5">
            Phone number
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            placeholder="e.g. 0712 345 678 or +255 712 345 678"
            className="w-full rounded-lg border border-border-default bg-bg-base px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <p className="font-mono text-[10px] text-text-muted mt-1">Used for mobile money payments. Include country code if outside Tanzania.</p>
        </div>

        <div>
          <label htmlFor="profile-country" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted mb-1.5">
            Country
          </label>
          <select
            id="profile-country"
            value={form.countryCode}
            onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value }))}
            className="w-full rounded-lg border border-border-default bg-bg-base px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt.code || "other"} value={opt.code}>
                {opt.label || "—"}
              </option>
            ))}
          </select>
          <p className="font-mono text-[10px] text-text-muted mt-1">Affects plan pricing and payment options (e.g. mobile money in Tanzania).</p>
        </div>

        {message && (
          <p className={message.type === "ok" ? "text-success text-sm" : "text-red-500 text-sm"}>
            {message.text}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={saving}>
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving…
            </>
          ) : (
            "Save profile"
          )}
        </Button>
      </form>

      {hasPassword === false && (
        <div className="mt-10 pt-8 border-t border-border-default">
          <h2 className="font-semibold text-lg text-text-primary mb-1">Add password</h2>
          <p className="font-mono text-[11px] text-text-muted mb-4">
            You signed in with Google. Add a password to also sign in with email and password.
          </p>
          <form onSubmit={handleSetPassword} className="space-y-4 max-w-sm">
            <div>
              <label htmlFor="profile-password" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  id="profile-password"
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-lg border border-border-default bg-bg-base px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="profile-confirm-password" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted mb-1.5">
                Confirm password
              </label>
              <input
                id="profile-confirm-password"
                type={showPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repeat password"
                className="w-full rounded-lg border border-border-default bg-bg-base px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                autoComplete="new-password"
              />
            </div>
            {passwordMessage && (
              <p className={passwordMessage.type === "ok" ? "text-success text-sm" : "text-red-500 text-sm"}>
                {passwordMessage.text}
              </p>
            )}
            <Button type="submit" variant="primary" disabled={passwordSaving}>
              {passwordSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Setting…
                </>
              ) : (
                "Set password"
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
