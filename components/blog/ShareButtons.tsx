"use client";

import { useState } from "react";
import { Twitter, Facebook, Linkedin, MessageCircle, Link2 } from "lucide-react";
import { toast } from "sonner";
import { trackBlogShare } from "@/lib/blog/analytics";

const BASE_URL = "https://artmasterpro.com";

interface ShareButtonsProps {
  slug: string;
  title: string;
  className?: string;
}

function shareUrl(slug: string): string {
  return `${BASE_URL}/blog/${slug}`;
}

function twitterUrl(title: string, slug: string): string {
  const url = shareUrl(slug);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
}

function facebookUrl(slug: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl(slug))}`;
}

function whatsappUrl(title: string, slug: string): string {
  const url = shareUrl(slug);
  const text = `${title} ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function linkedInUrl(slug: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl(slug))}`;
}

export function ShareButtons({ slug, title, className = "" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url = shareUrl(slug);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied!");
      trackBlogShare({ slug, platform: "copy" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-text-muted mr-1">Share:</span>
      <a
        href={twitterUrl(title, slug)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackBlogShare({ slug, platform: "twitter" })}
        className="p-2 rounded-lg bg-bg-elevated border border-border-subtle hover:border-accent/50 text-text-muted hover:text-accent transition-colors"
        aria-label="Share on X (Twitter)"
      >
        <Twitter size={18} />
      </a>
      <a
        href={facebookUrl(slug)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackBlogShare({ slug, platform: "facebook" })}
        className="p-2 rounded-lg bg-bg-elevated border border-border-subtle hover:border-accent/50 text-text-muted hover:text-accent transition-colors"
        aria-label="Share on Facebook"
      >
        <Facebook size={18} />
      </a>
      <a
        href={whatsappUrl(title, slug)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackBlogShare({ slug, platform: "whatsapp" })}
        className="p-2 rounded-lg bg-bg-elevated border border-border-subtle hover:border-accent/50 text-text-muted hover:text-accent transition-colors"
        aria-label="Share on WhatsApp"
      >
        <MessageCircle size={18} />
      </a>
      <a
        href={linkedInUrl(slug)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackBlogShare({ slug, platform: "linkedin" })}
        className="p-2 rounded-lg bg-bg-elevated border border-border-subtle hover:border-accent/50 text-text-muted hover:text-accent transition-colors"
        aria-label="Share on LinkedIn"
      >
        <Linkedin size={18} />
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="p-2 rounded-lg bg-bg-elevated border border-border-subtle hover:border-accent/50 text-text-muted hover:text-accent transition-colors"
        aria-label="Copy link"
      >
        <Link2 size={18} />
      </button>
    </div>
  );
}
