"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";

/**
 * Full-screen loading screen with ArtMaster logo and spinner.
 * Use on dashboard pages (e.g. create) so loading state is consistent.
 */
export function LogoLoadingScreen() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4">
      <Image
        src="/artmasterwordmarklogo-03-03.webp"
        alt="ArtMaster"
        width={140}
        height={40}
        className="h-8 w-auto object-contain opacity-90"
        priority
      />
      <Loader2 size={18} className="text-accent animate-spin" />
    </div>
  );
}
