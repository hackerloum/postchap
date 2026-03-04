// ArtMaster — Super SEO Sitemap
// Public pages only. Private/auth/dashboard routes excluded.
import type { MetadataRoute } from "next";

const BASE_URL = "https://artmasterpro.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  function url(
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    lastModified: Date = now
  ): MetadataRoute.Sitemap[number] {
    return {
      url: `${BASE_URL}${path}`,
      lastModified,
      changeFrequency,
      priority,
    };
  }

  return [
    url("/", 1.0, "weekly"),
    url("/pricing", 0.95, "monthly"),
    url("/signup", 0.9, "monthly"),
    url("/login", 0.4, "yearly"),
    url("/terms", 0.2, "yearly"),
    url("/privacy", 0.2, "yearly"),
    url("/data-deletion", 0.1, "yearly"),
  ];
}
