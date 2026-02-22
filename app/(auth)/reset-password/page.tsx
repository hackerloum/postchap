"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { getAuthClient } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(getAuthClient(), email);
      setSent(true);
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

  if (sent) {
    return (
      <div className="text-center animate-fade-up">
        <div className="w-12 h-12 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-4">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3DDC84"
            strokeWidth="2.5"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-semibold text-lg text-text-primary">
          Check your email
        </h2>
        <p className="mt-2 font-mono text-xs text-text-muted">
          We sent a reset link to {email}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block font-mono text-xs text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <h1 className="font-semibold text-2xl text-text-primary tracking-tight">
        Reset your password
      </h1>
      <p className="mt-1 font-mono text-xs text-text-muted">
        Enter your email and we&apos;ll send a reset link
      </p>

      <form onSubmit={handleReset} className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error && (
          <div className="bg-error/10 border border-error/30 rounded-lg px-4 py-3 font-mono text-xs text-error">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full"
        >
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center font-mono text-xs text-text-muted">
        <Link
          href="/login"
          className="text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
