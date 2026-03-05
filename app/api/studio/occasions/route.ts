import { NextRequest, NextResponse } from "next/server";
import { resolveStudioContext, hasClientAccess } from "@/lib/studio/auth";
import { getClient, listClients } from "@/lib/studio/db";
import { getUpcomingOccasions } from "@/lib/occasions/upcoming";
import type { StudioClientOccasion } from "@/types/studio";

interface ClientOccasionAlert {
  clientId: string;
  clientName: string;
  type: "global" | "client-specific";
  title: string;
  daysUntil: number;
  date: string;
}

/**
 * GET /api/studio/occasions?clientId=...&days=14
 * Returns upcoming occasions for one or all clients.
 */
export async function GET(request: NextRequest) {
  let ctx;
  try {
    ctx = await resolveStudioContext(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agency, member } = ctx;
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const daysAhead = parseInt(searchParams.get("days") ?? "14");

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clientsToCheck = clientId
      ? [await getClient(agency.id, clientId)].filter(Boolean)
      : await listClients(agency.id, { status: "active" });

    const alerts: ClientOccasionAlert[] = [];

    for (const client of clientsToCheck) {
      if (!client) continue;

      if (clientId && !hasClientAccess(member, client.id)) continue;

      const countryCode = client.location?.split(",")[0]?.trim() ?? undefined;
      const globalOccasions = getUpcomingOccasions(countryCode, 10);

      for (const occ of globalOccasions) {
        if (occ.daysUntil <= daysAhead) {
          alerts.push({
            clientId: client.id,
            clientName: client.clientName,
            type: "global",
            title: occ.name,
            daysUntil: occ.daysUntil,
            date: occ.date,
          });
        }
      }

      // Client-specific occasions
      const clientOccasions: StudioClientOccasion[] = (client as any).occasions ?? [];
      for (const occ of clientOccasions) {
        let occDate: Date;

        if (occ.type === "recurring" && occ.date.length === 5) {
          const year = today.getFullYear();
          occDate = new Date(`${year}-${occ.date}T00:00:00`);
          if (occDate < today) {
            occDate = new Date(`${year + 1}-${occ.date}T00:00:00`);
          }
        } else {
          occDate = new Date(`${occ.date}T00:00:00`);
        }

        const daysUntil = Math.ceil((occDate.getTime() - today.getTime()) / 86_400_000);
        if (daysUntil >= 0 && daysUntil <= daysAhead) {
          alerts.push({
            clientId: client.id,
            clientName: client.clientName,
            type: "client-specific",
            title: occ.title,
            daysUntil,
            date: occDate.toISOString().slice(0, 10),
          });
        }
      }
    }

    alerts.sort((a, b) => a.daysUntil - b.daysUntil);

    return NextResponse.json({ alerts });
  } catch (err) {
    console.error("[studio/occasions GET]", err);
    return NextResponse.json({ error: "Failed to fetch occasions" }, { status: 500 });
  }
}
