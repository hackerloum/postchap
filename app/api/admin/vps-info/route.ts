import { NextRequest, NextResponse } from "next/server";
import { verifySuperadminSession } from "@/lib/admin-auth";

const EVPS_API_BASE = "https://www.evps.net/api/v1";

/** eVPS single server response (GET /vps/{id}) */
type EvpsVpsInfo = {
  id: string;
  cpu: string;
  disk: string;
  ram: string;
  bandwidth: string;
  bandwidth_usage?: string;
  backups?: string;
  ip?: string;
  ipv6?: string;
  price?: string;
  hostname?: string;
  category?: string;
  status?: string;
  billing_term?: string;
  ram_usage?: number;
  ram_usage_text?: string;
  cpu_usage?: number;
  cpu_usage_text?: string;
  disk_usage?: number;
  disk_usage_text?: string;
  uptime?: number;
  uptime_text?: string;
  vm_status?: string;
  expiration?: number;
  [key: string]: unknown;
};

/** Normalized shape for the terminal right panel */
export type VpsInfoPayload = {
  cpuPercent: number | null;
  cpuText: string | null;
  ramGb: number;
  ramUsedText: string | null;
  ramPercent: number | null;
  diskGb: number;
  diskUsedText: string | null;
  diskPercent: number | null;
  bandwidthTb: number;
  bandwidthUsageTb: number | null;
  uptimeText: string | null;
  ip: string | null;
  hostname: string | null;
  status: string | null;
  vmStatus: string | null;
  label?: string | null;
};

function normalizeEvpsToPayload(raw: EvpsVpsInfo): VpsInfoPayload {
  const ramGb = parseFloat(raw.ram) || 0;
  const diskGb = parseFloat(raw.disk) || 0;
  const ramUsageBytes = typeof raw.ram_usage === "number" ? raw.ram_usage : 0;
  const ramPercent =
    ramGb > 0 && ramUsageBytes >= 0
      ? Math.min(100, (ramUsageBytes / (ramGb * 1e9)) * 100)
      : null;
  const cpuPercent =
    typeof raw.cpu_usage === "number" ? Math.min(100, raw.cpu_usage) : null;
  const diskUsage = typeof raw.disk_usage === "number" ? raw.disk_usage : 0;
  const diskPercent =
    diskGb > 0 && diskUsage >= 0
      ? Math.min(100, (diskUsage / (diskGb * 1e9)) * 100)
      : null;
  const bandwidthTb = parseFloat(raw.bandwidth) || 0;
  const bandwidthUsageTb = raw.bandwidth_usage != null ? parseFloat(String(raw.bandwidth_usage)) : null;

  return {
    cpuPercent,
    cpuText: raw.cpu_usage_text ?? null,
    ramGb,
    ramUsedText: raw.ram_usage_text ?? null,
    ramPercent,
    diskGb,
    diskUsedText: raw.disk_usage_text ?? null,
    diskPercent,
    bandwidthTb,
    bandwidthUsageTb: bandwidthUsageTb !== null && !Number.isNaN(bandwidthUsageTb) ? bandwidthUsageTb : null,
    uptimeText: raw.uptime_text ?? null,
    ip: raw.ip ?? null,
    hostname: raw.hostname ?? null,
    status: raw.status ?? null,
    vmStatus: raw.vm_status ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    await verifySuperadminSession(req);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiUser = process.env.EVPS_API_USER;
  const apiKey = process.env.EVPS_API_KEY;
  const vpsId = process.env.EVPS_VPS_ID;

  if (!apiUser || !apiKey) {
    return NextResponse.json(
      { error: "VPS API not configured" },
      { status: 503 }
    );
  }

  const headers: Record<string, string> = {
    Accept: "*/*",
    "Content-Type": "application/x-www-form-urlencoded",
    "X_API_USER": apiUser,
    "X_API_KEY": apiKey,
    "User-Agent": "ArtMaster-Admin/1.0",
  };

  try {
    let raw: EvpsVpsInfo;

    if (vpsId) {
      const res = await fetch(`${EVPS_API_BASE}/vps/${vpsId}`, { headers });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: "eVPS API error", details: text },
          { status: res.status === 401 ? 401 : 502 }
        );
      }
      const json = await res.json();
      if (json.status !== 1 || !json.result) {
        return NextResponse.json(
          { error: "eVPS returned no data", result: json.result },
          { status: 502 }
        );
      }
      raw = json.result as EvpsVpsInfo;
    } else {
      const res = await fetch(`${EVPS_API_BASE}/vps/`, { headers });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: "eVPS API error", details: text },
          { status: res.status === 401 ? 401 : 502 }
        );
      }
      const json = await res.json();
      if (json.status !== 1 || !Array.isArray(json.result) || json.result.length === 0) {
        return NextResponse.json(
          { error: "No VPS found" },
          { status: 404 }
        );
      }
      const first = json.result[0] as EvpsVpsInfo;
      const detailRes = await fetch(`${EVPS_API_BASE}/vps/${first.id}`, { headers });
      if (!detailRes.ok) {
        raw = first;
      } else {
        const detailJson = await detailRes.json();
        raw = detailJson.status === 1 && detailJson.result
          ? (detailJson.result as EvpsVpsInfo)
          : first;
      }
    }

    const payload = normalizeEvpsToPayload(raw);
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch VPS info", details: message },
      { status: 500 }
    );
  }
}
