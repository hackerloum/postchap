import { notFound } from "next/navigation";
import { getAllPosts, getAllCategories } from "@/lib/blog/getAllPosts";
import { BlogCard } from "@/components/blog/BlogCard";
import { CATEGORY_LABELS } from "@/lib/blog/blogTypes";
import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = "https://artmasterpro.com";

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const label = CATEGORY_LABELS[category] ?? category;
  return {
    title: `${label} | Blog | ArtMaster`,
    description: `Articles about ${label} for small businesses and poster design.`,
    openGraph: {
      title: `${label} | Blog | ArtMaster`,
      url: `${BASE_URL}/blog/category/${category}`,
    },
  };
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const allCategories = getAllCategories();
  if (!allCategories.includes(category)) notFound();

  const posts = getAllPosts().filter((p) => p.category === category);
  const label = CATEGORY_LABELS[category] ?? category;

  return (
    <div>
      <nav className="text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span className="mx-1">/</span>
        <Link href="/blog" className="hover:text-accent">Blog</Link>
        <span className="mx-1">/</span>
        <span className="text-text-primary">{label}</span>
      </nav>
      <h1 className="text-2xl font-bold text-text-primary mb-2">{label}</h1>
      <p className="text-text-muted mb-8">
        {posts.length} article{posts.length !== 1 ? "s" : ""} in this category.
      </p>
      {posts.length === 0 ? (
        <p className="text-text-muted">No articles in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
