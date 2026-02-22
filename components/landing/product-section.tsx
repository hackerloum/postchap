"use client";

import { ProductMockup } from "./product-mockup";

export function ProductSection() {
  return (
    <section className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl animate-fade-up">
          Everything your brand needs. Built into ArtMaster.
        </h2>
        <p className="mt-2 font-apple text-sm font-normal leading-relaxed text-text-secondary animate-fade-up">
          Brand kit, poster history, and editor in one place.
        </p>
        <div className="mt-12">
          <ProductMockup />
        </div>
      </div>
    </section>
  );
}
