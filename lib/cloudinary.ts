import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Log what we have (safe — only shows if vars exist, not values)
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

export default cloudinary;
