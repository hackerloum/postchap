import { ref, set, remove } from "firebase-admin/database";
import { adminRtdb } from "./admin";
import type { GenerationStatusUpdate } from "@/types";

const ROOT = "generation_status";

export async function setGenerationStatus(
  userId: string,
  posterId: string,
  update: GenerationStatusUpdate
): Promise<void> {
  const r = ref(adminRtdb, `${ROOT}/${userId}/${posterId}`);
  await set(r, update);
}

export async function clearGenerationStatus(
  userId: string,
  posterId: string
): Promise<void> {
  const r = ref(adminRtdb, `${ROOT}/${userId}/${posterId}`);
  await remove(r);
}
