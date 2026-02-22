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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [error, setError] = useState("");

  function getStrength(p: string): number {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }

  const strength = getStrength(password);
  const strengthColors = ["bg-error", "bg-warning", "bg-warning", "bg-success", "bg-success"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  async function handleSession(token: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) throw new Error("Session failed");
    router.push("/onboarding");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(getAuthClient(), email, password);
      await updateProfile(cred.user, { displayName: name });
      const token = await cred.user.getIdToken();
      await handleSession(token);
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      setError(getFirebaseError(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError("");
    setGoogleLoad(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(getAuthClient(), provider);
      const token = await cred.user.getIdToken();
      await handleSession(token);
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
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
        Create your account
      </h1>
      <p className="mt-1 font-mono text-xs text-text-muted">
        Start automating your brand today
      </p>

      <button
        onClick={handleGoogleSignup}
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

      <form onSubmit={handleSignup} className="space-y-4">
        <Input label="Full name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        <Input label="Email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />

        <div className="space-y-2">
          <div className="relative">
            <Input
              label="Password"
              type={showPass ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute right-3 bottom-2.5 text-text-muted hover:text-text-primary transition-colors p-1"
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? strengthColors[strength] : "bg-bg-elevated"}`} />
                ))}
              </div>
              <p className="font-mono text-[11px] text-text-muted">{strengthLabels[strength]}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 rounded-lg px-4 py-3 font-mono text-xs text-error">
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" loading={loading} disabled={googleLoad} className="w-full">
          Create account
        </Button>

        <p className="font-mono text-[11px] text-text-muted text-center">
          By signing up you agree to our Terms of Service
        </p>
      </form>

      <p className="mt-6 text-center font-mono text-xs text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-text-secondary hover:text-text-primary transition-colors underline underline-offset-2">
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
