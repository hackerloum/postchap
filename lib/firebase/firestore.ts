import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  collectionGroup,
  addDoc,
  serverTimestamp,
} from "firebase-admin/firestore";
import type { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import type {
  BrandKit,
  PosterJob,
  Poster,
  PosterActivity,
  ActivityAction,
} from "@/types";

const USERS = "users";
const BRAND_KITS = "brand_kits";
const POSTER_JOBS = "poster_jobs";
const POSTERS = "posters";
const POSTER_ACTIVITY = "poster_activity";

// ——— BRAND KITS ———
export async function getBrandKits(userId: string): Promise<BrandKit[]> {
  const snap = await getDocs(
    collection(adminDb, USERS, userId, BRAND_KITS)
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BrandKit));
}

export async function getBrandKit(
  userId: string,
  brandKitId: string
): Promise<BrandKit | null> {
  const ref = doc(adminDb, USERS, userId, BRAND_KITS, brandKitId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BrandKit;
}

export async function createBrandKit(
  userId: string,
  data: Omit<BrandKit, "id" | "createdAt" | "updatedAt">
): Promise<BrandKit> {
  const ref = doc(collection(adminDb, USERS, userId, BRAND_KITS));
  const now = serverTimestamp() as Timestamp;
  const payload = {
    ...data,
    id: ref.id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, payload);
  return { ...payload, createdAt: now, updatedAt: now } as BrandKit;
}

export async function updateBrandKit(
  userId: string,
  brandKitId: string,
  data: Partial<BrandKit>
): Promise<void> {
  const ref = doc(adminDb, USERS, userId, BRAND_KITS, brandKitId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteBrandKit(
  userId: string,
  brandKitId: string
): Promise<void> {
  const ref = doc(adminDb, USERS, userId, BRAND_KITS, brandKitId);
  await deleteDoc(ref);
}

// ——— POSTER JOBS ———
export async function getPosterJobs(userId: string): Promise<PosterJob[]> {
  const snap = await getDocs(
    collection(adminDb, USERS, userId, POSTER_JOBS)
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PosterJob));
}

export async function getPosterJob(
  userId: string,
  jobId: string
): Promise<PosterJob | null> {
  const ref = doc(adminDb, USERS, userId, POSTER_JOBS, jobId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as PosterJob;
}

export async function getEnabledPosterJobs(): Promise<
  (PosterJob & { userId: string })[]
> {
  const group = collectionGroup(adminDb, POSTER_JOBS);
  const q = query(group, where("enabled", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const userId = d.ref?.parent?.parent?.id ?? "";
    return { userId, id: d.id, ...d.data() } as PosterJob & { userId: string };
  });
}

export async function createPosterJob(
  userId: string,
  data: Omit<PosterJob, "id" | "createdAt">
): Promise<PosterJob> {
  const ref = doc(collection(adminDb, USERS, userId, POSTER_JOBS));
  const now = serverTimestamp() as Timestamp;
  const payload = { ...data, id: ref.id, createdAt: now };
  await setDoc(ref, payload);
  return { ...payload, createdAt: now } as PosterJob;
}

export async function updatePosterJob(
  userId: string,
  jobId: string,
  data: Partial<PosterJob>
): Promise<void> {
  const ref = doc(adminDb, USERS, userId, POSTER_JOBS, jobId);
  await updateDoc(ref, data);
}

// ——— POSTERS ———
export async function getPosters(
  userId: string,
  brandKitId?: string
): Promise<Poster[]> {
  const ref = collection(adminDb, USERS, userId, POSTERS);
  const q = brandKitId
    ? query(ref, where("brandKitId", "==", brandKitId))
    : query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const posters = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Poster));
  if (brandKitId) {
    const toMs = (t: unknown) =>
      t && typeof t === "object" && "toMillis" in t && typeof (t as { toMillis: () => number }).toMillis === "function"
        ? (t as { toMillis: () => number }).toMillis()
        : 0;
    posters.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  }
  return posters;
}

export async function getPoster(
  userId: string,
  posterId: string
): Promise<Poster | null> {
  const ref = doc(adminDb, USERS, userId, POSTERS, posterId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Poster;
}

export async function getPosterByDate(
  userId: string,
  brandKitId: string,
  date: string,
  version: number
): Promise<Poster | null> {
  const ref = collection(adminDb, USERS, userId, POSTERS);
  const q = query(
    ref,
    where("brandKitId", "==", brandKitId),
    where("createdForDate", "==", date),
    where("version", "==", version)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Poster;
}

export async function createPoster(
  userId: string,
  data: Omit<Poster, "id" | "createdAt" | "updatedAt">
): Promise<Poster> {
  const ref = doc(collection(adminDb, USERS, userId, POSTERS));
  const now = serverTimestamp() as Timestamp;
  const payload = {
    ...data,
    id: ref.id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, payload);
  return { ...payload, createdAt: now, updatedAt: now } as Poster;
}

export async function updatePoster(
  userId: string,
  posterId: string,
  data: Partial<Poster>
): Promise<void> {
  const ref = doc(adminDb, USERS, userId, POSTERS, posterId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function approvePoster(
  userId: string,
  posterId: string
): Promise<void> {
  const ref = doc(adminDb, USERS, userId, POSTERS, posterId);
  await updateDoc(ref, { status: "approved", updatedAt: serverTimestamp() });
}

// ——— ACTIVITY ———
export async function logActivity(
  userId: string,
  posterId: string,
  action: ActivityAction,
  meta?: Record<string, unknown>
): Promise<void> {
  const ref = collection(adminDb, USERS, userId, POSTER_ACTIVITY);
  await addDoc(ref, {
    userId,
    posterId,
    action,
    meta: meta ?? {},
    createdAt: serverTimestamp(),
  });
}

export async function getActivity(
  userId: string,
  limitCount: number = 50
): Promise<PosterActivity[]> {
  const ref = collection(adminDb, USERS, userId, POSTER_ACTIVITY);
  const q = query(ref, orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PosterActivity));
}

export async function getPosterActivity(
  userId: string,
  posterId: string
): Promise<PosterActivity[]> {
  const ref = collection(adminDb, USERS, userId, POSTER_ACTIVITY);
  const q = query(
    ref,
    where("posterId", "==", posterId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PosterActivity));
}
