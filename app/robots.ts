// Locks down private routes. Tells crawlers what to allow/disallow.
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/sitemap.xml",
          "/pricing",
          "/signup",
          "/login",
          "/terms",
          "/privacy",
          "/data-deletion",
          "/favicon/",
          "/og/",
        ],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/onboarding",
          "/checkout",
          "/reset-password",
          "/api/",
          "/_next/",
          "/vps-panel/",
        ],
      },
      { userAgent: "GPTBot", disallow: ["/"] },
      { userAgent: "ClaudeBot", disallow: ["/"] },
      { userAgent: "CCBot", disallow: ["/"] },
    ],
    sitemap: "https://artmasterpro.com/sitemap.xml",
    host: "https://artmasterpro.com",
  };
}
