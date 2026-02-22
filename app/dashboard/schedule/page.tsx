import { cookies } from "next/headers";
import Link from "next/link";
import { getAdminAuth } from "@/lib/firebase/admin";
import { ScheduleForm } from "./ScheduleForm";

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

export default async function SchedulePage() {
  await getUser();

  return (
    <div className="px-4 py-8 sm:px-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard" className="font-mono text-[11px] text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1 mb-4">
          <span>←</span> Back to dashboard
        </Link>
        <h1 className="font-semibold text-2xl text-text-primary tracking-tight">Schedule</h1>
        <p className="mt-1 font-mono text-xs text-text-muted">Automate daily poster generation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ScheduleForm />
        </div>

        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6">
            <h3 className="font-semibold text-sm text-text-primary mb-3">How it works</h3>
            <ol className="space-y-3 font-mono text-[11px] text-text-secondary">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold">1</span>
                Set your preferred time and timezone
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold">2</span>
                ArtMaster generates a poster daily
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold">3</span>
                Review and approve via email or in-app
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold">4</span>
                Download or post directly to social
              </li>
            </ol>
          </div>

          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6">
            <h3 className="font-semibold text-sm text-text-primary mb-2">Pro tip</h3>
            <p className="font-mono text-[11px] text-text-secondary">
              Generating at 7–8 AM local time ensures posters are ready before your audience is online.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
