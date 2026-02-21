"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { AuthInput } from "@/components/auth/AuthInput";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Logo } from "@/components/ui/logo";
import {
  signInWithGoogleRedirect,
  handleGoogleRedirectResult,
  signInWithEmail,
  mapAuthError,
  clearSession,
} from "@/lib/auth";

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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingRedirect, setCheckingRedirect] = useState(true);
  const [error, setError] = useState("");
  const redirectProcessed = useRef(false);

  // Handle return from Google redirect sign-in (only once; getRedirectResult() consumes the result)
  useEffect(() => {
    if (redirectProcessed.current) {
      setCheckingRedirect(false);
      return;
    }
    let cancelled = false;
    redirectProcessed.current = true;
    handleGoogleRedirectResult()
      .then((handled) => {
        if (cancelled) return;
        if (handled) setGoogleLoading(true);
        setCheckingRedirect(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(mapAuthError(err));
        setCheckingRedirect(false);
      });
    return () => { cancelled = true; };
  }, []);

  function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    try {
      signInWithGoogleRedirect();
    } catch (err) {
      setError(mapAuthError(err));
      setGoogleLoading(false);
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmail(email, password);
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
          New to ArtMaster?{" "}
          <Link
            href="/signup"
            className="text-text-primary hover:text-accent transition-colors"
          >
            Create account →
          </Link>
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center py-12">
        <div className="mx-auto w-full max-w-sm">
          {checkingRedirect ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-default border-t-accent" aria-hidden />
              <p className="font-mono text-sm text-text-muted">Checking sign-in…</p>
            </div>
          ) : (
            <>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
              Welcome back
            </h1>
            <p className="mt-2 font-apple text-sm text-text-secondary">
              Sign in to your ArtMaster workspace
            </p>
          </div>

          <GoogleButton
            label="Continue with Google"
            onClick={handleGoogleSignIn}
            loading={googleLoading}
          />

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border-default" />
            <span className="font-mono text-[11px] text-text-muted">or</span>
            <div className="h-px flex-1 bg-border-default" />
          </div>

          <form
            onSubmit={handleEmailSignIn}
            className="flex flex-col gap-4"
          >
            <AuthInput
              label="Email"
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
                autoComplete="current-password"
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
              <div className="mt-1.5 flex justify-end">
                <Link
                  href="/reset-password"
                  className="font-mono text-[11px] text-text-muted hover:text-text-secondary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
            </>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="font-mono text-[11px] text-text-muted">
          © 2025 ArtMaster Platform. All rights reserved.
        </p>
        <button
          type="button"
          onClick={async () => {
            await clearSession();
            window.location.reload();
          }}
          className="mt-3 font-mono text-[11px] text-text-muted underline hover:text-text-secondary"
        >
          Clear session and reload
        </button>
      </div>
    </div>
  );
}
