import Link from "next/link";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/blog/blogTypes";

interface CategoryBadgeProps {
  category: string;
  href?: boolean;
}

export function CategoryBadge({ category, href = true }: CategoryBadgeProps) {
  const label = CATEGORY_LABELS[category] ?? category;
  const color = CATEGORY_COLORS[category] ?? "#71717a";
  const style = { backgroundColor: `${color}20`, color, borderColor: `${color}40` };
  const className =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";

  if (href) {
    return (
      <Link
        href={`/blog/category/${encodeURIComponent(category)}`}
        className={className}
        style={style}
      >
        {label}
      </Link>
    );
  }
  return (
    <span className={className} style={style}>
      {label}
    </span>
  );
}
