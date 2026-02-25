import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { CookiePreferencesLink } from "@/components/CookiePreferencesLink";

const NAV_ITEMS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <header className="sticky top-0 left-0 right-0 h-14 z-50 bg-bg-base/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-full">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/artmasterwordmarklogo-03-03.webp"
              alt="Art Master"
              width={200}
              height={52}
              className="h-6 w-auto sm:h-10 object-contain object-left"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`font-mono text-[12px] transition-colors ${
                  item.href === "/pricing"
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="font-mono text-[12px] text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 hidden sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 bg-accent text-black font-semibold text-[13px] px-4 py-2 rounded-lg hover:bg-accent-dim transition-colors"
            >
              Get started
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-20">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="font-mono text-[11px] text-accent tracking-[0.2em] mb-4">
            PRICING
          </p>
          <h1 className="font-semibold text-[40px] sm:text-[52px] text-text-primary tracking-tight leading-[1.05] mb-5">
            Simple, transparent
            <br />
            <span className="text-text-muted">pricing.</span>
          </h1>
          <p className="text-[16px] text-text-secondary leading-relaxed">
            Start free. Scale when you&apos;re ready. No hidden fees, no
            surprises.
          </p>
        </div>

        <PricingPlans context="landing" />

        <div className="text-center mt-20">
          <p className="font-mono text-[13px] text-text-muted mb-4">
            Questions? We&apos;re here to help.
          </p>
          <Link
            href="/contact"
            className="font-mono text-[13px] text-accent hover:underline"
          >
            Contact us →
          </Link>
        </div>
      </main>

      <footer className="bg-bg-surface mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 py-16 border-b border-border-subtle/40">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <Image
                  src="/artmasterwordmarklogo-03-03.webp"
                  alt="Art Master Platform"
                  width={240}
                  height={63}
                  className="h-10 w-auto sm:h-20 object-contain object-left"
                />
              </div>
              <p className="text-[14px] text-text-secondary leading-relaxed max-w-xs mb-6">
                Automated social media poster generation for African businesses
                scaling globally.
              </p>
              <div className="inline-flex items-center gap-2 bg-bg-elevated border border-border-default/50 rounded-full px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="font-mono text-[11px] text-text-muted">
                  Built for Africa · Used worldwide
                </span>
              </div>
            </div>
            <div>
              <p className="font-mono text-[11px] text-text-muted tracking-[0.15em] mb-5">
                PRODUCT
              </p>
              <ul className="space-y-3">
                {[
                  { label: "Features", href: "/#features" },
                  { label: "How it works", href: "/#how-it-works" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "Sign up", href: "/signup" },
                  { label: "Sign in", href: "/login" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-text-secondary hover:text-text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] text-text-muted tracking-[0.15em] mb-5">
                LEGAL
              </p>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/privacy"
                    className="text-[14px] text-text-secondary hover:text-text-primary transition-colors duration-200"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-[14px] text-text-secondary hover:text-text-primary transition-colors duration-200"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-[14px] text-text-secondary hover:text-text-primary transition-colors duration-200"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <CookiePreferencesLink className="text-[14px] text-text-secondary hover:text-text-primary transition-colors duration-200">
                    Cookie preferences
                  </CookiePreferencesLink>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6">
            <p className="font-mono text-[12px] text-text-muted">
              © {new Date().getFullYear()} ArtMaster Platform. All rights
              reserved.
            </p>
            <p className="font-mono text-[12px] text-text-muted">
              artmasterpro.com
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
