import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";

async function getUid(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

function formatPriceLabel(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style:    "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString()}`;
  }
}

/**
 * GET /api/brand-kits/[id]/products/[productId]
 * Return a single product.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  let uid: string;
  try { uid = await getUid(request); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { id: kitId, productId } = params;
  if (!kitId || !productId) return NextResponse.json({ error: "IDs required" }, { status: 400 });

  try {
    const db = getAdminDb();
    const docRef = db.collection("users").doc(uid).collection("brand_kits").doc(kitId)
      .collection("products").doc(productId);
    const snap = await docRef.get();
    if (!snap.exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const d = snap.data()!;
    const createdAt = (d.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? null;
    const updatedAt = (d.updatedAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? null;

    return NextResponse.json({
      id: snap.id, ...d, createdAt, updatedAt,
    });
  } catch (error) {
    console.error("[product GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/brand-kits/[id]/products/[productId]
 * Update a product.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  let uid: string;
  try { uid = await getUid(request); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { id: kitId, productId } = params;
  if (!kitId || !productId) return NextResponse.json({ error: "IDs required" }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  try {
    const db = getAdminDb();
    const docRef = db.collection("users").doc(uid).collection("brand_kits").doc(kitId)
      .collection("products").doc(productId);
    const snap = await docRef.get();
    if (!snap.exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const existing = snap.data()!;
    const allowed = ["name", "description", "price", "currency", "discountPrice", "category", "images", "inStock", "tags"];
    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    // Reformat price labels if price/currency/discountPrice changed
    const price    = (updates.price    ?? existing.price)    as number;
    const currency = (updates.currency ?? existing.currency) as string;
    updates.priceLabel = formatPriceLabel(price, currency);

    const discountPrice = updates.discountPrice !== undefined
      ? (updates.discountPrice as number | null)
      : (existing.discountPrice as number | undefined) ?? null;
    updates.discountPriceLabel = discountPrice != null ? formatPriceLabel(discountPrice, currency) : null;

    await docRef.update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[product PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brand-kits/[id]/products/[productId]
 * Delete a product.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  let uid: string;
  try { uid = await getUid(request); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { id: kitId, productId } = params;
  if (!kitId || !productId) return NextResponse.json({ error: "IDs required" }, { status: 400 });

  try {
    const db = getAdminDb();
    const docRef = db.collection("users").doc(uid).collection("brand_kits").doc(kitId)
      .collection("products").doc(productId);
    const snap = await docRef.get();
    if (!snap.exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[product DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
