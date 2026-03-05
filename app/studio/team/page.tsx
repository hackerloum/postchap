"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit3, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { getClientIdToken } from "@/lib/auth-client";
import { toast } from "sonner";

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
    if (!confirm("Remove this team member?")) return;
    const token = await getClientIdToken();
    const res = await fetch(`/api/studio/team/${memberId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) { toast.success("Member removed"); load(); }
    else toast.error("Failed to remove member");
  }

  const roleColors: Record<string, string> = {
    owner: "bg-accent/15 text-accent",
    manager: "bg-info/15 text-info",
    designer: "bg-success/15 text-success",
    reviewer: "bg-warning/15 text-warning",
    intern: "bg-bg-elevated text-text-muted",
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="mb-6">
        <h1 className="font-semibold text-[24px] text-text-primary tracking-tight">Team</h1>
        <p className="font-mono text-[13px] text-text-muted mt-1">Manage team members and their access.</p>
      </div>

      {/* Invite form */}
      <div className="bg-bg-surface border border-border-default rounded-2xl p-5 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-4">Invite team member</p>
        <form onSubmit={inviteMember} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <input
                type="email"
                placeholder="colleague@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-info transition-colors"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-bg-base border border-border-default rounded-xl px-3 py-3 text-[13px] text-text-primary outline-none focus:border-info transition-colors"
            >
              {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="w-full bg-info text-black font-semibold text-[13px] py-3 rounded-xl hover:bg-info/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {inviting ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Send invite</>}
          </button>
        </form>

        {inviteUrl && (
          <div className="mt-3 p-3 bg-bg-base border border-border-default rounded-xl">
            <p className="font-mono text-[10px] text-text-muted mb-1.5">Share this invite link:</p>
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono text-[11px] text-text-secondary truncate">{inviteUrl}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success("Copied!"); }}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Team member list */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">Team members</p>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-bg-surface border border-border-subtle rounded-xl animate-pulse" />)}
          </div>
        ) : members.length === 0 ? (
          <div className="bg-bg-surface border border-border-default rounded-2xl p-8 text-center">
            <Users size={24} className="text-text-muted mx-auto mb-2" />
            <p className="font-mono text-[12px] text-text-muted">No team members yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 bg-bg-surface border border-border-default rounded-xl p-4">
                <div className="w-9 h-9 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center font-semibold text-[13px] text-text-primary shrink-0">
                  {(m.displayName ?? m.email ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[13px] text-text-primary truncate">{m.displayName || m.email || m.userId}</p>
                  {m.email && m.displayName && <p className="font-mono text-[11px] text-text-muted truncate">{m.email}</p>}
                </div>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full capitalize ${roleColors[m.role] ?? "bg-bg-elevated text-text-muted"}`}>
                  {m.role}
                </span>
                {m.role !== "owner" && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-text-muted hover:text-error transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role guide */}
      <div className="mt-8 bg-bg-surface border border-border-default rounded-2xl p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">Role permissions</p>
        <div className="space-y-2 text-[13px]">
          {[
            { role: "owner", desc: "Full access, billing, all clients" },
            { role: "manager", desc: "All clients, no billing" },
            { role: "designer", desc: "Assigned clients only, can generate" },
            { role: "reviewer", desc: "Can approve/reject, cannot generate" },
            { role: "intern", desc: "View only, with comments" },
          ].map(({ role, desc }) => (
            <div key={role} className="flex items-center gap-3">
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full capitalize shrink-0 ${roleColors[role] ?? ""}`}>{role}</span>
              <span className="text-text-secondary">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
