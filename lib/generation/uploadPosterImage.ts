import { getAdminStorage } from "@/lib/firebase/admin";

export async function uploadPosterImage(
  userId: string,
  posterId: string,
  buffer: Buffer
): Promise<string> {
  const storage = getAdminStorage();
  const bucket = storage.bucket();
  const path = `posters/${userId}/${posterId}.png`;
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: { contentType: "image/png" },
  });

  const [signed] = await file.getSignedUrl({
    action: "read",
    expires: new Date("2500-01-01"),
  });
  return signed;
}
