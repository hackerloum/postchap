import { cookies } from "next/headers";
import Link from "next/link";
import { getAdminAuth } from "@/lib/firebase/admin";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// Placeholder data - replace with Firestore query when posters API exists
const MOCK_POSTERS = [
  { id: "1", title: "Monday Motivation", status: "approved", date: "2025-02-22", platform: "instagram" },
  { id: "2", title: "Flash Sale Alert", status: "pending", date: "2025-02-21", platform: "facebook" },
  { id: "3", title: "Product Launch", status: "approved", date: "2025-02-20", platform: "linkedin" },
];

export default async function PostersPage() {
  await getUser();

  const posters = MOCK_POSTERS;

  return (
    <div className="px-4 py-8 sm:px-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard" className="font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1 mb-4">
          <span>←</span> Back to dashboard
        </Link>
        <h1 className="font-semibold text-2xl text-text-primary tracking-tight">My Posters</h1>
        <p className="mt-1 font-mono text-xs text-text-muted">View and manage your generated posters</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent font-mono text-[11px]">All</button>
          <button className="px-3 py-2 rounded-lg bg-bg-elevated border border-border-default text-text-muted font-mono text-[11px] hover:text-text-primary hover:border-border-strong transition-colors">Approved</button>
          <button className="px-3 py-2 rounded-lg bg-bg-elevated border border-border-default text-text-muted font-mono text-[11px] hover:text-text-primary hover:border-border-strong transition-colors">Pending</button>
        </div>
        <select className="bg-bg-surface border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary font-mono outline-none focus:border-accent max-w-[160px]">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
      </div>

      {posters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-bg-surface border border-border-default rounded-2xl">
          <div className="w-20 h-20 rounded-2xl bg-bg-elevated border border-border-default flex items-center justify-center mb-4">
            <span className="text-3xl opacity-50">🖼️</span>
          </div>
          <h2 className="font-semibold text-lg text-text-primary mb-2">No posters yet</h2>
          <p className="font-mono text-xs text-text-muted text-center max-w-sm mb-6">Generate your first poster to see it here</p>
          <Link href="/dashboard/create" className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-sm px-6 py-3 rounded-lg hover:bg-accent-dim transition-colors">
            Generate poster →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {posters.map((poster) => (
            <div
              key={poster.id}
              className="group bg-bg-surface border border-border-default rounded-2xl overflow-hidden hover:border-border-strong transition-all"
            >
              <div className="aspect-square bg-bg-elevated relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl opacity-30">🖼️</span>
                </div>
                <div className="absolute top-2 right-2">
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                      poster.status === "approved"
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-warning/10 text-warning border border-warning/20"
                    }`}
                  >
                    {poster.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-sm text-text-primary truncate">{poster.title}</h3>
                <p className="font-mono text-[10px] text-text-muted mt-1">{poster.date} · {poster.platform}</p>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-1.5 rounded-lg bg-bg-elevated border border-border-default font-mono text-[10px] text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors">
                    Download
                  </button>
                  <button className="flex-1 py-1.5 rounded-lg bg-bg-elevated border border-border-default font-mono text-[10px] text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors">
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
