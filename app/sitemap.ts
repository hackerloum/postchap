// ArtMaster — Super SEO Sitemap
// Public pages only. Private/auth/dashboard routes excluded.
import type { MetadataRoute } from "next";
import { getAllPosts, getAllCategories, getAllTags } from "@/lib/blog/getAllPosts";

const BASE_URL = "https://artmasterpro.com";

function url(
  path: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  lastModified?: Date
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE_URL}${path}`,
    lastModified: lastModified ?? new Date(),
    changeFrequency,
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    url("/", 1.0, "weekly"),
    url("/pricing", 0.95, "monthly"),
    url("/signup", 0.9, "monthly"),
    url("/login", 0.4, "yearly"),
    url("/terms", 0.2, "yearly"),
    url("/privacy", 0.2, "yearly"),
    url("/data-deletion", 0.1, "yearly"),
  ];

  const blogIndex = url("/blog", 0.8, "daily", now);
  const posts = getAllPosts();
  const postEntries = posts.map((p) =>
    url(`/blog/${p.slug}`, 0.9, "weekly", new Date(p.updatedAt || p.date))
  );
  const categories = getAllCategories();
  const categoryEntries = categories.map((c) =>
    url(`/blog/category/${c}`, 0.7, "weekly", now)
  );
  const tags = getAllTags();
  const tagEntries = tags.map((t) =>
    url(`/blog/tag/${encodeURIComponent(t)}`, 0.6, "weekly", now)
  );

  return [
    ...staticEntries,
    blogIndex,
    ...postEntries,
    ...categoryEntries,
    ...tagEntries,
  ];
}
