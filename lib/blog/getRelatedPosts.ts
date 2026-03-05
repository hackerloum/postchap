import { getAllPosts } from "./getAllPosts";
import type { BlogPost } from "./blogTypes";

/**
 * Get related posts: prefer relatedSlugs, then same category, then tag overlap.
 * Excludes the current slug. Returns up to limit (default 3).
 */
export function getRelatedPosts(
  slug: string,
  category: string,
  tags: string[],
  relatedSlugs: string[] | undefined,
  limit: number = 3
): BlogPost[] {
  const all = getAllPosts().filter((p) => p.slug !== slug && p.published !== false);
  if (all.length === 0) return [];

  const bySlug = new Map<string, BlogPost>();
  all.forEach((p) => bySlug.set(p.slug, p));

  const out: BlogPost[] = [];
  const used = new Set<string>();

  // 1. Prefer relatedSlugs from frontmatter
  if (relatedSlugs?.length) {
    for (const s of relatedSlugs) {
      const post = bySlug.get(s);
      if (post && !used.has(post.slug)) {
        out.push(post);
        used.add(post.slug);
        if (out.length >= limit) return out;
      }
    }
  }

  // 2. Same category
  for (const p of all) {
    if (used.has(p.slug)) continue;
    if (p.category === category) {
      out.push(p);
      used.add(p.slug);
      if (out.length >= limit) return out;
    }
  }

  // 3. Tag overlap
  const tagSet = new Set(tags);
  const withTagOverlap = all
    .filter((p) => !used.has(p.slug) && (p.tags ?? []).some((t) => tagSet.has(t)))
    .sort((a, b) => {
      const aCount = (a.tags ?? []).filter((t) => tagSet.has(t)).length;
      const bCount = (b.tags ?? []).filter((t) => tagSet.has(t)).length;
      return bCount - aCount;
    });
  for (const p of withTagOverlap) {
    out.push(p);
    used.add(p.slug);
    if (out.length >= limit) return out;
  }

  // 4. Fill with latest
  for (const p of all) {
    if (used.has(p.slug)) continue;
    out.push(p);
    if (out.length >= limit) return out;
  }

  return out;
}
