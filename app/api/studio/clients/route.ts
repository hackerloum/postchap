import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { resolveStudioContext } from "@/lib/studio/auth";
import { clientsRef } from "@/lib/studio/db";
import { checkClientLimit } from "@/lib/studio/auth";

export async function GET(request: NextRequest) {
  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency } = ctx;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;

  try {
    // Avoid composite index: don't combine orderBy + where. Filter in-memory if needed.
    let query: FirebaseFirestore.Query = clientsRef(agency.id);
    if (status) {
      query = query.where("status", "==", status);
    } else {
      query = query.orderBy("createdAt", "desc");
    }

    const snap = await query.get();
    let clients = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        clientName: data.clientName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        industry: data.industry,
        location: data.location,
        status: data.status,
        assignedDesignerId: data.assignedDesignerId,
        monthlyQuota: data.monthlyQuota,
        postersThisMonth: data.postersThisMonth ?? 0,
        portalAccessEnabled: data.portalAccessEnabled ?? false,
        tags: data.tags ?? [],
        notes: data.notes,
        createdAt: data.createdAt?.toMillis?.() ?? null,
        updatedAt: data.updatedAt?.toMillis?.() ?? null,
      };
    });

    if (status) {
      clients.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }

    return NextResponse.json({ clients });
  } catch (err) {
    console.error("[studio/clients GET]", err);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (!["owner", "manager"].includes(member.role)) {
    return NextResponse.json({ error: "Insufficient permissions to create clients" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.clientName) {
    return NextResponse.json({ error: "clientName is required" }, { status: 400 });
  }

  // Check client limit (trial = 0 clients)
  const countSnap = await clientsRef(agency.id).count().get();
  const currentCount = countSnap.data().count;
  if (!checkClientLimit(agency, currentCount)) {
    const message =
      agency.plan === "trial"
        ? "Trial plan is view-only. Upgrade to a paid Studio plan to add clients and generate posters."
        : `Client limit reached for your ${agency.plan} plan. Upgrade to add more clients.`;
    return NextResponse.json(
      { error: message, code: "CLIENT_LIMIT_REACHED" },
      { status: 403 }
    );
  }

  try {
    const docRef = await clientsRef(agency.id).add({
      agencyId: agency.id,
      clientName: body.clientName,
      contactPerson: body.contactPerson ?? "",
      contactEmail: body.contactEmail ?? "",
      contactPhone: body.contactPhone ?? "",
      industry: body.industry ?? "",
      location: body.location ?? "",
      businessType: body.businessType ?? "",
      contractStartDate: body.contractStartDate ?? "",
      contractEndDate: body.contractEndDate ?? "",
      status: body.status ?? "active",
      assignedDesignerId: body.assignedDesignerId ?? "",
      monthlyQuota: body.monthlyQuota ?? 30,
      postersThisMonth: 0,
      portalAccessEnabled: false,
      portalToken: null,
      tags: body.tags ?? [],
      notes: body.notes ?? "",
      occasions: [],
      socialHandles: body.socialHandles ?? {},
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, clientId: docRef.id }, { status: 201 });
  } catch (err) {
    console.error("[studio/clients POST]", err);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
