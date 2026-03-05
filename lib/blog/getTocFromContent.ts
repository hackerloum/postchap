/**
 * Extract H2/H3 headings from MDX content to build TOC.
 * Uses github-slugger so IDs match rehype-slug output.
 */

import GitHubSlugger from "github-slugger";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function getTocFromContent(content: string): TocItem[] {
  const slugger = new GitHubSlugger();
  const items: TocItem[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    if (h2) {
      const text = h2[1].replace(/#.*$/, "").trim();
      items.push({ id: slugger.slug(text), text, level: 2 });
    } else if (h3) {
      const text = h3[1].replace(/#.*$/, "").trim();
      items.push({ id: slugger.slug(text), text, level: 3 });
    }
  }
  return items;
}
