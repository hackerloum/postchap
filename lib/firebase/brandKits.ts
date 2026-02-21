"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./client";
import type { BrandKit } from "@/types";

const BRAND_KITS = "brand_kits";

export async function getUserBrandKits(userId: string): Promise<BrandKit[]> {
  const ref = collection(db, "users", userId, BRAND_KITS);
  const q = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BrandKit));
}

export async function getBrandKit(
  userId: string,
  brandKitId: string
): Promise<BrandKit | null> {
  const ref = doc(db, "users", userId, BRAND_KITS, brandKitId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BrandKit;
}

export async function createBrandKit(
  userId: string,
  data: Omit<BrandKit, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = collection(db, "users", userId, BRAND_KITS);
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBrandKit(
  userId: string,
  brandKitId: string,
  data: Partial<BrandKit>
): Promise<void> {
  const ref = doc(db, "users", userId, BRAND_KITS, brandKitId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteBrandKit(
  userId: string,
  brandKitId: string
): Promise<void> {
  const ref = doc(db, "users", userId, BRAND_KITS, brandKitId);
  await deleteDoc(ref);
}
