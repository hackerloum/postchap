import Image from "next/image";
import Link from "next/link";

export function AuthFormPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg-base overflow-y-auto">
      {/* Mobile logo — only visible on mobile */}
      <div className="flex lg:hidden items-center px-6 pt-8 mb-8">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/artmasterwordmarklogo-03-03.webp"
            alt="ArtMaster"
            width={200}
            height={52}
            className="h-6 w-auto object-contain object-left"
          />
        </Link>
      </div>

      {/* Form centered vertically */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center">
        <p className="font-mono text-[11px] text-text-muted">
          © {new Date().getFullYear()} ArtMaster Platform
        </p>
      </div>
    </div>
  );
}
