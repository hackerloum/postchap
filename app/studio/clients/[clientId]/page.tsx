"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Palette, Sparkles, Images, Edit3 } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import { Button, Badge, Card, Avatar, Skeleton, EmptyState } from "@/components/studio/ui";
import { BrandKitCard, PosterCard } from "@/components/studio/shared";

interface Client {
  id: string;
  clientName: string;
  contactEmail?: string;
  industry?: string;
  website?: string;
  status: string;
  postersThisMonth: number;
  monthlyQuota: number;
  portalAccessEnabled: boolean;
  tags: string[];
  notes?: string;
}

interface BrandKit {
  id: string;
  brandName?: string;
  kitPurpose: string;
  isDefault: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

interface Poster {
  id: string;
  imageUrl: string;
  headline?: string;
  approvalStatus: string;
  createdAt: number | null;
}

type Tab = "kits" | "posters" | "notes";

export default function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const { clientId } = params;
  const [client, setClient] = useState<Client | null>(null);
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("kits");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const token = await getClientIdToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [clientRes, kitsRes, postersRes] = await Promise.all([
          fetch(`/api/studio/clients/${clientId}`, { headers }),
          fetch(`/api/studio/clients/${clientId}/brand-kits`, { headers }),
          fetch(`/api/studio/posters?clientId=${clientId}&limit=12`, { headers }),
        ]);
        if (clientRes.ok) {
          const d = await clientRes.json();
          setClient(d.client);
          setNotes(d.client?.notes ?? "");
        }
        if (kitsRes.ok) setKits((await kitsRes.json()).kits ?? []);
        if (postersRes.ok) setPosters((await postersRes.json()).posters ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clientId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[10px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-[13px] text-[#71717a]">Client not found.</p>
        <Link href="/studio/clients" className="text-[#E8FF47] text-[12px] mt-3 inline-block hover:underline">
          ← Back to clients
        </Link>
      </div>
    );
  }

  const statusVariant =
    client.status === "active" ? "success" : client.status === "paused" ? "warning" : "default";

  return (
    <div className="space-y-6">
      <Link
        href="/studio/clients"
        className="inline-flex items-center gap-2 text-[12px] text-[#71717a] hover:text-[#a1a1aa] transition-colors"
      >
        <ArrowLeft size={14} />
        Back to clients
      </Link>

      <Card className="p-5 border-b border-[#ffffff08]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={client.clientName} id={clientId} size="lg" />
            <div>
              <h1 className="text-[24px] font-bold text-[#fafafa] tracking-tight">
                {client.clientName}
              </h1>
              <p className="text-[14px] text-[#71717a]">{client.industry || "—"}</p>
              {client.website && (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-[#E8FF47] hover:underline mt-0.5"
                >
                  {client.website}
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant}>{client.status}</Badge>
            <Link href={`/studio/clients/${clientId}/edit`}>
              <Button variant="ghost" size="md">
                <Edit3 size={14} className="mr-2" />
                Edit
              </Button>
            </Link>
            <Link href={`/studio/create?clientId=${clientId}`}>
              <Button variant="primary" size="md">
                <Sparkles size={14} className="mr-2" />
                Generate
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a] mb-1">
            Posters this month
          </p>
          <p className="text-[28px] font-bold text-[#fafafa]">
            {client.postersThisMonth}
          </p>
          <p className="text-[12px] text-[#71717a]">of {client.monthlyQuota} quota</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-[#ffffff08] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E8FF47]"
              style={{
                width: `${client.monthlyQuota ? Math.min((client.postersThisMonth / client.monthlyQuota) * 100, 100) : 0}%`,
              }}
            />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a] mb-1">
            Approval rate
          </p>
          <p className="text-[28px] font-bold text-[#fafafa]">—</p>
          <p className="text-[12px] text-[#71717a]">Based on recent posters</p>
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a] mb-1">
            AI cost
          </p>
          <p className="text-[28px] font-bold text-[#fafafa]">—</p>
          <p className="text-[12px] text-[#71717a]">This client</p>
        </Card>
      </div>

      <div className="border-b border-[#ffffff08]">
        <div className="flex gap-6">
          {(["kits", "posters", "notes"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "text-[#fafafa] border-[#E8FF47]"
                  : "text-[#71717a] border-transparent hover:text-[#a1a1aa]"
              }`}
            >
              {t === "kits" ? "Brand Kits" : t === "posters" ? "Posters" : "Notes"}
            </button>
          ))}
        </div>
      </div>

      {tab === "kits" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kits.map((kit) => (
            <BrandKitCard
              key={kit.id}
              id={kit.id}
              clientId={clientId}
              name={kit.brandName ?? "Unnamed kit"}
              isDefault={kit.isDefault}
              colors={[kit.primaryColor, kit.secondaryColor, kit.accentColor].filter(Boolean) as string[]}
            />
          ))}
          <Link
            href={`/studio/clients/${clientId}/brand-kits/new`}
            className="flex items-center justify-center min-h-[120px] rounded-[10px] border border-dashed border-[#ffffff12] text-[#71717a] hover:border-[#E8FF4730] hover:text-[#E8FF47] transition-colors"
          >
            + Add brand kit
          </Link>
        </div>
      )}

      {tab === "posters" && (
        <div>
          {posters.length === 0 ? (
            <EmptyState
              icon={Images}
              title="No posters yet"
              description="Generate the first poster for this client."
              actionLabel="Generate"
              onAction={() => window.location.assign(`/studio/create?clientId=${clientId}`)}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {posters.map((poster) => (
                <PosterCard
                  key={poster.id}
                  id={poster.id}
                  imageUrl={poster.imageUrl}
                  clientName={client.clientName}
                  clientId={clientId}
                  date={
                    poster.createdAt
                      ? new Date(poster.createdAt * 1000).toLocaleDateString()
                      : undefined
                  }
                  status={poster.approvalStatus}
                  showActions={false}
                />
              ))}
            </div>
          )}
          <Link
            href={`/studio/posters?clientId=${clientId}`}
            className="inline-block mt-4 text-[12px] text-[#E8FF47] hover:underline"
          >
            View all posters →
          </Link>
        </div>
      )}

      {tab === "notes" && (
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes..."
            className="w-full min-h-[120px] p-4 rounded-lg text-[13px] text-[#fafafa] placeholder:text-[#71717a] bg-[#111111] border border-[#ffffff0f] focus:outline-none focus:border-[#E8FF4740]"
          />
          <p className="text-[11px] text-[#71717a] mt-2">Auto-save coming soon</p>
        </div>
      )}
    </div>
  );
}
