import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

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

/** eVPS returns all numeric fields as strings — parse safely */
function n(v: unknown): number {
  if (v == null) return 0;
  const f = parseFloat(String(v));
  return Number.isFinite(f) ? f : 0;
}

function str(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v);
}

function normalizeEvpsToPayload(raw: EvpsVpsInfo): VpsInfoPayload {
  const ramGb = n(raw.ram);
  const diskGb = n(raw.disk);

  // ram_usage is in bytes (per docs)
  const ramUsageBytes = n(raw.ram_usage);
  const ramPercent =
    ramGb > 0 && raw.ram_usage != null
      ? Math.min(100, (ramUsageBytes / (ramGb * 1024 * 1024 * 1024)) * 100)
      : null;

  // cpu_usage is a percentage 0–100 (per docs: "CPU usage")
  const cpuPercent = raw.cpu_usage != null ? Math.min(100, n(raw.cpu_usage)) : null;

  // disk_usage: docs don't specify units; if it's bytes use same conversion as RAM
  // If the text field is provided (e.g. "47.2 GB") we surface that directly
  const diskUsageRaw = n(raw.disk_usage);
  // Heuristic: if value > 1000 assume bytes, else assume GB
  const diskUsedGb =
    raw.disk_usage != null
      ? diskUsageRaw > 1000
        ? diskUsageRaw / (1024 * 1024 * 1024)
        : diskUsageRaw
      : 0;
  const diskPercent =
    diskGb > 0 && raw.disk_usage != null
      ? Math.min(100, (diskUsedGb / diskGb) * 100)
      : null;

  const bandwidthTb = n(raw.bandwidth);
  const bandwidthUsageTb =
    raw.bandwidth_usage != null ? n(raw.bandwidth_usage) : null;

  // Build a RAM used text if api didn't provide it
  const ramUsedText =
    str(raw.ram_usage_text) ??
    (ramGb > 0 && raw.ram_usage != null
      ? `${(ramUsageBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : null);

  // Build disk used text if api didn't provide it
  const diskUsedText =
    str(raw.disk_usage_text) ??
    (diskGb > 0 && raw.disk_usage != null
      ? `${diskUsedGb.toFixed(1)} GB`
      : null);

  return {
    cpuPercent,
    cpuText: str(raw.cpu_usage_text) ?? (cpuPercent != null ? `${cpuPercent.toFixed(1)}%` : null),
    ramGb,
    ramUsedText,
    ramPercent,
    diskGb,
    diskUsedText,
    diskPercent,
    bandwidthTb,
    bandwidthUsageTb: bandwidthUsageTb !== null && !Number.isNaN(bandwidthUsageTb) ? bandwidthUsageTb : null,
    uptimeText: str(raw.uptime_text),
    ip: str(raw.ip),
    hostname: str(raw.hostname),
    status: str(raw.status),
    vmStatus: str(raw.vm_status),
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
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

  // eVPS API returns status as 1 (number) or "1" (string) — normalize both
  const isOk = (status: unknown) => status === 1 || status === "1";

  try {
    let raw: EvpsVpsInfo;

    if (vpsId) {
      const res = await fetch(`${EVPS_API_BASE}/vps/${vpsId}`, { headers });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[vps-info] eVPS HTTP error", res.status, text.slice(0, 200));
        return NextResponse.json({ error: "eVPS API error", details: `HTTP ${res.status}` });
      }
      const json = await res.json();
      if (!isOk(json.status) || !json.result) {
        console.error("[vps-info] eVPS bad response", JSON.stringify(json).slice(0, 300));
        return NextResponse.json({ error: "eVPS returned no data", raw: json.result });
      }
      raw = json.result as EvpsVpsInfo;
    } else {
      const res = await fetch(`${EVPS_API_BASE}/vps/`, { headers });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[vps-info] eVPS list HTTP error", res.status, text.slice(0, 200));
        return NextResponse.json({ error: "eVPS API error", details: `HTTP ${res.status}` });
      }
      const json = await res.json();
      if (!isOk(json.status) || !Array.isArray(json.result) || json.result.length === 0) {
        console.error("[vps-info] eVPS list bad response", JSON.stringify(json).slice(0, 300));
        return NextResponse.json({ error: "No VPS found" });
      }
      const first = json.result[0] as EvpsVpsInfo;
      const detailRes = await fetch(`${EVPS_API_BASE}/vps/${first.id}`, { headers });
      if (!detailRes.ok) {
        raw = first;
      } else {
        const detailJson = await detailRes.json();
        raw = isOk(detailJson.status) && detailJson.result
          ? (detailJson.result as EvpsVpsInfo)
          : first;
      }
    }

    const payload = normalizeEvpsToPayload(raw);
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[vps-info] fetch error:", message);
    return NextResponse.json({ error: "Failed to fetch VPS info", details: message });
  }
}
