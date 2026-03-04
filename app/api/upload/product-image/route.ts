import { NextRequest, NextResponse } from "next/server";
import { uploadProductImageToCloudinary } from "@/lib/uploadToCloudinary";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";

async function getUid(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

/**
 * POST /api/upload/product-image
 * Upload a product photo to Cloudinary.
 * Form fields: file (required), productId (required)
 * Returns: { success: true, url }
 */
export async function POST(request: NextRequest) {
  let uid: string;
  try { uid = await getUid(request); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = (formData.get("productId") as string | null) ?? `prod_${Date.now()}`;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Must be an image" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Max 10MB" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadProductImageToCloudinary(buffer, uid, productId);
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("[upload/product-image]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
