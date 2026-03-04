"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type VpsDetail = {
  id: string;
  hostname: string;
  ip: string;
  status: string;
  vm_status?: string;
  ram: string;
  ram_usage_text?: string;
  disk: string;
  disk_usage_text?: string;
  cpu: string;
  cpu_usage_text?: string;
  uptime_text?: string;
  price: string;
  expiration: string;
};

type Backup = { file: string; size: string };

export default function VpsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [vps, setVps] = useState<{ status: number; result: VpsDetail | string } | null>(null);
  const [backups, setBackups] = useState<{ status: number; result: Backup[] | string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => {
    fetch(`/api/evps/vps/${id}`).then((r) => r.json()).then(setVps);
    fetch(`/api/evps/vps/${id}/backup`).then((r) => r.json()).then(setBackups);
  };

  useEffect(() => {
    load();
  }, [id]);

  const doAction = async (action: string) => {
    setLoading(action);
    setMessage(null);
    const res = await fetch(`/api/evps/vps/${id}/action?action=${action}`, { method: "POST" });
    const data = await res.json();
    setLoading(null);
    if (data.status === 1) {
      setMessage({ ok: true, text: `${action} requested` });
      setTimeout(load, 2000);
    } else {
      setMessage({ ok: false, text: String(data.result) });
    }
  };

  const createBackup = async () => {
    setLoading("backup");
    setMessage(null);
    const res = await fetch(`/api/evps/vps/${id}/backup`, { method: "POST" });
    const data = await res.json();
    setLoading(null);
    if (data.status === 1) {
      setMessage({ ok: true, text: "Backup started" });
      load();
    } else {
      setMessage({ ok: false, text: String(data.result) });
    }
  };

  const openVnc = async () => {
    const res = await fetch(`/api/evps/vps/${id}/vnc`);
    const data = await res.json();
    if (data.status === 1 && data.result?.vnc_url) window.open(data.result.vnc_url, "_blank");
    else setMessage({ ok: false, text: String(data.result ?? "No VNC URL") });
  };

  if (vps === null) return <div className="p-8">Loading…</div>;
  if (vps.status === 0) {
    return (
      <div className="p-8">
        <p className="text-red-400">{String(vps.result)}</p>
        <Link href="/" className="text-blue-400 mt-2 inline-block">← Back</Link>
      </div>
    );
  }

  const d = vps.result as VpsDetail;
  const list = backups?.status === 1 && Array.isArray(backups.result) ? backups.result : [];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/" className="text-zinc-400 hover:text-white mb-4 inline-block">← All VPS</Link>
      <h1 className="text-2xl font-semibold mb-2">{d.hostname || `VPS ${d.id}`}</h1>
      <p className="text-zinc-400 mb-4">{d.ip} · {d.status} {d.vm_status ? `· VM: ${d.vm_status}` : ""}</p>

      {message && (
        <p className={`mb-4 p-2 rounded text-sm ${message.ok ? "bg-green-900/30 text-green-300" : "bg-red-900/30 text-red-300"}`}>
          {message.text}
        </p>
      )}

      <div className="grid gap-4 mb-6">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <h2 className="font-medium mb-2">Resources</h2>
          <p className="text-sm text-zinc-400">
            CPU: {d.cpu} {d.cpu_usage_text ? `(${d.cpu_usage_text})` : ""} · RAM: {d.ram} GB {d.ram_usage_text ? `(${d.ram_usage_text})` : ""} · Disk: {d.disk} GB {d.disk_usage_text ? `(${d.disk_usage_text})` : ""}
          </p>
          {d.uptime_text && <p className="text-sm text-zinc-500 mt-1">Uptime: {d.uptime_text}</p>}
        </div>

        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <h2 className="font-medium mb-2">Power</h2>
          <div className="flex flex-wrap gap-2">
            {["start", "stop", "reboot", "shutdown"].map((a) => (
              <button
                key={a}
                onClick={() => doAction(a)}
                disabled={loading !== null}
                className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 capitalize"
              >
                {loading === a ? "…" : a}
              </button>
            ))}
            <button onClick={openVnc} className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500">VNC</button>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <h2 className="font-medium mb-2">Backups</h2>
          <button
            onClick={createBackup}
            disabled={loading === "backup"}
            className="mb-3 px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50"
          >
            {loading === "backup" ? "Creating…" : "Create backup"}
          </button>
          {list.length === 0 ? (
            <p className="text-zinc-500 text-sm">No backups</p>
          ) : (
            <ul className="text-sm space-y-1">
              {list.map((b) => (
                <li key={b.file} className="flex justify-between">
                  <span>{b.file}</span>
                  <span className="text-zinc-500">{b.size}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-zinc-500 text-sm">€{d.price}/mo · Renews: {d.expiration ? new Date(Number(d.expiration) * 1000).toLocaleDateString() : "—"}</p>
    </div>
  );
}
