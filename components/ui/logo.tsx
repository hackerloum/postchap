"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/artmaster-wordmark.png";

type LogoProps = {
  /** Size variant: nav (header), hero (landing), footer, auth */
  variant?: "nav" | "hero" | "footer" | "auth";
  className?: string;
  /** If true, wrap in Link to home; if false, render only the image */
  link?: boolean;
  alt?: string;
};

const variantSizes = {
  nav: { height: 36, width: 160, className: "h-9 w-auto max-w-[180px]" },
  hero: { height: 96, width: 400, className: "h-24 w-auto max-w-lg sm:h-28 sm:max-w-xl md:h-32 md:max-w-2xl" },
  footer: { height: 32, width: 140, className: "h-8 w-auto max-w-[160px]" },
  auth: { height: 40, width: 160, className: "h-10 w-auto max-w-[180px]" },
};

export function Logo({ variant = "nav", className, link = true, alt = "ArtMaster" }: LogoProps) {
  const { height, width, className: sizeClass } = variantSizes[variant];
  const img = (
    <Image
      src={LOGO_SRC}
      alt={alt}
      width={width}
      height={height}
      className={cn(sizeClass, "object-contain", className)}
      priority={variant === "hero"}
    />
  );
  if (link) {
    return (
      <Link href="/" className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded">
        {img}
      </Link>
    );
  }
  return img;
}
