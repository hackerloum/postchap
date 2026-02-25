import Image from "next/image";

export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="px-6 h-14 flex items-center border-b border-border-subtle">
        <a href="/" className="flex items-center flex-shrink-0">
          <Image
            src="/artmasterwordmarklogo-03-03.webp"
            alt="Art Master"
            width={200}
            height={52}
            className="h-6 w-auto sm:h-10 object-contain object-left"
          />
        </a>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
