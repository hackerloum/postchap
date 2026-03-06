"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomTabBar } from "./BottomTabBar";
import { MobileMoreSheet } from "./MobileMoreSheet";
import { Toaster } from "@/components/studio/ui";
import { SearchPalette } from "@/components/studio/shared";

function useTablet() {
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    setIsTablet(mq.matches);
    const h = () => setIsTablet(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return isTablet;
}

type StudioLayoutProps = {
  children: React.ReactNode;
  primaryAction?: "add-client" | "generate" | "invite" | null;
};

export function StudioLayout({ children, primaryAction = "generate" }: StudioLayoutProps) {
  const isTablet = useTablet();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const sidebarCollapsed = isTablet && !sidebarExpanded;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="studio-theme min-h-screen bg-[#080808]">
      {isTablet && sidebarExpanded && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarExpanded(false)}
          aria-hidden
        />
      )}
      <Sidebar
        collapsed={sidebarCollapsed}
        onExpand={() => setSidebarExpanded(true)}
        onCollapse={() => setSidebarExpanded(false)}
      />
      <div
        className="relative z-10 flex flex-col min-h-screen md:pl-[56px] lg:pl-[232px]"
      >
        <TopBar primaryAction={primaryAction} onSearchClick={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto pt-0 pb-20 md:pb-8 px-4 md:px-8 lg:px-8">
          <div className="max-w-[1400px] mx-auto py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
      <BottomTabBar onOpenMore={() => setMoreOpen(true)} />
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toaster theme="dark" toastOptions={{ style: { background: "#111111", border: "1px solid #ffffff0f", color: "#fafafa" } }} />
    </div>
  );
}
