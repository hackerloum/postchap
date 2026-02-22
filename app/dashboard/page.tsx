import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const snap = await getAdminDb()
      .collection("users")
      .doc(decoded.uid)
      .get();
    return { uid: decoded.uid, ...snap.data() };
  } catch {
    return null;
  }
}

async function getBrandKits(uid: string) {
  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("brand_kits")
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
      id: string;
      brandName?: string;
      industry?: string;
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      brandLocation?: { country?: string };
    }>;
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const brandKits = await getBrandKits(user.uid);
  const hasBrandKits = brandKits.length > 0;

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="h-14 border-b border-border-subtle flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-bg-base/95 backdrop-blur z-10">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-text-primary">
            ArtMaster
          </span>
          <span className="font-mono text-[9px] text-accent border border-accent/30 rounded px-1 py-0.5 tracking-widest">
            PLATFORM
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-text-muted hidden sm:block">
            {(user as { email?: string }).email}
          </span>
          <Link
            href="/api/auth/logout"
            className="font-mono text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Sign out
          </Link>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-semibold text-2xl text-text-primary tracking-tight">
            Good morning 👋
          </h1>
          <p className="mt-1 font-mono text-xs text-text-muted">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {!hasBrandKits ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-border-default flex items-center justify-center mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <h2 className="font-semibold text-lg text-text-primary">
              No brand kits yet
            </h2>
            <p className="mt-2 font-mono text-xs text-text-muted max-w-xs">
              Something went wrong during setup. Let&apos;s create your brand
              kit to get started.
            </p>
            <Link
              href="/onboarding"
              className="mt-6 inline-flex items-center gap-2 bg-accent text-black font-semibold text-sm px-6 py-3 rounded-lg hover:bg-accent-dim transition-colors min-h-[48px]"
            >
              Set up brand kit →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Generate Poster", icon: "✦", href: "/dashboard/create", accent: true },
                { label: "My Posters", icon: "🖼️", href: "/dashboard/posters", accent: false },
                { label: "Brand Kits", icon: "🎨", href: "/dashboard/brand-kits", accent: false },
                { label: "Schedule", icon: "⏰", href: "/dashboard/schedule", accent: false },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-center transition-all duration-150 min-h-[88px] ${
                    action.accent
                      ? "bg-accent border-accent text-black hover:bg-accent-dim"
                      : "bg-bg-surface border-border-default text-text-primary hover:border-border-strong"
                  }`}
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="font-medium text-xs leading-tight">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-base text-text-primary">
                  Your brand kits
                </h2>
                <Link
                  href="/dashboard/brand-kits"
                  className="font-mono text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {brandKits.map((kit) => (
                  <div
                    key={kit.id}
                    className="bg-bg-surface border border-border-default rounded-2xl p-5 hover:border-border-strong transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {[
                            kit.primaryColor,
                            kit.secondaryColor,
                            kit.accentColor,
                          ].map((c, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full border border-white/10"
                              style={{ background: c || "#333" }}
                            />
                          ))}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-text-primary">
                            {kit.brandName}
                          </p>
                          <p className="font-mono text-[10px] text-text-muted">
                            {kit.industry} · {kit.brandLocation?.country || ""}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-bg-surface border border-border-default rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-base text-text-primary">
                  Ready to generate today&apos;s poster?
                </h3>
                <p className="mt-1 font-mono text-xs text-text-muted">
                  ArtMaster will create a brand-perfect poster in seconds.
                </p>
              </div>
              <Link
                href="/dashboard/create"
                className="inline-flex items-center gap-2 bg-accent text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-accent-dim transition-colors whitespace-nowrap min-h-[44px]"
              >
                Generate now →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
