"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { AuthInput } from "@/components/auth/AuthInput";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Logo } from "@/components/ui/logo";
import {
  signInWithGoogle,
  signUpWithEmail,
  mapAuthError,
} from "@/lib/auth";

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

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleSignUp() {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const score = getPasswordScore(password);
    if (score < 2) {
      setError("Please choose a stronger password (at least 6 characters and a number).");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name.trim());
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-8 py-10 lg:px-16">
      <div className="flex items-center justify-between">
        <Logo variant="auth" />
        <p className="font-apple text-sm text-text-secondary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-text-primary hover:text-accent transition-colors"
          >
            Sign in →
          </Link>
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center py-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
              Create your workspace
            </h1>
            <p className="mt-2 font-apple text-sm text-text-secondary">
              Free to start. No credit card required.
            </p>
          </div>

          <GoogleButton
            label="Sign up with Google"
            onClick={handleGoogleSignUp}
            loading={googleLoading}
          />

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border-default" />
            <span className="font-mono text-[11px] text-text-muted">or</span>
            <div className="h-px flex-1 bg-border-default" />
          </div>

          <form
            onSubmit={handleEmailSignUp}
            className="flex flex-col gap-4"
          >
            <AuthInput
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
            />
            <AuthInput
              label="Work email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
            <div>
              <AuthInput
                label="Password"
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

            <p className="text-center font-mono text-[11px] leading-relaxed text-text-muted">
              By creating an account you agree to ArtMaster&apos;s{" "}
              <Link href="#" className="text-text-secondary underline underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-text-secondary underline underline-offset-2">
                Privacy Policy
              </Link>
            </p>

            {error && (
              <div className="rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2.5">
                <p className="font-mono text-[11px] text-status-error">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-apple text-sm font-semibold text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Spinner /> : null}
              {loading ? "Creating workspace..." : "Get started free"}
            </button>
          </form>
        </div>
      </div>

      <div className="text-center">
        <p className="font-mono text-[11px] text-text-muted">
          © 2025 ArtMaster Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
