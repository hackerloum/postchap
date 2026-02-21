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
  nav: { height: 48, width: 220, className: "h-12 w-auto max-w-[240px] md:h-14 md:max-w-[280px]" },
  hero: { height: 120, width: 480, className: "h-28 w-auto max-w-xl sm:h-36 sm:max-w-2xl md:h-44 md:max-w-3xl lg:h-52 lg:max-w-4xl" },
  footer: { height: 44, width: 200, className: "h-11 w-auto max-w-[220px]" },
  auth: { height: 52, width: 220, className: "h-12 w-auto max-w-[240px] md:h-14 md:max-w-[280px]" },
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
