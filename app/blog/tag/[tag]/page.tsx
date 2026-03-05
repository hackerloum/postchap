import { notFound } from "next/navigation";
import { getAllPosts, getAllTags } from "@/lib/blog/getAllPosts";
import { BlogCard } from "@/components/blog/BlogCard";
import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = "https://artmasterpro.com";

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `${decoded} | Blog | ArtMaster`,
    description: `Articles tagged with ${decoded}. Poster design and social media tips for businesses.`,
    openGraph: {
      title: `${decoded} | Blog | ArtMaster`,
      url: `${BASE_URL}/blog/tag/${tag}`,
    },
  };
}

export default async function BlogTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const tagDecoded = decodeURIComponent(tag);
  const allTags = getAllTags();
  if (!allTags.includes(tagDecoded)) notFound();

  const posts = getAllPosts().filter((p) => (p.tags ?? []).includes(tagDecoded));

  return (
    <div>
      <nav className="text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span className="mx-1">/</span>
        <Link href="/blog" className="hover:text-accent">Blog</Link>
        <span className="mx-1">/</span>
        <span className="text-text-primary">Tag: {tagDecoded}</span>
      </nav>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Tag: {tagDecoded}</h1>
      <p className="text-text-muted mb-8">
        {posts.length} article{posts.length !== 1 ? "s" : ""} with this tag.
      </p>
      {posts.length === 0 ? (
        <p className="text-text-muted">No articles with this tag yet.</p>
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
