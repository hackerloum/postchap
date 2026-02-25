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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
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

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Yield so React can paint loading state before Firebase/auth work runs
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      const cred = await signInWithEmailAndPassword(getAuthClient(), email, password);
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

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoad(true);
    // Yield so React can paint loading state before Firebase/auth work runs
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

  return (
    <div className="animate-fade-up">
      <h1 className="font-semibold text-2xl text-text-primary tracking-tight">
        Welcome back
      </h1>
      <p className="mt-1 font-mono text-xs text-text-muted">
        Sign in to ArtMaster Platform
      </p>

      <button
        onClick={handleGoogleLogin}
        disabled={googleLoad || loading}
        className="mt-6 w-full flex items-center justify-center gap-3 bg-bg-surface border border-border-default rounded-lg px-4 py-3 text-sm font-medium text-text-primary hover:border-border-strong hover:bg-bg-elevated transition-colors min-h-[48px] disabled:opacity-50"
      >
        {googleLoad ? (
          <span className="w-4 h-4 border-2 border-border-strong border-t-text-primary rounded-full animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="font-mono text-[11px] text-text-muted">or</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPass ? "text" : "password"}
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPass((p) => !p)}
            className="absolute right-3 bottom-2.5 text-text-muted hover:text-text-primary transition-colors p-1"
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        <div className="flex justify-end">
          <Link href="/reset-password" className="font-mono text-[11px] text-text-muted hover:text-text-secondary transition-colors">
            Forgot password?
          </Link>
        </div>

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
          disabled={googleLoad}
          className="w-full"
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center font-mono text-xs text-text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2">
          Sign up free
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
    "auth/too-many-requests": "Too many attempts. Try again in a few minutes.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/popup-blocked": "Popup was blocked. Please allow popups and try again.",
  };
  return errors[code] ?? "Something went wrong. Please try again.";
}
