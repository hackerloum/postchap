"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Users, Search, Edit3, Sparkles } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import { Button, Badge, Skeleton, EmptyState, ConfirmDialog, Avatar } from "@/components/studio/ui";
import { ClientCard } from "@/components/studio/shared";

interface Client {
  id: string;
  clientName: string;
  contactEmail?: string;
  industry?: string;
  status: string;
  postersThisMonth: number;
  monthlyQuota: number;
  tags: string[];
}

const STATUS_TABS = ["all", "active", "paused", "archived"] as const;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_TABS[number]>("active");
  const [archiveTarget, setArchiveTarget] = useState<Client | null>(null);
  const initialLoadDone = useRef(false);

  async function loadClients(showFullLoading: boolean) {
    if (showFullLoading) setLoading(true);
    try {
      const token = await getClientIdToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/studio/clients${params}`, { headers });
      if (res.ok) {
        const d = await res.json();
        setClients(d.clients ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const isInitial = !initialLoadDone.current;
    if (isInitial) initialLoadDone.current = true;
    loadClients(isInitial);
  }, [statusFilter]);

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
    loadClients(false);
    setArchiveTarget(null);
  }

  const filtered = clients.filter(
    (c) =>
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-[28px] font-bold text-[#fafafa] tracking-tight">
            Clients
          </h1>
          <Badge variant="default">{clients.length}</Badge>
        </div>
        <Link href="/studio/clients/new">
          <Button variant="primary" size="md">
            Add client
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-[280px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
          <input
            type="search"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-[38px] pl-9 pr-4 rounded-lg text-[13px] text-[#fafafa] placeholder:text-[#71717a] bg-[#111111] border border-[#ffffff0f] focus:outline-none focus:border-[#E8FF4740]"
          />
        </div>
        <div className="flex items-center gap-1 border-b border-[#ffffff08]">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-[11px] font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "text-[#fafafa] border-b-2 border-[#E8FF47] -mb-px"
                  : "text-[#71717a] hover:text-[#a1a1aa]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[52px] w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start generating posters."
          actionLabel="Add client"
          onAction={() => window.location.assign("/studio/clients/new")}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-[10px] border border-[#ffffff0f] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ffffff08]">
                  <th className="text-left py-3 px-4 text-[10px] font-medium uppercase tracking-[0.08em] text-[#71717a]">
                    Client
                  </th>
                  <th className="text-left py-3 px-4 text-[10px] font-medium uppercase tracking-[0.08em] text-[#71717a]">
                    Industry
                  </th>
                  <th className="text-left py-3 px-4 text-[10px] font-medium uppercase tracking-[0.08em] text-[#71717a]">
                    Posters
                  </th>
                  <th className="text-left py-3 px-4 text-[10px] font-medium uppercase tracking-[0.08em] text-[#71717a]">
                    Quota
                  </th>
                  <th className="text-left py-3 px-4 text-[10px] font-medium uppercase tracking-[0.08em] text-[#71717a]">
                    Status
                  </th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-[#ffffff08] hover:bg-[#ffffff04] transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/studio/clients/${client.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar name={client.clientName} id={client.id} size="sm" />
                        <div>
                          <p className="text-[13px] font-medium text-[#fafafa]">
                            {client.clientName}
                          </p>
                          <p className="text-[11px] text-[#71717a]">
                            {client.contactEmail || "—"}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-[12px] text-[#a1a1aa]">
                      {client.industry || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#fafafa]">
                          {client.postersThisMonth}
                        </span>
                        <div className="w-10 h-[3px] rounded-full bg-[#ffffff08] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#E8FF47]"
                            style={{
                              width: `${client.monthlyQuota ? Math.min((client.postersThisMonth / client.monthlyQuota) * 100, 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[12px] text-[#71717a]">
                      {client.monthlyQuota}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          client.status === "active"
                            ? "success"
                            : client.status === "paused"
                              ? "warning"
                              : "default"
                        }
                      >
                        {client.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/studio/clients/${client.id}/edit`}
                          className="p-2 rounded-lg text-[#71717a] hover:bg-[#ffffff08] hover:text-[#fafafa]"
                          aria-label="Edit"
                        >
                          <Edit3 size={14} />
                        </Link>
                        <Link
                          href={`/studio/create?clientId=${client.id}`}
                          className="p-2 rounded-lg text-[#71717a] hover:bg-[#ffffff08] hover:text-[#E8FF47]"
                          aria-label="Generate"
                        >
                          <Sparkles size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setArchiveTarget(client)}
                          className="p-2 rounded-lg text-[#71717a] hover:bg-[#ffffff08] hover:text-[#ef4444] text-[12px]"
                          aria-label="Archive"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/tablet cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
            {filtered.map((client) => (
              <ClientCard
                key={client.id}
                id={client.id}
                name={client.clientName}
                industry={client.industry}
                status={client.status}
                postersThisMonth={client.postersThisMonth}
                monthlyQuota={client.monthlyQuota}
                variant="card"
              />
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => { if (archiveTarget) void archiveClient(archiveTarget.id); }}
        title="Archive client?"
        description={`${archiveTarget?.clientName ?? ""} will be moved to archived. You can restore later.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
      />
    </div>
  );
}
