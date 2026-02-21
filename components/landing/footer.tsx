import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const PRODUCT_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#docs", label: "Docs" },
];

const COMPANY_LINKS = [
  { href: "#", label: "About" },
  { href: "#", label: "Blog" },
  { href: "#", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "#", label: "Privacy" },
  { href: "#", label: "Terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Logo variant="footer" />
            <p className="mt-4 font-apple text-sm font-normal leading-relaxed text-text-secondary">
              ArtMaster Platform — Built for brands that mean business.
            </p>
          </div>
          <div>
            <h4 className="font-apple text-xs font-semibold uppercase tracking-wide text-text-muted">
              Product
            </h4>
            <ul className="mt-4 space-y-2">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-apple text-sm text-text-secondary hover:text-text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-apple text-xs font-semibold uppercase tracking-wide text-text-muted">
              Company
            </h4>
            <ul className="mt-4 space-y-2">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-apple text-sm text-text-secondary hover:text-text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-apple text-xs font-semibold uppercase tracking-wide text-text-muted">
              Legal
            </h4>
            <ul className="mt-4 space-y-2">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-apple text-sm text-text-secondary hover:text-text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border-default pt-8 md:flex-row">
          <p className="font-mono text-xs text-text-muted">
            © 2025 ArtMaster Platform. All rights reserved.
          </p>
          <p className="font-mono text-xs text-text-muted">
            <a href="https://artmasterpro.com" className="text-text-secondary hover:text-text-primary">artmasterpro.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
