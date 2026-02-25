"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export type BrandKitItem = {
  id: string;
  brandName?: string;
  industry?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  brandLocation?: { country?: string };
  tone?: string;
  platforms?: string[];
};

async function getUidFromCookieOrToken(clientToken?: string | null): Promise<string | null> {
  try {
    const token =
      clientToken && clientToken.trim()
        ? clientToken.trim()
        : (await cookies()).get("__session")?.value;
    if (!token) return null;
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function getBrandKitsAction(clientToken?: string | null): Promise<BrandKitItem[]> {
  try {
    const uid = await getUidFromCookieOrToken(clientToken);
    if (!uid) return [];

    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .get();

    const withTime = snap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt?.toMillis?.() ?? 0;
      return {
        id: d.id,
        brandName: data.brandName,
        industry: data.industry,
        tagline: data.tagline,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        logoUrl: data.logoUrl,
        brandLocation: data.brandLocation,
        tone: data.tone,
        platforms: Array.isArray(data.platforms) ? data.platforms : undefined,
        _createdAt: createdAt,
      };
    });
    withTime.sort((a, b) => b._createdAt - a._createdAt);
    return withTime.map(({ _createdAt, ...k }) => k);
  } catch {
    return [];
  }
}

export async function deleteBrandKitAction(
  id: string,
  clientToken?: string | null
): Promise<{ success: boolean; error?: string }> {
  const uid = await getUidFromCookieOrToken(clientToken);
  if (!uid) return { success: false, error: "Unauthorized" };
  try {
    const ref = getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .doc(id);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, error: "Brand kit not found" };
    await ref.delete();
    revalidatePath("/dashboard/brand-kits");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete" };
  }
}

export async function duplicateBrandKitAction(
  id: string,
  clientToken?: string | null
): Promise<{ success: boolean; newId?: string; error?: string }> {
  const uid = await getUidFromCookieOrToken(clientToken);
  if (!uid) return { success: false, error: "Unauthorized" };
  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .doc(id)
      .get();
    if (!snap.exists) return { success: false, error: "Brand kit not found" };
    const data = snap.data()!;
    const { analysis, analyzedAt, createdAt, updatedAt, ...rest } = data;
    const newRef = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .add({
        ...rest,
        userId: uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    revalidatePath("/dashboard/brand-kits");
    revalidatePath("/dashboard");
    return { success: true, newId: newRef.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to duplicate" };
  }
}
