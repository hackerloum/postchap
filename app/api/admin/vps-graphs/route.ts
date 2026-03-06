import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

const EVPS_API_BASE = "https://www.evps.net/api/v1";

export type VpsGraphsPayload = {
  cpu_img: string | null;
  mem_img: string | null;
  net_img: string | null;
  disk_img: string | null;
  error?: string;
};

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiUser = process.env.EVPS_API_USER;
  const apiKey = process.env.EVPS_API_KEY;
  const vpsId = process.env.EVPS_VPS_ID;

  if (!apiUser || !apiKey || !vpsId) {
    return NextResponse.json<VpsGraphsPayload>({
      cpu_img: null,
      mem_img: null,
      net_img: null,
      disk_img: null,
      error: "VPS API or VPS ID not configured",
    });
  }

  const headers: Record<string, string> = {
    Accept: "*/*",
    "X_API_USER": apiUser,
    "X_API_KEY": apiKey,
    "User-Agent": "ArtMaster-Admin/1.0",
  };

  try {
    // time can be: hour, day, week, month, year
    const time = req.nextUrl.searchParams.get("time") ?? "hour";
    const validTimes = ["hour", "day", "week", "month", "year"];
    const safeTime = validTimes.includes(time) ? time : "hour";

    const res = await fetch(
      `${EVPS_API_BASE}/vps/${vpsId}/graph/${safeTime}`,
      { headers }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[vps-graphs] HTTP error", res.status, text.slice(0, 200));
      return NextResponse.json<VpsGraphsPayload>({
        cpu_img: null,
        mem_img: null,
        net_img: null,
        disk_img: null,
        error: `HTTP ${res.status}`,
      });
    }

    const json = await res.json();
    const isOk = json.status === 1 || json.status === "1";
    if (!isOk || !json.result) {
      console.error("[vps-graphs] bad response", JSON.stringify(json).slice(0, 200));
      return NextResponse.json<VpsGraphsPayload>({
        cpu_img: null,
        mem_img: null,
        net_img: null,
        disk_img: null,
        error: "No graph data",
      });
    }

    const result = json.result as Record<string, string | null>;
    return NextResponse.json<VpsGraphsPayload>({
      cpu_img: result.cpu_img ?? null,
      mem_img: result.mem_img ?? null,
      net_img: result.net_img ?? null,
      disk_img: result.disk_img ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[vps-graphs] fetch error:", message);
    return NextResponse.json<VpsGraphsPayload>({
      cpu_img: null,
      mem_img: null,
      net_img: null,
      disk_img: null,
      error: message,
    });
  }
}
