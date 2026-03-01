"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search, ExternalLink } from "lucide-react";

interface KitRow {
  id: string;
  uid: string;
  brandName: string;
  industry: string;
  primaryColor: string;
  tone: string;
  createdAt: number | null;
}

export default function AdminBrandKitsPage() {
  const [kits, setKits] = useState<KitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/brand-kits", { credentials: "same-origin" })
      .then((r) => r.ok && r.json())
      .then((d) => d?.kits && setKits(d.kits))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? kits.filter(
        (k) =>
          k.brandName.toLowerCase().includes(search.toLowerCase()) ||
          k.industry.toLowerCase().includes(search.toLowerCase())
      )
    : kits;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">Brand Kits</h1>
        <p className="font-mono text-[12px] text-text-muted mt-1">
          {kits.length} kits across all users
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by brand or industry..."
          className="w-full bg-bg-surface border border-border-default rounded-lg pl-8 pr-3 py-2 text-[13px] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={18} className="text-accent animate-spin" />
        </div>
      ) : (
        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-4 py-3 font-mono text-[10px] text-text-muted uppercase tracking-widest">
                  Brand
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-text-muted uppercase tracking-widest hidden sm:table-cell">
                  Industry
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-text-muted uppercase tracking-widest hidden md:table-cell">
                  Tone
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-text-muted uppercase tracking-widest hidden md:table-cell">
                  Created
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center font-mono text-[12px] text-text-muted">
                    No brand kits found
                  </td>
                </tr>
              )}
              {filtered.map((kit) => (
                <tr key={`${kit.uid}-${kit.id}`} className="hover:bg-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg shrink-0 border border-border-subtle"
                        style={{ backgroundColor: kit.primaryColor || "#888" }}
                      />
                      <p className="font-medium text-[13px] text-text-primary">{kit.brandName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="font-mono text-[12px] text-text-muted">{kit.industry || "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-mono text-[12px] text-text-muted capitalize">{kit.tone || "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-mono text-[11px] text-text-muted">
                      {kit.createdAt
                        ? new Date(kit.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${kit.uid}`}
                      className="text-text-muted hover:text-text-primary transition-colors"
                      title="View user"
                    >
                      <ExternalLink size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
