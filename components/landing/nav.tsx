"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#docs", label: "Docs" },
];

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border-subtle bg-bg-base">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6 md:px-8">
          <Logo variant="nav" />

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-apple text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Button variant="ghost" asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="primary" asChild size="sm">
              <Link href="/signup">Start free</Link>
            </Button>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border-default text-text-primary md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-bg-base md:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b border-border-subtle px-6">
              <Logo variant="nav" />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-border-default"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-6 py-6">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    className="block py-3 font-apple text-sm text-text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * NAV_LINKS.length, duration: 0.2 }}
                className="mt-4 flex flex-col gap-4 border-t border-border-default pt-6"
              >
                <Button variant="ghost" asChild className="w-full justify-center">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button variant="primary" asChild className="w-full justify-center">
                  <Link href="/signup">Start free</Link>
                </Button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
