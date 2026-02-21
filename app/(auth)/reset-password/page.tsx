"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { AuthInput } from "@/components/auth/AuthInput";
import { sendPasswordResetEmail, mapAuthError } from "@/lib/auth";

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

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSent(true);
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
          {!sent ? (
            <>
              <div className="mb-8">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
                  Reset your password
                </h1>
                <p className="mt-2 font-apple text-sm text-text-secondary">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <AuthInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
                {error && (
                  <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: [-4, 4, -4, 4, 0] }}
                    transition={{ duration: 0.4 }}
                    className="rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2.5"
                  >
                    <p className="font-mono text-[11px] text-status-error">
                      {error}
                    </p>
                  </motion.div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-apple text-sm font-semibold text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Spinner /> : null}
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-status-success/30 bg-status-success/10">
                <Check size={20} className="text-status-success" />
              </div>
              <h2 className="font-display text-xl text-text-primary">
                Check your email
              </h2>
              <p className="mt-2 font-mono text-xs text-text-muted">
                We sent a reset link to {email}
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block font-apple text-sm text-text-primary hover:text-accent transition-colors"
              >
                ← Back to sign in
              </Link>
            </div>
          )}
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
