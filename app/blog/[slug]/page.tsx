import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPostBySlug } from "@/lib/blog/getPostBySlug";
import { getRelatedPosts } from "@/lib/blog/getRelatedPosts";
import { getTocFromContent } from "@/lib/blog/getTocFromContent";
import { mdxSerializeOptions } from "@/lib/blog/mdx";
import { compileMDX } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog/getAllPosts";
import { CATEGORY_LABELS } from "@/lib/blog/blogTypes";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { CategoryBadge } from "@/components/blog/CategoryBadge";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { AuthorBox } from "@/components/blog/AuthorBox";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { BlogCTA } from "@/components/blog/BlogCTA";
import { ArticleLayout } from "@/components/blog/ArticleLayout";
import { BlogArticleClient } from "@/components/blog/BlogArticleClient";

const BASE_URL = "https://artmasterpro.com";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Blog | ArtMaster" };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.description;
  const url = `${BASE_URL}/blog/${post.slug}`;
  const imageUrl = post.coverImage.startsWith("http") ? post.coverImage : `${BASE_URL}${post.coverImage}`;

  return {
    title,
    description,
    keywords: post.tags?.join(", "),
    authors: [{ name: post.author }],
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updatedAt,
      url,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.coverAlt || post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: { canonical: url },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || !post.content) notFound();

  const related = getRelatedPosts(
    post.slug,
    post.category,
    post.tags ?? [],
    post.relatedSlugs,
    3
  );
  const tocItems = getTocFromContent(post.content);

  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category;
  const coverSrc = post.coverImage.startsWith("http") ? post.coverImage : post.coverImage;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: post.coverImage.startsWith("http") ? post.coverImage : `${BASE_URL}${post.coverImage}`,
    datePublished: post.date,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: "ArtMaster",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "ArtMaster",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon/favicon-96x96.png` },
    },
    mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryLabel,
        item: `${BASE_URL}/blog/category/${post.category}`,
      },
      { "@type": "ListItem", position: 4, name: post.title, item: `${BASE_URL}/blog/${post.slug}` },
    ],
  };

  const mdxComponents = {
    img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
      const src = props.src ?? "";
      const alt = (props.alt as string) ?? "";
      const isExternal = src.startsWith("http");
      if (isExternal) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="rounded-lg my-4" {...props} />
        );
      }
      return (
        <span className="block my-4 relative aspect-video max-w-2xl">
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={630}
            className="rounded-lg object-cover w-full h-full"
          />
        </span>
      );
    },
    BlogCTA: (props: { topic?: string }) => (
      <BlogCTA slug={post.slug} variant="mid" topic={props.topic} className="my-8" />
    ),
  };

  const { content: mdxContent } = await compileMDX({
    source: post.content,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: mdxSerializeOptions as any,
    components: mdxComponents,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <BlogArticleClient slug={post.slug} category={post.category} title={post.title} />

      <ReadingProgress />

      <div className="max-w-5xl mx-auto">
        <nav className="text-sm text-text-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-accent">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/blog" className="hover:text-accent">
                Blog
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/blog/category/${post.category}`} className="hover:text-accent">
                {categoryLabel}
              </Link>
            </li>
            <li>/</li>
            <li className="text-text-primary truncate max-w-[200px]" aria-current="page">
              {post.title}
            </li>
          </ol>
        </nav>

        <article>
          <header className="mb-8">
            <div className="mb-3">
              <CategoryBadge category={post.category} href={true} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">{post.title}</h1>
            <p className="text-xl text-text-secondary mt-2">{post.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-text-muted">
              <span>{post.author}</span>
              <span>{format(new Date(post.date), "MMMM d, yyyy")}</span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {post.readingTime} min read
              </span>
              <ShareButtons slug={post.slug} title={post.title} />
            </div>
            <div className="mt-6 relative aspect-[1200/630] rounded-xl overflow-hidden bg-bg-elevated">
              <Image
                src={coverSrc}
                alt={post.coverAlt || post.title}
                width={1200}
                height={630}
                priority
                className="object-cover w-full h-full"
              />
            </div>
          </header>

          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 min-w-0">
              <BlogCTA slug={post.slug} variant="top" className="mb-8" />

              <ArticleLayout>{mdxContent}</ArticleLayout>

              <BlogCTA slug={post.slug} variant="bottom" className="mt-10" />
            </div>

            <aside className="lg:w-72 shrink-0">
              <div className="lg:sticky lg:top-24 space-y-8">
                {tocItems.length > 0 && (
                  <TableOfContents items={tocItems} />
                )}
                <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle">
                  <p className="text-sm font-medium text-text-primary mb-2">Try ArtMaster free</p>
                  <Link
                    href={`${BASE_URL}/signup?utm_source=blog&utm_medium=article&utm_campaign=${encodeURIComponent(post.slug)}`}
                    className="text-sm text-accent hover:underline"
                  >
                    Start free →
                  </Link>
                </div>
                {related.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary mb-3">Related</h2>
                    <ul className="space-y-2">
                      {related.map((p) => (
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
                  </div>
                )}
              </div>
            </aside>
          </div>

          <footer className="mt-12 pt-8 border-t border-border-subtle">
            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog/tag/${encodeURIComponent(tag)}`}
                    className="text-sm px-3 py-1 rounded-full bg-bg-elevated border border-border-subtle text-text-muted hover:text-accent hover:border-accent/30"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
            <ShareButtons slug={post.slug} title={post.title} className="mb-6" />
            <AuthorBox author={post.author} />
            {related.length > 0 && (
              <div className="mt-10">
                <RelatedPosts posts={related} />
              </div>
            )}
            <div className="mt-10 text-center">
              <Link
                href={`${BASE_URL}/signup?utm_source=blog&utm_medium=article&utm_campaign=${encodeURIComponent(post.slug)}`}
                className="inline-flex items-center justify-center bg-accent text-black font-semibold px-6 py-3 rounded-lg hover:bg-accent-dim"
              >
                Ready to create your own posters? Start free →
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </>
  );
}
