"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { getAuthClient } from "@/lib/firebase/client";
import { AuthErrorMessage } from "@/components/auth/AuthShared";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      await sendPasswordResetEmail(getAuthClient(), email);
      setSubmitted(true);
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code: string }).code
          : "";
      setError(
        code === "auth/user-not-found"
          ? "No account found with this email."
          : "Failed to send reset email. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 font-mono text-[12px] text-text-muted hover:text-text-secondary transition-colors mb-8"
      >
        <ArrowLeft size={13} />
        Back to sign in
      </Link>

      {!submitted ? (
        <>
          <div className="mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <Mail size={18} className="text-accent" />
            </div>
            <h1 className="font-semibold text-[24px] text-text-primary tracking-tight mb-1">
              Reset your password
            </h1>
            <p className="font-mono text-[13px] text-text-muted leading-relaxed">
              Enter your email and we&apos;ll send you a reset link right away.
            </p>
          </div>

          {error && <AuthErrorMessage message={error} />}

          <form onSubmit={handleReset} className="space-y-0">
            <div className="mb-6">
              <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors min-h-[48px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-accent-dim transition-all active:scale-[0.99] min-h-[52px] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={24} className="text-success" />
          </div>
          <h2 className="font-semibold text-[22px] text-text-primary tracking-tight mb-3">
            Check your email
          </h2>
          <p className="font-mono text-[13px] text-text-muted leading-relaxed mb-8">
            We sent a reset link to{" "}
            <span className="text-text-primary font-semibold">{email}</span>.
            Check your inbox and follow the instructions.
          </p>
          <p className="font-mono text-[12px] text-text-muted mb-4">
            Didn&apos;t receive it?
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="font-mono text-[13px] text-accent hover:underline"
          >
            Try a different email
          </button>
        </div>
      )}
    </div>
  );
}
