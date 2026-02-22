"use client";

import { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { rtdb } from "@/lib/firebase/rtdb.client";
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

    if (!rtdb) return;

    let mounted = true;
    const r = ref(rtdb, `generation_status/${userId}/${posterId}`);
    const handler = (snap: { val: () => GenerationStatusUpdate | null }) => {
      if (mounted) setStatus(snap.val());
    };
    onValue(r, handler);

    return () => {
      mounted = false;
      off(r);
    };
  }, [userId, posterId]);

  return status;
}
