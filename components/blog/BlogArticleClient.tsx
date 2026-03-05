"use client";

import { useEffect, useRef } from "react";
import { trackBlogArticleView, trackBlogReadComplete } from "@/lib/blog/analytics";

interface BlogArticleClientProps {
  slug: string;
  category: string;
  title: string;
}

export function BlogArticleClient({ slug, category, title }: BlogArticleClientProps) {
  const readTracked = useRef(false);

  useEffect(() => {
    trackBlogArticleView({ slug, category, title });
  }, [slug, category, title]);

  useEffect(() => {
    const handleScroll = () => {
      if (readTracked.current) return;
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const ratio = scrollY / docHeight;
      if (ratio >= 0.8) {
        readTracked.current = true;
        trackBlogReadComplete({ slug });
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [slug]);

  return null;
}
