"use client";

import { COOKIE_CONSENT_STORAGE_KEY } from "./CookieConsent";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

/**
 * Link that clears the stored cookie consent and reloads the page so the
 * cookie banner appears again, letting the user change their preference.
 */
export function CookiePreferencesLink({ className, children }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    } catch {
      // ignore
    }
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {children ?? "Cookie preferences"}
    </button>
  );
}
