"use client";

import { useEffect, useRef } from "react";
import { getAuthClient } from "@/lib/firebase/client";
import { refreshSessionCookie } from "@/lib/auth-client";

/**
 * Keeps the __session cookie valid so that after the user stays on the dashboard
 * and refreshes the page, server components still get a valid token (Firebase
 * ID tokens expire after ~1 hour). Runs when the user is signed in and on window focus.
 */
export function SessionRefresher() {
  const lastRefresh = useRef<number>(0);
  const MIN_INTERVAL_MS = 50 * 60 * 1000; // 50 minutes

  const refresh = () => {
    const now = Date.now();
    if (now - lastRefresh.current < MIN_INTERVAL_MS) return;
    lastRefresh.current = now;
    refreshSessionCookie();
  };

  useEffect(() => {
    const auth = getAuthClient();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) refresh();
    });

    const onFocus = () => {
      if (auth.currentUser) refresh();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}
