"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search, ChevronRight } from "lucide-react";

interface UserRow {
  uid: string;
  email: string;
  displayName: string;
  plan: "free" | "pro" | "business";
  hasOnboarded: boolean;
  createdAt: number | null;
  country: string | null;
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-bg-elevated text-text-muted border border-border-default",
  pro: "bg-accent/10 text-accent border border-accent/30",
  business: "bg-green-400/10 text-green-400 border border-green-400/30",
};

const FILTERS = ["all", "free", "pro", "business"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filter !== "all") params.set("plan", filter);

    fetch(`/api/admin/users?${params}`, { credentials: "same-origin" })
      .then((r) => r.ok && r.json())
      .then((d) => d?.users && setUsers(d.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.displayName.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-semibold text-[22px] text-text-primary tracking-tight">Users</h1>
        <p className="font-mono text-[12px] text-text-muted mt-1">
          {users.length} users loaded
        </p>
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-bg-surface border border-border-default rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-accent text-black"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full bg-bg-surface border border-border-default rounded-lg pl-8 pr-3 py-2 text-[13px] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
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
                  User
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-text-muted uppercase tracking-widest">
                  Plan
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-text-muted uppercase tracking-widest hidden sm:table-cell">
                  Country
                </th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-text-muted uppercase tracking-widest hidden md:table-cell">
                  Joined
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center font-mono text-[12px] text-text-muted">
                    No users found
                  </td>
                </tr>
              )}
              {filtered.map((user) => (
                <tr key={user.uid} className="hover:bg-bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[13px] text-text-primary">
                      {user.displayName || "—"}
                    </p>
                    <p className="font-mono text-[11px] text-text-muted">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${PLAN_COLORS[user.plan] ?? PLAN_COLORS.free}`}
                    >
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="font-mono text-[12px] text-text-muted">
                      {user.country ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-mono text-[11px] text-text-muted">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.uid}`}
                      className="text-text-muted hover:text-text-primary transition-colors"
                    >
                      <ChevronRight size={15} />
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
