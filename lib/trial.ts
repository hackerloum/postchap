/**
 * Trial state for new users: 1 free Seedream post, 7-day window.
 * Legacy users (no trialStartedAt) keep existing free/paid behavior.
 */

import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { getUserPlan } from "@/lib/user-plan";

const TRIAL_DAYS = 7;
const TRIAL_POSTS = 1;

export interface TrialState {
  active: boolean;
  postsRemaining: 0 | 1;
  endsAt: number | null;
  modelLockedToSeedream: boolean;
  trialCompleted: boolean;
}

function toMillis(
  v: { toMillis?: () => number } | number | undefined
): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof (v as { toMillis?: () => number }).toMillis === "function") {
    return (v as { toMillis: () => number }).toMillis();
  }
  return null;
}

/**
 * Server-only: compute trial state for the user.
 * Paid users get active: false, trialCompleted: false; legacy free (no trial) unchanged.
 */
export async function getTrialState(uid: string): Promise<TrialState> {
  const plan = await getUserPlan(uid);
  if (plan !== "free") {
    return {
      active: false,
      postsRemaining: 0,
      endsAt: null,
      modelLockedToSeedream: false,
      trialCompleted: false,
    };
  }

  const snap = await getAdminDb().collection("users").doc(uid).get();
  const data = snap.exists ? snap.data() : null;
  const trialStartedAt = toMillis(data?.trialStartedAt);
  const trialPostCount = typeof data?.trialPostCount === "number" ? data.trialPostCount : 0;

  // No trial for this user (legacy)
  if (trialStartedAt == null) {
    return {
      active: false,
      postsRemaining: 0,
      endsAt: null,
      modelLockedToSeedream: false,
      trialCompleted: false,
    };
  }

  const now = Date.now();
  const endMs = trialStartedAt + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const expired = now > endMs;
  const used = trialPostCount >= TRIAL_POSTS;
  const trialCompleted = expired || used;
  const active = !trialCompleted;
  const postsRemaining: 0 | 1 = active && trialPostCount < TRIAL_POSTS ? 1 : 0;
  const modelLockedToSeedream = active && postsRemaining > 0;

  return {
    active,
    postsRemaining,
    endsAt: endMs,
    modelLockedToSeedream,
    trialCompleted,
  };
}

/**
 * Server-only: set trial post count to 1 after first successful trial generation.
 */
export async function incrementTrialPostCount(uid: string): Promise<void> {
  const ref = getAdminDb().collection("users").doc(uid);
  await ref.update({
    trialPostCount: 1,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
