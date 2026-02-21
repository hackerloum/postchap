"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { updatePassword, mapAuthError } from "@/lib/auth";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function getPasswordScore(password: string): number {
  if (!password || password.length === 0) return 0;
  let score = 0;
  if (password.length >= 6) score = 1;
  if (score >= 1 && /\d/.test(password)) score = 2;
  if (score >= 2 && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
    score = 3;
  if (score >= 3 && password.length >= 12) score = 4;
  return score;
}

function UpdatePasswordForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const fromResetLink = Boolean(oobCode);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (getPasswordScore(password) < 2) {
      setError("Please choose a stronger password (at least 6 characters and a number).");
      return;
    }
    if (fromResetLink && !oobCode) {
      setError("Invalid reset link. Request a new one from the login page.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password, fromResetLink, oobCode ?? undefined);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-8 py-10 lg:px-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-base font-semibold text-text-primary">
            ArtMaster
          </span>
          <span className="rounded border border-accent/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
            Platform
          </span>
        </Link>
        <Link
          href="/login"
          className="font-apple text-sm text-text-secondary hover:text-accent transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto w-full max-w-sm"
        >
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
              Set new password
            </h1>
            <p className="mt-2 font-apple text-sm text-text-secondary">
              {fromResetLink
                ? "Enter your new password below. This link was sent to your email."
                : "Enter your new password below."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <AuthInput
                label="New password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={14} className="text-text-muted" />
                    ) : (
                      <Eye size={14} className="text-text-muted" />
                    )}
                  </button>
                }
              />
              <PasswordStrength password={password} />
            </div>
            <AuthInput
              label="Confirm password"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            {error && (
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: [-4, 4, -4, 4, 0] }}
                transition={{ duration: 0.4 }}
                className="rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2.5"
              >
                <p className="font-mono text-[11px] text-status-error">{error}</p>
              </motion.div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-apple text-sm font-semibold text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Spinner /> : null}
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        </motion.div>
      </div>

      <div className="text-center">
        <p className="font-mono text-[11px] text-text-muted">
          © 2025 ArtMaster Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={null}>
      <UpdatePasswordForm />
    </Suspense>
  );
}
