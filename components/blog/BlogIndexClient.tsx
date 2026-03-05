"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface BlogIndexClientProps {
  categories: string[];
  currentCategory: string;
}

const LABELS: Record<string, string> = {
  all: "All",
  tutorials: "Tutorials",
  "design-tips": "Design Tips",
  "social-media": "Social Media",
  "africa-business": "Africa Business",
  "ai-tools": "AI Tools",
  occasions: "Occasions",
  "case-studies": "Case Studies",
  comparisons: "Comparisons",
};

export function BlogIndexClient({ categories, currentCategory }: BlogIndexClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setCategory = (cat: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (cat === "all") {
      next.delete("category");
      next.delete("page");
    } else {
      next.set("category", cat);
      next.delete("page");
    }
    router.replace(`/blog?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => setCategory(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            (cat === "all" && !currentCategory) || currentCategory === cat
              ? "bg-accent text-black"
              : "bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-primary"
          }`}
        >
          {LABELS[cat] ?? cat}
        </button>
      ))}
    </div>
  );
}
