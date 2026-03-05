/**
 * Blog post frontmatter and post types for ArtMaster SEO blog.
 * Matches MDX frontmatter schema in docs.
 */

export const BLOG_CATEGORIES = [
  "tutorials",
  "design-tips",
  "social-media",
  "africa-business",
  "ai-tools",
  "occasions",
  "case-studies",
  "comparisons",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export interface BlogPostFrontmatter {
  title: string;
  slug: string;
  description: string;
  date: string;
  updatedAt: string;
  author: string;
  category: BlogCategory | string;
  tags: string[];
  coverImage: string;
  coverAlt: string;
  readingTime: number;
  featured: boolean;
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  relatedSlugs?: string[];
}

export interface BlogPost extends BlogPostFrontmatter {
  content?: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  tutorials: "Tutorials",
  "design-tips": "Design Tips",
  "social-media": "Social Media",
  "africa-business": "Africa Business",
  "ai-tools": "AI Tools",
  occasions: "Occasions",
  "case-studies": "Case Studies",
  comparisons: "Comparisons",
};

export const CATEGORY_COLORS: Record<string, string> = {
  tutorials: "#e8ff47",
  "design-tips": "#818cf8",
  "social-media": "#4ade80",
  "africa-business": "#fbbf24",
  "ai-tools": "#67e8f9",
  occasions: "#f472b6",
  "case-studies": "#a78bfa",
  comparisons: "#fb923c",
};
