/**
 * eVPS.net API client (https://www.evps.net/api/doc/)
 * Auth: X_API_USER + X_API_KEY headers.
 */

const BASE = "https://www.evps.net/api/v1";

export type EvpsResponse<T> =
  | { status: 1; result: T }
  | { status: 0; result: string };

export type VpsListItem = {
  id: string;
  cpu: string;
  disk: string;
  ram: string;
  bandwidth: string;
  backups: string;
  bandwidth_usage: string;
  ip: string;
  ipv6: string;
  price: string;
  hostname: string;
  category: string;
  install_root?: string;
  status: string;
  expiration: string;
};

export type VpsDetail = VpsListItem & {
  billing_term?: string;
  ram_usage?: string;
  ram_usage_text?: string;
  cpu_usage?: string;
  cpu_usage_text?: string;
  disk_usage?: string;
  disk_usage_text?: string;
  uptime?: string;
  uptime_text?: string;
  vm_status?: string;
};

export type BackupItem = { file: string; size: string };

async function evpsFetch<T>(
  path: string,
  opts: { method?: string; body?: Record<string, unknown> } = {}
): Promise<EvpsResponse<T>> {
  const { method = "GET", body } = opts;
  const apiUser = process.env.EVPS_API_USER;
  const apiKey = process.env.EVPS_API_KEY;
  if (!apiUser || !apiKey) {
    return { status: 0, result: "EVPS_API_USER and EVPS_API_KEY must be set" };
  }
  const url = path.startsWith("http") ? path : `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    "X_API_USER": apiUser,
    "X_API_KEY": apiKey,
    "Accept": "application/json",
  };
  const init: RequestInit = { method, headers };
  if (body && method !== "GET") {
    init.body = new URLSearchParams(
      Object.fromEntries(
        Object.entries(body).filter(([, v]) => v !== undefined)
      ) as Record<string, string>
    ).toString();
  }
  const res = await fetch(url, init);
  const data = (await res.json()) as EvpsResponse<T>;
  return data;
}

export const evps = {
  listVps: () => evpsFetch<VpsListItem[]>("vps/"),
  getVps: (id: string) => evpsFetch<VpsDetail>(`vps/${id}`),
  start: (id: string) => evpsFetch<unknown>(`vps/${id}/action/start`, { method: "POST" }),
  stop: (id: string) => evpsFetch<unknown>(`vps/${id}/action/stop`, { method: "POST" }),
  reboot: (id: string) => evpsFetch<unknown>(`vps/${id}/action/reboot`, { method: "POST" }),
  shutdown: (id: string) => evpsFetch<unknown>(`vps/${id}/action/shutdown`, { method: "POST" }),
  listBackups: (id: string) => evpsFetch<BackupItem[]>(`vps/${id}/backup`),
  createBackup: (id: string) => evpsFetch<unknown>(`vps/${id}/backup`, { method: "POST" }),
  restoreBackup: (id: string, file: string) =>
    evpsFetch<unknown>(`vps/${id}/restore/${encodeURIComponent(file)}`, { method: "POST" }),
  deleteBackup: (id: string, file: string) =>
    evpsFetch<unknown>(`vps/${id}/backup/${encodeURIComponent(file)}`, { method: "DELETE" }),
  vnc: (id: string) => evpsFetch<{ vnc_url: string }>(`vps/${id}/vnc`),
  balance: () => evpsFetch<{ balance: number }>("balance"),
};
