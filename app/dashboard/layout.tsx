import { cookies } from "next/headers";
import Link from "next/link";
import { getAdminAuth } from "@/lib/firebase/admin";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? "" };
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already validates the session; don't redirect here (Firebase Admin
  // verify can fail in some RSC contexts while middleware's jose verify passes).
  const user = await getUser();

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: "◉" },
    { label: "Generate Poster", href: "/dashboard/create", icon: "✦" },
    { label: "My Posters", href: "/dashboard/posters", icon: "🖼️" },
    { label: "Brand Kits", href: "/dashboard/brand-kits", icon: "🎨" },
    { label: "Schedule", href: "/dashboard/schedule", icon: "⏰" },
  ];

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="h-14 border-b border-border-subtle flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-bg-base/95 backdrop-blur z-20">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-text-primary">ArtMaster</span>
            <span className="font-mono text-[9px] text-accent border border-accent/30 rounded px-1 py-0.5 tracking-widest">PLATFORM</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-[11px] text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <span className="opacity-70">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-text-muted hidden sm:block truncate max-w-[180px]">{user?.email ?? "Account"}</span>
          <Link href="/api/auth/logout" className="font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors">Sign out</Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
