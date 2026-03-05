/**
 * Blog analytics events. Uses Firebase Analytics when available.
 * Events: blog_article_view, blog_cta_click, blog_share, blog_read_complete.
 */

import { getAnalyticsClient } from "@/lib/firebase/client";
import { logEvent } from "firebase/analytics";

function log(name: string, params: object) {
  if (typeof window === "undefined") return;
  try {
    const analytics = getAnalyticsClient();
    if (analytics) logEvent(analytics, name, params);
  } catch {
    // no-op
  }
}

export function trackBlogArticleView(params: {
  slug: string;
  category: string;
  title: string;
}) {
  log("blog_article_view", params);
}

export function trackBlogCtaClick(params: { slug: string; position: "top" | "mid" | "bottom" }) {
  log("blog_cta_click", params);
}

export function trackBlogShare(params: { slug: string; platform: string }) {
  log("blog_share", params);
}

export function trackBlogReadComplete(params: { slug: string }) {
  log("blog_read_complete", params);
}
