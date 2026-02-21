"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "How does the daily poster get generated?",
    a: "Each morning, for every enabled brand kit, we call the OpenAI API to generate copy (headline, subheadline, body, CTA, hashtags) and a background image. Text and logo are composited server-side so your brand stays consistent. The draft is saved and waiting in your dashboard.",
  },
  {
    q: "Can I edit the poster before it goes out?",
    a: "Yes. Every generated poster is a draft. You can edit headline, subheadline, body, CTA, and hashtags in the poster detail view. You can also regenerate to get a new version. Nothing is posted until you approve.",
  },
  {
    q: "What poster sizes are supported?",
    a: "We support three aspect ratios: 1:1 (square), 4:5 (portrait), and 9:16 (story). You choose one per brand kit. The same ratio is used for every poster for that brand.",
  },
  {
    q: "Is my brand data used to train AI?",
    a: "No. Your brand kit, copy, and generated content are not used to train any model. We use OpenAI under their API terms; your data is not used for training.",
  },
  {
    q: "How do I connect my social accounts?",
    a: "Kichwa generates and stores the poster and copy. Posting to Instagram, LinkedIn, or other platforms is done by you (download and post) or via a future integration. Right now we focus on generation and approval.",
  },
  {
    q: "What if I miss a day?",
    a: "If the cron runs and you already have a poster for that date, we skip (idempotent). You can also trigger \"Generate now\" manually from the brand kit or dashboard. Past posters stay in history.",
  },
];

export function FAQ() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.q ?? null);

  return (
    <section className="px-6 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl font-semibold tracking-tight text-text-primary md:text-4xl"
        >
          Frequently asked questions
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 space-y-0 border-t border-border-default"
        >
          {FAQ_ITEMS.map((item) => (
            <Collapsible
              key={item.q}
              open={openId === item.q}
              onOpenChange={(open) => setOpenId(open ? item.q : null)}
            >
              <div className="border-b border-border-default">
                <CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-left font-apple text-base font-semibold text-text-primary hover:text-text-secondary">
                  {item.q}
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-text-muted transition-transform",
                      openId === item.q && "rotate-180"
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="pb-4 pr-8 font-apple text-sm font-normal leading-relaxed text-text-secondary">
                    {item.a}
                  </p>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
