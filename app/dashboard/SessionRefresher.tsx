"use client";

import { useEffect, useRef } from "react";
import { getAuthClient } from "@/lib/firebase/client";
import { refreshSessionCookie } from "@/lib/auth-client";

/**
 * Keeps the __session cookie valid on every page of the app.
 * Now lives in the root layout so it runs on /checkout, /pricing, and after
 * payment redirects — not only on the dashboard.
 *
 * With Firebase session cookies (14-day), this is a safety net rather than a
 * hard requirement. It still ensures the cookie stays fresh after the user
 * returns from an external redirect (e.g. Snippe card checkout).
 */
export function SessionRefresher() {
  const lastRefresh = useRef<number>(0);
  // Throttle to 30 min for focus events; always runs on first mount (lastRefresh = 0)
  const MIN_INTERVAL_MS = 30 * 60 * 1000;

  const refresh = () => {
    const now = Date.now();
    if (now - lastRefresh.current < MIN_INTERVAL_MS) return;
    lastRefresh.current = now;
    refreshSessionCookie();
  };

  useEffect(() => {
    const auth = getAuthClient();

    // Always refresh on mount/navigation (lastRefresh starts at 0 on every mount)
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) refresh();
    });

    // Also refresh when the tab regains focus (catches return from Snippe checkout)
    const onFocus = () => {
      if (auth.currentUser) refresh();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
