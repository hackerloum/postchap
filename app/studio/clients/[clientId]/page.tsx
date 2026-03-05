"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Palette, Sparkles, Images, Edit3, Mail, Phone, MapPin, Tag, Calendar, ExternalLink } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";

interface Client {
  id: string;
  clientName: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  industry?: string;
  location?: string;
  status: string;
  postersThisMonth: number;
  monthlyQuota: number;
  portalAccessEnabled: boolean;
  tags: string[];
  notes?: string;
  createdAt: number | null;
}

interface BrandKit {
  id: string;
  brandName?: string;
  kitPurpose: string;
  isDefault: boolean;
  primaryColor?: string;
}

interface Poster {
  id: string;
  imageUrl: string;
  headline?: string;
  approvalStatus: string;
  createdAt: number | null;
}

export default function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const { clientId } = params;
  const [client, setClient] = useState<Client | null>(null);
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [recentPosters, setRecentPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getClientIdToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const [clientRes, kitsRes, postersRes] = await Promise.all([
          fetch(`/api/studio/clients/${clientId}`, { headers }),
          fetch(`/api/studio/clients/${clientId}/brand-kits`, { headers }),
          fetch(`/api/studio/posters?clientId=${clientId}&limit=6`, { headers }),
        ]);

        if (clientRes.ok) setClient((await clientRes.json()).client);
        if (kitsRes.ok) setKits((await kitsRes.json()).kits ?? []);
        if (postersRes.ok) setRecentPosters((await postersRes.json()).posters ?? []);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [clientId]);

  const approvalColors: Record<string, string> = {
    draft: "bg-bg-elevated text-text-muted",
    pending: "bg-warning/15 text-warning",
    approved: "bg-success/15 text-success",
    revision_requested: "bg-error/15 text-error",
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="h-8 w-48 bg-bg-surface rounded animate-pulse mb-8" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-bg-surface rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-8 text-center">
        <p className="text-text-muted font-mono text-[13px]">Client not found.</p>
        <Link href="/studio/clients" className="text-info font-mono text-[12px] mt-3 inline-block">← Back to clients</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <Link href="/studio/clients" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors font-mono text-[12px] mb-6">
        <ArrowLeft size={14} />
        Back to clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-border-default flex items-center justify-center font-semibold text-[20px] text-text-primary">
            {client.clientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">{client.clientName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {client.industry && <span className="font-mono text-[11px] text-text-muted">{client.industry}</span>}
              {client.status !== "active" && (
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full capitalize ${
                  client.status === "paused" ? "bg-warning/15 text-warning" : "bg-bg-elevated text-text-muted"
                }`}>{client.status}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/studio/create?clientId=${clientId}`}
            className="inline-flex items-center gap-2 bg-info text-black font-semibold text-[13px] px-4 py-2 rounded-xl hover:bg-info/90 transition-colors"
          >
            <Sparkles size={13} />
            Generate
          </Link>
          <Link
            href={`/studio/clients/${clientId}/edit`}
            className="inline-flex items-center gap-2 bg-bg-surface border border-border-default text-text-secondary text-[13px] font-medium px-4 py-2 rounded-xl hover:border-border-strong transition-colors"
          >
            <Edit3 size={13} />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-6">
        {/* Stats */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1">Posters this month</p>
          <p className="font-semibold text-[28px] text-text-primary">{client.postersThisMonth}</p>
          <p className="font-mono text-[11px] text-text-muted">of {client.monthlyQuota} quota</p>
          <div className="w-full bg-bg-elevated rounded-full h-1.5 mt-2">
            <div
              className="h-1.5 rounded-full bg-info"
              style={{ width: `${Math.min((client.postersThisMonth / client.monthlyQuota) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-4 space-y-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Contact</p>
          {client.contactPerson && (
            <div className="flex items-center gap-2">
              <span className="text-text-muted"><Tag size={12} /></span>
              <span className="text-[13px] text-text-secondary">{client.contactPerson}</span>
            </div>
          )}
          {client.contactEmail && (
            <div className="flex items-center gap-2">
              <Mail size={12} className="text-text-muted" />
              <a href={`mailto:${client.contactEmail}`} className="text-[13px] text-info hover:underline truncate">{client.contactEmail}</a>
            </div>
          )}
          {client.contactPhone && (
            <div className="flex items-center gap-2">
              <Phone size={12} className="text-text-muted" />
              <span className="text-[13px] text-text-secondary">{client.contactPhone}</span>
            </div>
          )}
          {client.location && (
            <div className="flex items-center gap-2">
              <MapPin size={12} className="text-text-muted" />
              <span className="text-[13px] text-text-secondary">{client.location}</span>
            </div>
          )}
        </div>

        {/* Tags & portal */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-4 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Tags</p>
          {client.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {client.tags.map((tag) => (
                <span key={tag} className="font-mono text-[10px] bg-bg-elevated px-2 py-1 rounded text-text-muted">{tag}</span>
              ))}
            </div>
          ) : (
            <p className="font-mono text-[11px] text-text-muted">No tags</p>
          )}
          <div className="pt-1 border-t border-border-subtle">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Client portal</p>
            {client.portalAccessEnabled ? (
              <span className="font-mono text-[11px] text-success">Enabled</span>
            ) : (
              <Link href={`/studio/clients/${clientId}/edit`} className="font-mono text-[11px] text-text-muted hover:text-info transition-colors">
                Enable →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Brand kits */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[15px] text-text-primary">Brand kits</h2>
          <Link href={`/studio/clients/${clientId}/brand-kits/new`} className="font-mono text-[12px] text-info hover:underline">
            + Add kit
          </Link>
        </div>
        {kits.length === 0 ? (
          <div className="bg-bg-surface border border-dashed border-border-default rounded-2xl p-8 text-center">
            <Palette size={22} className="text-text-muted mx-auto mb-2" />
            <p className="font-semibold text-[13px] text-text-primary mb-1">No brand kits yet</p>
            <p className="font-mono text-[11px] text-text-muted mb-4">Create the first brand kit to start generating posters.</p>
            <Link
              href={`/studio/clients/${clientId}/brand-kits/new`}
              className="inline-flex items-center gap-2 bg-info text-black font-semibold text-[12px] px-4 py-2 rounded-xl hover:bg-info/90 transition-colors"
            >
              <Palette size={13} />
              Create brand kit
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {kits.map((kit) => (
              <Link
                key={kit.id}
                href={`/studio/clients/${clientId}/brand-kits/${kit.id}/edit`}
                className="bg-bg-surface border border-border-default rounded-xl p-4 hover:border-border-strong transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  {kit.primaryColor && (
                    <div
                      className="w-4 h-4 rounded-full border border-border-default"
                      style={{ backgroundColor: kit.primaryColor }}
                    />
                  )}
                  {kit.isDefault && (
                    <span className="font-mono text-[10px] bg-info/15 text-info px-1.5 py-0.5 rounded">Default</span>
                  )}
                </div>
                <p className="font-semibold text-[13px] text-text-primary truncate">{kit.brandName || "Unnamed kit"}</p>
                <p className="font-mono text-[11px] text-text-muted capitalize">{kit.kitPurpose}</p>
              </Link>
            ))}
            <Link
              href={`/studio/clients/${clientId}/brand-kits/new`}
              className="bg-bg-surface border border-dashed border-border-default rounded-xl p-4 flex items-center justify-center text-text-muted hover:border-border-strong hover:text-text-secondary transition-colors"
            >
              <span className="font-mono text-[12px]">+ Add kit</span>
            </Link>
          </div>
        )}
      </div>

      {/* Recent posters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[15px] text-text-primary">Recent posters</h2>
          <Link href={`/studio/posters?clientId=${clientId}`} className="font-mono text-[12px] text-text-muted hover:text-info transition-colors">
            View all →
          </Link>
        </div>
        {recentPosters.length === 0 ? (
          <div className="bg-bg-surface border border-dashed border-border-default rounded-2xl p-8 text-center">
            <Images size={22} className="text-text-muted mx-auto mb-2" />
            <p className="font-semibold text-[13px] text-text-primary mb-1">No posters yet</p>
            <p className="font-mono text-[11px] text-text-muted mb-4">Generate the first poster for this client.</p>
            <Link
              href={`/studio/create?clientId=${clientId}`}
              className="inline-flex items-center gap-2 bg-info text-black font-semibold text-[12px] px-4 py-2 rounded-xl hover:bg-info/90 transition-colors"
            >
              <Sparkles size={13} />
              Generate poster
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recentPosters.map((poster) => (
              <div key={poster.id} className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
                <div className="aspect-square bg-bg-elevated">
                  <img
                    src={poster.imageUrl}
                    alt={poster.headline ?? "Poster"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-[12px] text-text-primary truncate">{poster.headline ?? "No headline"}</p>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded capitalize ${approvalColors[poster.approvalStatus] ?? ""}`}>
                    {poster.approvalStatus?.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="mt-6 bg-bg-surface border border-border-default rounded-2xl p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">Internal notes</p>
          <p className="text-[13px] text-text-secondary whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}
    </div>
  );
}
