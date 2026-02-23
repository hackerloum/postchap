// SERVER ONLY — never import this in client components

import getCloudinary from "@/lib/cloudinary";

/** Upload a Buffer (poster after sharp compositing) */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId: string
): Promise<string> {
  const cloudinary = getCloudinary();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: "image",
          format: "png",
          transformation: [
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            console.error("[Cloudinary] Upload error:", error);
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else if (!result?.secure_url) {
            reject(new Error("Cloudinary: No URL returned"));
          } else {
            console.log("[Cloudinary] Uploaded:", result.secure_url);
            resolve(result.secure_url);
          }
        }
      )
      .end(buffer);
  });
}

/** Upload a logo File (from onboarding wizard) */
export async function uploadLogoToCloudinary(
  fileBuffer: Buffer,
  uid: string
): Promise<string> {
  const cloudinary = getCloudinary();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `artmaster/logos/${uid}`,
          public_id: `logo_${Date.now()}`,
          resource_type: "image",
          transformation: [
            { width: 400, height: 400, crop: "limit" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(new Error(error.message));
          else if (!result?.secure_url) reject(new Error("No URL"));
          else resolve(result.secure_url);
        }
      )
      .end(fileBuffer);
  });
}
