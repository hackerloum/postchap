import Link from "next/link";
import Image from "next/image";
import { CategoryBadge } from "./CategoryBadge";
import type { BlogPost } from "@/lib/blog/blogTypes";
import { format } from "date-fns";
import { Clock } from "lucide-react";

const BASE_URL = "https://artmasterpro.com";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const href = `/blog/${post.slug}`;
  const coverSrc = post.coverImage?.startsWith("http") ? post.coverImage : post.coverImage;

  return (
    <article className="group flex flex-col bg-bg-elevated rounded-xl border border-border-subtle overflow-hidden hover:border-border-default transition-colors">
      <Link href={href} className="block aspect-video relative bg-bg-overlay overflow-hidden">
        <Image
          src={coverSrc}
          alt={post.coverAlt || post.title}
          width={640}
          height={360}
          className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </Link>
      <div className="flex flex-col flex-1 p-4">
        <div className="mb-2">
          <CategoryBadge category={post.category} />
        </div>
        <Link href={href}>
          <h2 className="font-semibold text-text-primary text-lg line-clamp-2 group-hover:text-accent transition-colors">
            {post.title}
          </h2>
        </Link>
        <p className="text-text-muted text-sm mt-1 line-clamp-3 flex-1">{post.description}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {post.readingTime} min read
          </span>
          <span>{format(new Date(post.date), "MMM d, yyyy")}</span>
          <span>{post.author}</span>
        </div>
      </div>
    </article>
  );
}
