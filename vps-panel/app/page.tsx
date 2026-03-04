"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Vps = {
  id: string;
  hostname: string;
  ip: string;
  status: string;
  vm_status?: string;
  ram: string;
  disk: string;
  cpu: string;
  price: string;
  expiration: string;
};

export default function Home() {
  const [data, setData] = useState<{ status: number; result: Vps[] | string } | null>(null);
  const [balance, setBalance] = useState<{ status: number; result: { balance?: number } | string } | null>(null);

  useEffect(() => {
    fetch("/api/evps/vps")
      .then((r) => r.json())
      .then(setData);
    fetch("/api/evps/balance")
      .then((r) => r.json())
      .then(setBalance);
  }, []);

  if (data === null) return <div className="p-8">Loading…</div>;
  if (data.status === 0) {
    return (
      <div className="p-8 max-w-lg">
        <h1 className="text-xl font-semibold mb-2">VPS Panel</h1>
        <p className="text-red-400">API error: {String(data.result)}</p>
        <p className="mt-2 text-zinc-400 text-sm">
          Set EVPS_API_USER and EVPS_API_KEY in .env.local
        </p>
      </div>
    );
  }

  const list = (data.result as Vps[]) ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">VPS Panel</h1>
        {balance?.status === 1 && typeof balance.result === "object" && "balance" in balance.result && (
          <span className="text-zinc-400">Balance: €{Number(balance.result.balance).toFixed(2)}</span>
        )}
      </div>
      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="text-zinc-400">No VPS found.</p>
        ) : (
          list.map((v) => (
            <Link
              key={v.id}
              href={`/vps/${v.id}`}
              className="block p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-zinc-500 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium">{v.hostname || `VPS ${v.id}`}</span>
                  <span className="text-zinc-400 ml-2">{v.ip}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={v.status === "ok" ? "text-green-400" : "text-amber-400"}>
                    {v.status}
                  </span>
                  <span className="text-zinc-500">{v.cpu} CPU · {v.ram} GB RAM · {v.disk} GB</span>
                  <span className="text-zinc-500">€{v.price}/mo</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
