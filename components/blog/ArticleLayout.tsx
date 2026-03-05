import type { ReactNode } from "react";

interface ArticleLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ArticleLayout({ children, className = "" }: ArticleLayoutProps) {
  return (
    <div className={`prose prose-blog prose-lg max-w-none dark ${className}`}>
      {children}
    </div>
  );
}
