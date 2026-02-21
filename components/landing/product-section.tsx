"use client";

import { motion } from "framer-motion";
import { ProductMockup } from "./product-mockup";

export function ProductSection() {
  return (
    <section className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl"
        >
          Everything your brand needs. Nothing it doesn&apos;t.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-2 font-apple text-sm font-normal leading-relaxed text-text-secondary"
        >
          Brand kit, poster history, and editor in one place.
        </motion.p>
        <div className="mt-12">
          <ProductMockup />
        </div>
      </div>
    </section>
  );
}
