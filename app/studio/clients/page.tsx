"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus, Search, Filter, MoreHorizontal, Archive, Edit3, Sparkles } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";

interface Client {
  id: string;
  clientName: string;
  contactEmail?: string;
  industry?: string;
  location?: string;
  status: string;
  postersThisMonth: number;
  monthlyQuota: number;
  tags: string[];
  createdAt: number | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  async function loadClients() {
    setLoading(true);
    try {
      const token = await getClientIdToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/studio/clients${params}`, { headers });
      if (res.ok) {
        const d = await res.json();
        setClients(d.clients ?? []);
      }
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { loadClients(); }, [statusFilter]);

  async function archiveClient(clientId: string) {
    const token = await getClientIdToken();
    await fetch(`/api/studio/clients/${clientId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status: "archived" }),
    });
    loadClients();
    setMenuOpen(null);
  }

  const filtered = clients.filter((c) =>
    c.clientName.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-semibold text-[24px] text-text-primary tracking-tight">Clients</h1>
          <p className="font-mono text-[13px] text-text-muted mt-1">{clients.length} total</p>
        </div>
        <Link
          href="/studio/clients/new"
          className="inline-flex items-center gap-2 bg-info text-black font-semibold text-[13px] px-4 py-2.5 rounded-xl hover:bg-info/90 transition-colors"
        >
          <Plus size={15} />
          Add client
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-surface border border-border-default rounded-xl pl-9 pr-4 py-2 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 bg-bg-surface border border-border-default rounded-xl p-1">
          {["active", "paused", "archived", "all"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors capitalize ${
                statusFilter === s
                  ? "bg-bg-elevated text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Client list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-bg-surface border border-border-subtle rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-bg-surface border border-border-default rounded-2xl p-12 text-center">
          <Users size={28} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-[15px] text-text-primary mb-1">No clients yet</p>
          <p className="font-mono text-[12px] text-text-muted mb-5">
            Add your first client to start generating posters for them.
          </p>
          <Link
            href="/studio/clients/new"
            className="inline-flex items-center gap-2 bg-info text-black font-semibold text-[13px] px-5 py-2.5 rounded-xl hover:bg-info/90 transition-colors"
          >
            <Plus size={14} />
            Add first client
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="group bg-bg-surface border border-border-default rounded-2xl p-4 hover:border-border-strong transition-colors relative"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-default flex items-center justify-center font-semibold text-[14px] text-text-primary shrink-0">
                  {client.clientName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/studio/clients/${client.id}`}
                      className="font-semibold text-[14px] text-text-primary hover:text-info transition-colors truncate"
                    >
                      {client.clientName}
                    </Link>
                    {client.status !== "active" && (
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full capitalize ${
                        client.status === "paused" ? "bg-warning/15 text-warning" : "bg-bg-elevated text-text-muted"
                      }`}>
                        {client.status}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-text-muted truncate">
                    {[client.industry, client.location].filter(Boolean).join(" · ") || "No details"}
                  </p>
                  {client.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {client.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="font-mono text-[10px] bg-bg-elevated px-2 py-0.5 rounded text-text-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Poster count */}
                <div className="hidden sm:block text-right shrink-0">
                  <p className="font-semibold text-[14px] text-text-primary">{client.postersThisMonth}</p>
                  <p className="font-mono text-[10px] text-text-muted">/ {client.monthlyQuota} this month</p>
                  <div className="w-16 bg-bg-elevated rounded-full h-1 mt-1">
                    <div
                      className="h-1 rounded-full bg-info"
                      style={{ width: `${Math.min((client.postersThisMonth / client.monthlyQuota) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/studio/create?clientId=${client.id}`}
                    className="hidden sm:inline-flex items-center gap-1.5 bg-info/10 border border-info/20 text-info font-medium text-[12px] px-3 py-1.5 rounded-lg hover:bg-info/15 transition-colors"
                  >
                    <Sparkles size={11} />
                    Generate
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === client.id ? null : client.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-bg-elevated text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {menuOpen === client.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-bg-overlay border border-border-default rounded-xl shadow-xl z-50 py-1">
                        <Link
                          href={`/studio/clients/${client.id}/edit`}
                          className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
                          onClick={() => setMenuOpen(null)}
                        >
                          <Edit3 size={13} />
                          Edit client
                        </Link>
                        <Link
                          href={`/studio/create?clientId=${client.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
                          onClick={() => setMenuOpen(null)}
                        >
                          <Sparkles size={13} />
                          Generate poster
                        </Link>
                        <button
                          onClick={() => archiveClient(client.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
                        >
                          <Archive size={13} />
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  );
}
