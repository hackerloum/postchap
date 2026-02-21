"use client";

import { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
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

    const path = `generation_status/${userId}/${posterId}`;
    const r = ref(rtdb, path);

    const handler = (snap: { val: () => GenerationStatusUpdate | null }) => {
      setStatus(snap.val());
    };

    onValue(r, handler);
    return () => off(r);
  }, [userId, posterId]);

  return status;
}
