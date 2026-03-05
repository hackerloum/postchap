import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { resolveStudioContext, hasClientAccess } from "@/lib/studio/auth";
import { clientsRef, getClient } from "@/lib/studio/db";
import crypto from "crypto";

type Params = { params: Promise<{ clientId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { clientId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (!hasClientAccess(member, clientId)) {
    return NextResponse.json({ error: "Access denied to this client" }, { status: 403 });
  }

  try {
    const client = await getClient(agency.id, clientId);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json({ client });
  } catch (err) {
    console.error("[studio/clients/[clientId] GET]", err);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { clientId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (!["owner", "manager"].includes(member.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const allowed = [
    "clientName", "contactPerson", "contactEmail", "contactPhone",
    "industry", "location", "businessType", "contractStartDate", "contractEndDate",
    "status", "assignedDesignerId", "monthlyQuota", "portalAccessEnabled",
    "tags", "notes", "occasions", "socialHandles",
  ];

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  // Generate portal token if enabling portal access for the first time
  if (body.portalAccessEnabled === true) {
    const client = await getClient(agency.id, clientId);
    if (!client?.portalToken) {
      updates.portalToken = crypto.randomBytes(32).toString("hex");
    }
  }

  try {
    await clientsRef(agency.id).doc(clientId).update(updates);
    // When portal was enabled (token may have been generated), return updated client so the edit page can show the link without redirect
    if (body.portalAccessEnabled === true || updates.portalToken) {
      const updated = await getClient(agency.id, clientId);
      return NextResponse.json({ success: true, client: updated });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[studio/clients/[clientId] PATCH]", err);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { clientId } = await params;

  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;

  if (!["owner", "manager"].includes(member.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    // Soft-delete: archive rather than delete
    await clientsRef(agency.id).doc(clientId).update({
      status: "archived",
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[studio/clients/[clientId] DELETE]", err);
    return NextResponse.json({ error: "Failed to archive client" }, { status: 500 });
  }
}
