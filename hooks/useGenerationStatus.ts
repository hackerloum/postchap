"use client";

import { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { getRtdb } from "@/lib/firebase/client";
import type { GenerationStatusUpdate } from "@/types";

export function useGenerationStatus(
  userId: string,
  posterId: string | null
): GenerationStatusUpdate | null {
  const [status, setStatus] = useState<GenerationStatusUpdate | null>(null);

  useEffect(() => {
    if (!userId || !posterId) {
      setStatus(null);
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    getRtdb().then((rtdb) => {
      if (!mounted) return;
      const r = ref(rtdb, `generation_status/${userId}/${posterId}`);
      const handler = (snap: { val: () => GenerationStatusUpdate | null }) => {
        if (mounted) setStatus(snap.val());
      };
      onValue(r, handler);
      unsubscribe = () => off(r);
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [userId, posterId]);

  return status;
}
