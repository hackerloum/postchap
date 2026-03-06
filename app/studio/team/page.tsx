"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Loader2, Copy } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button, Card, Avatar, Badge, Skeleton, EmptyState, ConfirmDialog } from "@/components/studio/ui";

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  inviteStatus: string;
  email?: string;
  displayName?: string;
  assignedClients: string[];
}

const ROLES = ["manager", "designer", "reviewer", "intern"];

export default function StudioTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("designer");
  const [inviting, setInviting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  async function load() {
    setLoading(true);
    try {
      const token = await getClientIdToken();
      const res = await fetch("/api/studio/team", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setMembers((await res.json()).members ?? []);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const token = await getClientIdToken();
      const res = await fetch("/api/studio/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to invite"); return; }
      setInviteUrl(`${window.location.origin}${data.inviteUrl}`);
      setInviteEmail("");
      toast.success("Invite created!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(memberId: string) {
    const token = await getClientIdToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`/api/studio/team/${memberId}`, { method: "DELETE", headers });
    if (res.ok) { toast.success("Member removed"); load(); }
    else toast.error("Failed to remove member");
    setRemoveTarget(null);
  }

  const roleVariant: Record<string, "default" | "accent" | "success" | "warning"> = {
    owner: "accent",
    manager: "default",
    designer: "success",
    reviewer: "warning",
    intern: "default",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#fafafa] tracking-tight">Team</h1>
          <p className="text-[14px] text-[#71717a] mt-0.5">Manage team members and their access.</p>
        </div>
        <a href="#invite">
          <Button variant="primary" size="md">Invite member</Button>
        </a>
      </div>

      <Card id="invite" className="p-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a] mb-4">Invite team member</p>
        <form onSubmit={inviteMember} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="email"
                placeholder="colleague@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full h-[38px] px-4 rounded-lg text-[13px] text-[#fafafa] placeholder:text-[#71717a] bg-[#111111] border border-[#ffffff0f] focus:outline-none focus:border-[#E8FF4740]"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full h-[38px] px-4 rounded-lg text-[13px] text-[#fafafa] bg-[#111111] border border-[#ffffff0f] focus:outline-none focus:border-[#E8FF4740]"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <Button type="submit" variant="primary" size="md" className="w-full" disabled={inviting || !inviteEmail.trim()} loading={inviting}>
            <Plus size={14} className="mr-2" /> Send invite
          </Button>
        </form>
        {inviteUrl && (
          <div className="mt-3 p-3 rounded-lg bg-[#080808] border border-[#ffffff0f]">
            <p className="text-[10px] text-[#71717a] mb-1.5">Share this invite link:</p>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[11px] text-[#a1a1aa] truncate">{inviteUrl}</span>
              <button type="button" onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success("Copied!"); }} className="p-2 text-[#71717a] hover:text-[#fafafa]">
                <Copy size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>

      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a] mb-3">Team members</p>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-[10px]" />)}
          </div>
        ) : members.length === 0 ? (
          <EmptyState icon={Users} title="No team members yet" description="Invite team members to collaborate." actionLabel="Invite member" onAction={() => document.getElementById("invite")?.scrollIntoView()} />
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const displayLabel = m.displayName || m.email || (m.role === "owner" ? "Owner" : "Member");
              return (
                <Card key={m.id} className="p-4 flex items-center gap-3">
                  <Avatar name={displayLabel} id={m.userId} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#fafafa] truncate">{displayLabel}</p>
                    {m.email && <p className="text-[11px] text-[#71717a] truncate">{m.email}</p>}
                  </div>
                  <Badge variant={roleVariant[m.role] ?? "default"}>{m.role}</Badge>
                  {m.role !== "owner" && (
                    <button type="button" onClick={() => setRemoveTarget(m)} className="p-2 text-[#71717a] hover:text-[#ef4444] transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Card className="p-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a] mb-3">Role permissions</p>
        <div className="space-y-2 text-[13px]">
          {[
            { role: "owner", desc: "Full access, billing, all clients" },
            { role: "manager", desc: "All clients, no billing" },
            { role: "designer", desc: "Assigned clients only, can generate" },
            { role: "reviewer", desc: "Can approve/reject, cannot generate" },
            { role: "intern", desc: "View only, with comments" },
          ].map(({ role, desc }) => (
            <div key={role} className="flex items-center gap-3">
              <Badge variant={roleVariant[role] ?? "default"}>{role}</Badge>
              <span className="text-[#a1a1aa]">{desc}</span>
            </div>
          ))}
        </div>
      </Card>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => { if (removeTarget) void removeMember(removeTarget.id); }}
        title="Remove team member?"
        description={removeTarget ? `${removeTarget.displayName || removeTarget.email} will lose access.` : ""}
        confirmLabel="Remove"
      />
    </div>
  );
}
