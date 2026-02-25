"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { getAuthClient } from "@/lib/firebase/client";
import { AuthDivider, AuthErrorMessage } from "@/components/auth/AuthShared";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Eye, EyeOff, Loader2 } from "lucide-react";

function getStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function getStrengthLabel(password: string): string {
  const s = getStrength(password);
  return ["", "Weak", "Fair", "Good", "Strong"][s] || "";
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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
    if (!res.ok) throw new Error("Session failed");
    router.push("/onboarding");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    try {
      const cred = await createUserWithEmailAndPassword(
        getAuthClient(),
        email,
        password
      );
      await updateProfile(cred.user, { displayName: name });
      const token = await cred.user.getIdToken();
      await handleSession(token);
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code: string }).code
          : "";
      setError(getFirebaseError(code));
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
          Create your account
        </h1>
        <p className="font-mono text-[13px] text-text-muted">
          Start automating your brand today
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

      <form onSubmit={handleSignUp} className="space-y-0">
        <div className="mb-4">
          <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">
            Full name
          </label>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors min-h-[48px]"
          />
        </div>

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

        <div className="mb-6">
          <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted block mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
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

          {password && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 h-1 rounded-full transition-all ${
                      getStrength(password) >= level
                        ? level <= 1
                          ? "bg-error"
                          : level <= 2
                            ? "bg-warning"
                            : level <= 3
                              ? "bg-accent"
                              : "bg-success"
                        : "bg-bg-elevated"
                    }`}
                  />
                ))}
              </div>
              <p className="font-mono text-[10px] text-text-muted">
                {getStrengthLabel(password)}
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent text-black font-semibold text-[14px] py-3.5 rounded-xl hover:bg-accent-dim transition-all active:scale-[0.99] min-h-[52px] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="text-center font-mono text-[11px] text-text-muted mt-4 leading-relaxed">
        By signing up you agree to our{" "}
        <Link
          href="/terms"
          className="text-text-secondary hover:text-accent transition-colors"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-text-secondary hover:text-accent transition-colors"
        >
          Privacy Policy
        </Link>
      </p>

      <p className="text-center font-mono text-[13px] text-text-muted mt-4">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-text-primary hover:text-accent transition-colors font-semibold"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

function getFirebaseError(code: string): string {
  const errors: Record<string, string> = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/popup-blocked": "Popup was blocked. Please allow popups.",
  };
  return errors[code] ?? "Something went wrong. Please try again.";
}
