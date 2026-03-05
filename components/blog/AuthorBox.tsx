import Link from "next/link";

interface AuthorBoxProps {
  author: string;
}

export function AuthorBox({ author }: AuthorBoxProps) {
  return (
    <div className="flex gap-4 p-6 rounded-xl bg-bg-elevated border border-border-subtle">
      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold shrink-0">
        {author.charAt(0)}
      </div>
      <div>
        <p className="font-semibold text-text-primary">{author}</p>
        <p className="text-text-muted text-sm mt-1">
          We build AI tools for African businesses. ArtMaster generates daily branded posters so
          you can focus on running your business.
        </p>
        <Link
          href="https://artmasterpro.com/about"
          className="text-accent text-sm font-medium mt-2 inline-block hover:underline"
        >
          Learn about ArtMaster →
        </Link>
      </div>
    </div>
  );
}
