"use client";

import { auth } from "@/lib/firebase/auth";

/**
 * Returns headers with the current user's ID token for authenticated API calls.
 * Use with fetch: fetch(url, { headers: await getAuthHeaders() })
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
