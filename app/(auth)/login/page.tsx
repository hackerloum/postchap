"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { getAuthClient } from "@/lib/firebase/client";
import { AuthDivider, AuthErrorMessage } from "@/components/auth/AuthShared";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [error, setError] = useState("");

  async function handleSession(token: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) throw new Error("Failed to create session");

    const data = await res.json();

    if (data.hasOnboarded) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      const cred = await signInWithEmailAndPassword(
        getAuthClient(),
        email,
        password
      );
      const token = await cred.user.getIdToken();
      await handleSession(token);
    } catch (err: unknown) {
      const msg = getFirebaseError(
        err && typeof err === "object" && "code" in err
          ? (err as { code: string }).code
          : ""
      );
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoad(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(getAuthClient(), provider);
      const token = await cred.user.getIdToken();
      await handleSession(token);
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code: string }).code
          : "";
      if (code !== "auth/popup-closed-by-user") {
        setError(getFirebaseError(code));
      }
    } finally {
      setGoogleLoad(false);
    }
  }

  const isLoading = loading || googleLoad;

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-semibold text-[24px] text-text-primary tracking-tight mb-1">
          Welcome back
        </h1>
        <p className="font-mono text-[13px] text-text-muted">
          Sign in to your ArtMaster account
        </p>
      </div>

      {error && <AuthErrorMessage message={error} />}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 bg-bg-surface border border-border-default text-text-primary font-medium text-[14px] py-3.5 rounded-xl hover:bg-bg-elevated hover:border-border-strong transition-all min-h-[52px] disabled:opacity-50"
      >
        {googleLoad ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      <AuthDivider />

      <form onSubmit={handleSignIn} className="space-y-0">
        <div className="mb-4">
          <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">
            Email
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

        <div className="mb-2">
          <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 pr-12 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors min-h-[48px]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            >
              {showPassword ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <Link
            href="/reset-password"
            className="font-mono text-[12px] text-text-muted hover:text-accent transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-accent-dim transition-all active:scale-[0.99] min-h-[52px] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="text-center font-mono text-[13px] text-text-muted mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-text-primary hover:text-accent transition-colors font-semibold"
        >
          Create one free
        </Link>
      </p>
    </div>
  );
}

function getFirebaseError(code: string): string {
  const errors: Record<string, string> = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests":
      "Too many attempts. Try again in a few minutes.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/popup-blocked":
      "Popup was blocked. Please allow popups and try again.",
  };
  return errors[code] ?? "Something went wrong. Please try again.";
}
