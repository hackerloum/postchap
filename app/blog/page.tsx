import { Suspense } from "react";
import { getAllPosts, getAllCategories } from "@/lib/blog/getAllPosts";
import { BlogHero } from "@/components/blog/BlogHero";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogIndexClient } from "@/components/blog/BlogIndexClient";
import type { BlogPost } from "@/lib/blog/blogTypes";
import Link from "next/link";

const POSTS_PER_PAGE = 12;
const POPULAR_SLUGS = [
  "how-to-create-business-poster-free",
  "best-free-poster-maker-africa",
  "canva-alternative-african-business",
  "social-media-tips-small-business-nigeria",
  "ai-poster-generator-guide",
];

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "";
  const page = Number(params.page) || 1;

  const allPosts = getAllPosts();
  const categories = getAllCategories();
  const filtered =
    category && category !== "all"
      ? allPosts.filter((p) => p.category === category)
      : allPosts;

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const posts = filtered.slice(start, start + POSTS_PER_PAGE);

  const featured = allPosts.length > 0 ? (allPosts.find((p) => p.featured) ?? allPosts[0]) : null;
  const popularPosts: BlogPost[] = POPULAR_SLUGS.map((s) =>
    allPosts.find((p) => p.slug === s)
  ).filter(Boolean) as BlogPost[];
  const popular = popularPosts.length > 0 ? popularPosts : allPosts.slice(0, 5);

  return (
    <div className="flex flex-col lg:flex-row gap-10">
      <div className="flex-1 min-w-0">
        {featured && allPosts.length > 0 && (
          <div className="mb-10">
            <BlogHero post={featured} />
          </div>
        )}

        <Suspense fallback={<div className="h-10" />}>
          <BlogIndexClient
            categories={["all", ...categories]}
            currentCategory={category || "all"}
          />
        </Suspense>

        {posts.length === 0 ? (
          <p className="text-text-muted py-12">No articles yet. Check back soon.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="flex justify-center gap-2 mt-10" aria-label="Pagination">
                {currentPage > 1 && (
                  <Link
                    href={
                      category
                        ? `/blog?category=${encodeURIComponent(category)}&page=${currentPage - 1}`
                        : `/blog?page=${currentPage - 1}`
                    }
                    className="px-4 py-2 rounded-lg border border-border-default text-text-primary hover:bg-bg-elevated"
                  >
                    Previous
                  </Link>
                )}
                <span className="px-4 py-2 text-text-muted text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link
                    href={
                      category
                        ? `/blog?category=${encodeURIComponent(category)}&page=${currentPage + 1}`
                        : `/blog?page=${currentPage + 1}`
                    }
                    className="px-4 py-2 rounded-lg border border-border-default text-text-primary hover:bg-bg-elevated"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>

      <aside className="lg:w-80 shrink-0 space-y-8">
        <section className="p-6 rounded-xl bg-bg-elevated border border-border-subtle">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Popular articles</h2>
          <ul className="space-y-2">
            {popular.slice(0, 5).map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="text-sm text-text-muted hover:text-accent line-clamp-2"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="p-6 rounded-xl bg-bg-elevated border border-border-subtle">
          <h2 className="text-sm font-semibold text-text-primary mb-2">
            Get weekly poster tips for your business
          </h2>
          <p className="text-text-muted text-sm mb-4">
            One email per week. No spam. Unsubscribe anytime.
          </p>
          <a
            href="https://artmasterpro.com/signup"
            className="block text-center text-sm font-medium text-accent hover:underline"
          >
            Sign up free →
          </a>
        </section>
        <section className="p-6 rounded-xl border border-accent/30 bg-accent/5">
          <h2 className="text-sm font-semibold text-text-primary mb-2">
            Try ArtMaster free — generate your first poster
          </h2>
          <Link
            href="https://artmasterpro.com/signup?utm_source=blog&utm_medium=sidebar"
            className="inline-flex justify-center w-full mt-3 bg-accent text-black font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-accent-dim"
          >
            Start free →
          </Link>
        </section>
      </aside>
    </div>
  );
}
