import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata = {
  title: "Data Deletion | ArtMaster",
  description: "Data deletion request status for ArtMaster.",
};

export default function DataDeletionPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const code = searchParams.code;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col">
      <header className="border-b border-border-subtle">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-text-primary">
            ArtMaster
          </Link>
          <Link
            href="/"
            className="font-mono text-xs text-text-muted hover:text-text-primary"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={28} className="text-green-400" />
          </div>

          <h1 className="font-semibold text-[22px] text-text-primary tracking-tight mb-3">
            Data deletion request received
          </h1>

          <p className="font-mono text-[13px] text-text-muted leading-relaxed mb-6">
            Your Instagram data associated with ArtMaster has been deleted.
            This includes your access token and connected account information.
          </p>

          {code && (
            <div className="bg-bg-surface border border-border-default rounded-xl p-4 mb-6">
              <p className="font-mono text-[11px] text-text-muted mb-1">
                Confirmation code
              </p>
              <p className="font-mono text-[13px] text-text-primary font-semibold tracking-wider">
                {code}
              </p>
            </div>
          )}

          <p className="font-mono text-[12px] text-text-muted leading-relaxed">
            If you have any questions about your data, contact us through the app
            or visit our{" "}
            <Link href="/privacy" className="text-accent hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
