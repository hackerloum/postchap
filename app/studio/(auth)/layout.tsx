import Image from "next/image";
import Link from "next/link";

export default function StudioAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      <header className="border-b border-border-subtle px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/studio" className="flex items-center gap-2">
            <Image
              src="/artmasterwordmarklogo-03-03.webp"
              alt="ArtMaster Studio"
              width={140}
              height={36}
              className="h-7 w-auto object-contain"
            />
            <span className="font-mono text-[10px] text-text-muted bg-bg-elevated border border-border-default rounded px-1.5 py-0.5">
              STUDIO
            </span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
