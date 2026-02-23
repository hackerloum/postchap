import { v2 as cloudinary } from "cloudinary";

let configured: typeof cloudinary | null = null;

function getCloudinary(): typeof cloudinary {
  if (configured) return configured;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  console.log("[Cloudinary] Config check:", {
    cloudName: cloudName ? `SET (${cloudName})` : "MISSING",
    apiKey: apiKey ? "SET" : "MISSING",
    apiSecret: apiSecret ? "SET" : "MISSING",
  });

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      `Cloudinary env vars missing: ` +
        `CLOUD_NAME=${!!cloudName} ` +
        `API_KEY=${!!apiKey} ` +
        `API_SECRET=${!!apiSecret}`
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = cloudinary;
  return cloudinary;
}

export default getCloudinary;
