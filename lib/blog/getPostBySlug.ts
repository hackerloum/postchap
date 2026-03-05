import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost } from "./blogTypes";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

/**
 * Get a single post by slug with full content for MDX serialization.
 * Returns null if not found.
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      ...data,
      slug: data.slug ?? slug,
      content,
    } as BlogPost;
  } catch {
    return null;
  }
}
