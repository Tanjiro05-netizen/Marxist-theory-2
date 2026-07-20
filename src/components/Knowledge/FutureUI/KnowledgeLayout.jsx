import React from 'react';
import { Search, Zap } from 'lucide-react';
import Link from 'next/link';

const KnowledgeLayout = ({ children, sidebar, widgets, searchQuery = '', onSearchChange }) => {
  return (
    <div className="min-h-screen bg-[#090909] text-white font-[Hanken_Grotesk,sans-serif] selection:bg-[rgba(200,30,30,0.3)] selection:text-white">

      {/* --- Action Toolbar (Sub-Header) --- */}
      <div className="sticky top-16 z-40 bg-[#090909]/95 backdrop-blur border-b border-white/[0.06] py-2.5 mb-6 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        <div className="w-full max-w-[1380px] mx-auto px-4 md:px-6 flex items-center justify-between gap-3 md:gap-4">

          {/* Eyebrow / Breadcrumb */}
          <div className="hidden md:flex flex-col shrink-0">
            <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.16em] text-[#c81e1e] opacity-70">
              Knowledge Q&amp;A
            </span>
            <span className="text-[11px] text-white/40 leading-none mt-0.5">Community knowledge base</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange?.(e.target.value)}
              placeholder="Search questions and answers..."
              className="w-full bg-[#0f0f0f] border border-white/[0.06] rounded-xl px-4 py-2 pl-9 text-xs focus:outline-none focus:border-[rgba(200,30,30,0.4)] transition-all duration-200 text-white/80 placeholder-white/25 font-[Hanken_Grotesk,sans-serif]"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/25 group-focus-within:text-[#c81e1e] transition-colors" />
          </div>

          {/* Ask Question CTA */}
          <Link href="/knowledge/ask"
            className="flex items-center gap-2 bg-[#c81e1e] hover:bg-[#e02424] text-white px-4 md:px-5 py-2 rounded-xl text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] shadow-[0_0_20px_rgba(200,30,30,0.22)] transition-all hover:shadow-[0_0_28px_rgba(200,30,30,0.38)] shrink-0"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask Question</span>
          </Link>
        </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="w-full max-w-[1380px] mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 pb-16 items-start">

        {/* Left Sidebar */}
        <div className="hidden md:block md:col-span-3 xl:col-span-2 sticky top-36 h-fit space-y-3">
          {sidebar}
        </div>

        {/* Center Feed */}
        <main className="md:col-span-9 xl:col-span-7 min-h-0 space-y-4">
          {children}
        </main>

        {/* Right Widgets */}
        <aside className="hidden xl:block xl:col-span-3 space-y-4 sticky top-36 h-fit">
          {widgets}
        </aside>
      </div>

      {/* Mobile FAB */}
      <Link href="/knowledge/ask"
        className="md:hidden fixed bottom-6 right-6 bg-[#c81e1e] hover:bg-[#e02424] text-white p-4 rounded-full shadow-[0_4px_24px_rgba(200,30,30,0.4)] z-50 transition-all hover:scale-105"
      >
        <Zap className="w-5 h-5" />
      </Link>
    </div>
  );
};

export default KnowledgeLayout;
