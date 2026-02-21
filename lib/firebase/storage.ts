import { adminStorage } from "./admin";

function bucket() {
  const name = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  return name ? adminStorage.bucket(name) : adminStorage.bucket();
}

export async function uploadPosterImage(
  userId: string,
  posterId: string,
  buffer: Buffer
): Promise<string> {
  const path = `posters/${userId}/${posterId}.png`;
  const file = bucket().file(path);
  await file.save(buffer, {
    contentType: "image/png",
    metadata: { cacheControl: "public, max-age=31536000" },
  });
  await file.makePublic();
  const bucketName = file.bucket.name;
  const encoded = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media`;
}

export async function uploadLogoImage(
  userId: string,
  brandKitId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const ext = mimeType.split("/")[1] || "bin";
  const path = `logos/${userId}/${brandKitId}.${ext}`;
  const file = bucket().file(path);
  await file.save(buffer, {
    contentType: mimeType,
    metadata: { cacheControl: "public, max-age=31536000" },
  });
  await file.makePublic();
  const bucketName = file.bucket.name;
  const encoded = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media`;
}

export async function deleteFile(filePath: string): Promise<void> {
  const file = bucket().file(filePath);
  await file.delete();
}
