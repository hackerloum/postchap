"use client";

import { useState, useEffect, useCallback } from "react";
import { getUserBrandKits, getBrandKit } from "@/lib/firebase/brandKits";
import type { BrandKit } from "@/types";

export function useBrandKits(userId: string | null) {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setBrandKits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getUserBrandKits(userId);
      setBrandKits(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setBrandKits([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { brandKits, loading, error, refetch };
}

export function useBrandKit(userId: string | null, brandKitId: string | null) {
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !brandKitId) {
      setBrandKit(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getBrandKit(userId, brandKitId)
      .then(setBrandKit)
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setBrandKit(null);
      })
      .finally(() => setLoading(false));
  }, [userId, brandKitId]);

  return { brandKit, loading, error };
}
