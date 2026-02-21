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
    q: "What exactly does ArtMaster do?",
    a: "ArtMaster generates one professionally designed social media poster per day for each of your brand kits — automatically. Every morning, your brand shows up online without you lifting a finger.",
  },
  {
    q: "How does ArtMaster know my brand style?",
    a: "You set up a Brand Kit with your colors, logo, tone, and language. ArtMaster uses this to craft copy and visuals that match your brand every single time.",
  },
  {
    q: "Can I edit the poster before it goes out?",
    a: "Yes. Every poster goes through an approval flow. You review, edit if needed, and approve — ArtMaster never posts without your sign-off.",
  },
  {
    q: "Does ArtMaster support Swahili content?",
    a: "Absolutely. ArtMaster supports both English and Swahili content generation, making it the only poster automation tool built with East African brands in mind.",
  },
  {
    q: "How many brands can I manage?",
    a: "Depending on your plan, you can manage multiple Brand Kits — each with its own daily schedule, style, and approval flow.",
  },
  {
    q: "Is my content and brand data safe?",
    a: "Yes. ArtMaster uses row-level security, encrypted storage, and never uses your content to train AI models.",
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
          Frequently asked questions about ArtMaster
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
