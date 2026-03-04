import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestAuth } from "@/lib/firebase/verify-auth";

async function getUid(request: NextRequest): Promise<string> {
  const decoded = await verifyRequestAuth(request);
  return decoded.uid;
}

function productFromDoc(id: string, data: Record<string, unknown>) {
  const createdAt = (data.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? null;
  const updatedAt = (data.updatedAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? null;
  return {
    id,
    name:               (data.name           as string) ?? "",
    description:        (data.description    as string) ?? "",
    price:              (data.price          as number) ?? 0,
    currency:           (data.currency       as string) ?? "USD",
    priceLabel:         (data.priceLabel     as string) ?? "",
    discountPrice:      (data.discountPrice  as number | undefined),
    discountPriceLabel: (data.discountPriceLabel as string | undefined),
    category:           (data.category       as string) ?? "",
    images:             (data.images         as string[]) ?? [],
    inStock:            (data.inStock        as boolean) ?? true,
    tags:               (data.tags           as string[]) ?? [],
    createdAt,
    updatedAt,
  };
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
 * GET /api/brand-kits/[id]/products
 * List all products for a brand kit.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let uid: string;
  try { uid = await getUid(request); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { id: kitId } = params;
  if (!kitId) return NextResponse.json({ error: "Brand kit ID required" }, { status: 400 });

  try {
    const db = getAdminDb();
    const kitRef = db.collection("users").doc(uid).collection("brand_kits").doc(kitId);
    const kitSnap = await kitRef.get();
    if (!kitSnap.exists) return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });

    const snap = await kitRef.collection("products").orderBy("createdAt", "desc").get();
    const products = snap.docs.map(doc => productFromDoc(doc.id, doc.data()));
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[products GET]", error);
    return NextResponse.json(
      { error: "Failed to list products", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brand-kits/[id]/products
 * Create a new product.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let uid: string;
  try { uid = await getUid(request); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { id: kitId } = params;
  if (!kitId) return NextResponse.json({ error: "Brand kit ID required" }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  if (!body.name) return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  if (typeof body.price !== "number") return NextResponse.json({ error: "price must be a number" }, { status: 400 });

  try {
    const db = getAdminDb();
    const kitRef = db.collection("users").doc(uid).collection("brand_kits").doc(kitId);
    const kitSnap = await kitRef.get();
    if (!kitSnap.exists) return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });

    const kitData = kitSnap.data()!;
    const currency = (body.currency as string) || (kitData.brandLocation?.currency as string) || "USD";
    const price = body.price as number;
    const discountPrice = typeof body.discountPrice === "number" ? body.discountPrice : undefined;

    const productData = {
      name:               body.name              as string,
      description:        (body.description      as string) ?? "",
      price,
      currency,
      priceLabel:         formatPriceLabel(price, currency),
      discountPrice,
      discountPriceLabel: discountPrice != null ? formatPriceLabel(discountPrice, currency) : null,
      category:           (body.category         as string) ?? "",
      images:             (body.images           as string[]) ?? [],
      inStock:            body.inStock === false ? false : true,
      tags:               (body.tags             as string[]) ?? [],
      createdAt:          FieldValue.serverTimestamp(),
      updatedAt:          FieldValue.serverTimestamp(),
    };

    const ref = await kitRef.collection("products").add(productData);
    return NextResponse.json({ success: true, productId: ref.id }, { status: 201 });
  } catch (error) {
    console.error("[products POST]", error);
    return NextResponse.json(
      { error: "Failed to create product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
