"use client";

import { useEffect, useRef, useState } from "react";

export type SearchResult = {
  id: string;
  type: "client" | "poster" | "page";
  label: string;
  href: string;
};

type SearchPaletteProps = {
  open: boolean;
  onClose: () => void;
  onSelect?: (result: SearchResult) => void;
};

export function SearchPalette({ open, onClose, onSelect }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    inputRef.current?.focus();
    const handle = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([
        { id: "p1", type: "page", label: "Overview", href: "/studio" },
        { id: "p2", type: "page", label: "Clients", href: "/studio/clients" },
        { id: "p3", type: "page", label: "Generate", href: "/studio/create" },
        { id: "p4", type: "page", label: "Posters", href: "/studio/posters" },
        { id: "p5", type: "page", label: "Usage", href: "/studio/usage" },
        { id: "p6", type: "page", label: "Team", href: "/studio/team" },
        { id: "p7", type: "page", label: "Settings", href: "/studio/settings" },
      ]);
      return;
    }
    fetch(`/api/studio/clients?status=active`)
      .then((r) => (r.ok ? r.json() : { clients: [] }))
      .then((d) => {
        const clients = (d.clients ?? []).slice(0, 5).map((c: { id: string; clientName: string }) => ({
          id: c.id,
          type: "client" as const,
          label: c.clientName,
          href: `/studio/clients/${c.id}`,
        }));
        const q = query.toLowerCase();
        const fromClients = clients.filter((c: SearchResult) =>
          c.label.toLowerCase().includes(q)
        );
        setResults(fromClients.length ? fromClients : [{ id: "none", type: "page", label: `No results for "${query}"`, href: "#" }]);
      })
      .catch(() => setResults([]));
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-center pt-20 bg-black/80 backdrop-blur-[4px]">
      <div
        className="w-full max-w-[560px] rounded-xl bg-[#111111] border border-[#ffffff12] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center h-[52px] px-4 border-b border-[#ffffff08]">
          <svg
            className="w-[18px] h-[18px] text-[#71717a] shrink-0 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search clients, posters, settings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[16px] text-[#fafafa] placeholder:text-[#71717a] focus:outline-none"
          />
          <kbd className="text-[10px] px-2 py-1 rounded bg-[#ffffff08] text-[#71717a]">esc</kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {results.map((r) => (
            <a
              key={r.id}
              href={r.href}
              onClick={(e) => {
                e.preventDefault();
                onSelect?.(r);
                onClose();
              }}
              className="flex items-center gap-3 h-11 px-4 hover:bg-[#E8FF4708] active:bg-[#E8FF4712] transition-colors"
            >
              <span className="text-[13px] text-[#fafafa]">{r.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
