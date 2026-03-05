import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost } from "./blogTypes";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

function getMdxFilePaths(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR);
  return files
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => path.join(CONTENT_DIR, f));
}

/**
 * Read and parse all published MDX posts. Returns list without raw content.
 * Sorted by date desc.
 */
export function getAllPosts(): BlogPost[] {
  const filePaths = getMdxFilePaths();
  const posts: BlogPost[] = [];

  for (const filePath of filePaths) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      const slug = data.slug ?? path.basename(filePath, ".mdx");
      if (data.published === false) continue;
      posts.push({
        ...data,
        slug,
        content: undefined,
      } as BlogPost);
    } catch {
      // skip invalid files
    }
  }

  posts.sort((a, b) => {
    const dA = new Date(a.date).getTime();
    const dB = new Date(b.date).getTime();
    return dB - dA;
  });

  return posts;
}

/**
 * Get all unique categories from posts.
 */
export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const set = new Set<string>();
  posts.forEach((p) => set.add(p.category));
  return Array.from(set).sort();
}

/**
 * Get all unique tags from posts.
 */
export function getAllTags(): string[] {
  const posts = getAllPosts();
  const set = new Set<string>();
  posts.forEach((p) => p.tags?.forEach((t) => set.add(t)) ?? null);
  return Array.from(set).sort();
}
