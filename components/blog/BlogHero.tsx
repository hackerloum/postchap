import Link from "next/link";
import Image from "next/image";
import { CategoryBadge } from "./CategoryBadge";
import type { BlogPost } from "@/lib/blog/blogTypes";
import { format } from "date-fns";
import { Clock, ArrowRight } from "lucide-react";

interface BlogHeroProps {
  post: BlogPost;
}

export function BlogHero({ post }: BlogHeroProps) {
  const href = `/blog/${post.slug}`;
  const coverSrc = post.coverImage?.startsWith("http") ? post.coverImage : post.coverImage;

  return (
    <section className="rounded-2xl border border-border-subtle overflow-hidden bg-bg-elevated">
      <Link href={href} className="block aspect-[21/9] sm:aspect-[2/1] relative bg-bg-overlay">
        <Image
          src={coverSrc}
          alt={post.coverAlt || post.title}
          width={1200}
          height={630}
          className="object-cover w-full h-full"
          priority
          sizes="100vw"
        />
      </Link>
      <div className="p-6 sm:p-8">
        <div className="mb-3">
          <CategoryBadge category={post.category} />
        </div>
        <Link href={href}>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary hover:text-accent transition-colors">
            {post.title}
          </h1>
        </Link>
        <p className="text-text-secondary mt-2 text-lg max-w-2xl">{post.description}</p>
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-text-muted">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {post.readingTime} min read
          </span>
          <span>{format(new Date(post.date), "MMMM d, yyyy")}</span>
          <span>{post.author}</span>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-2 mt-6 bg-accent text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-accent-dim transition-colors"
        >
          Read article
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
