"use server";

import { cookies } from "next/headers";
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
};

export async function getBrandKitsAction(clientToken?: string | null): Promise<BrandKitItem[]> {
  try {
    const token =
      clientToken && clientToken.trim()
        ? clientToken.trim()
        : (await cookies()).get("__session")?.value;
    if (!token) return [];

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;

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
        _createdAt: createdAt,
      };
    });
    withTime.sort((a, b) => b._createdAt - a._createdAt);
    return withTime.map(({ _createdAt, ...k }) => k);
  } catch {
    return [];
  }
}
