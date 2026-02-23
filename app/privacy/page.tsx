import Link from "next/link";
import { CookiePreferencesLink } from "@/components/CookiePreferencesLink";

export const metadata = {
  title: "Privacy & Cookies | ArtMaster",
  description: "How ArtMaster uses cookies and handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <header className="border-b border-border-subtle">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-text-primary">
            ArtMaster
          </Link>
          <Link
            href="/"
            className="font-mono text-xs text-text-muted hover:text-text-primary"
          >
            ← Back
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Privacy & Cookies
        </h1>
        <p className="font-mono text-xs text-text-muted mb-8">
          Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <section className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <div>
            <h2 className="text-base font-medium text-text-primary mb-2">Cookies we use</h2>
            <p>
              ArtMaster uses cookies and similar storage to keep you signed in, remember your preferences, 
              and make the platform work correctly. We use:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-text-muted">
              <li><strong className="text-text-secondary">Session cookie</strong> — So you stay logged in and we can securely identify you on the server.</li>
              <li><strong className="text-text-secondary">Local storage</strong> — To remember choices like cookie consent and UI preferences.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-medium text-text-primary mb-2">Why we use them</h2>
            <p>
              These cookies are necessary for the service to function (sign-in, dashboard, poster generation). 
              We do not use third-party advertising cookies.
            </p>
          </div>

          <div>
            <h2 className="text-base font-medium text-text-primary mb-2">Your choices</h2>
            <p>
              When you first visit, we ask for your consent. You can accept all cookies or decline non-essential ones. 
              You can change your mind at any time:{" "}
              <CookiePreferencesLink className="text-accent hover:underline font-medium inline">
                open cookie preferences
              </CookiePreferencesLink>
              {" "}(the cookie banner will show again so you can accept or decline).
            </p>
          </div>

          <div>
            <h2 className="text-base font-medium text-text-primary mb-2">Data we collect</h2>
            <p>
              We store your account data (email, brand kits, generated posters) to provide the service. 
              We use Firebase and our own infrastructure. We do not sell your data.
            </p>
          </div>
        </section>

        <p className="mt-10 font-mono text-xs text-text-muted">
          Questions? Contact us at your support email or through the app.
        </p>
      </main>
    </div>
  );
}
