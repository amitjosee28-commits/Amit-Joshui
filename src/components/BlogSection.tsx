import React, { useState } from "react";
import { BookOpen, Clock, ChevronRight, Sparkles } from "lucide-react";
import { BlogPost } from "../utils/defaultData";
import { formatBlogTimestamp } from "../utils/date";

interface BlogSectionProps {
  blogs: BlogPost[];
  onOpenBlogModal: (blog: BlogPost) => void;
  isArchivePage?: boolean;
}

export default function BlogSection({ blogs, onOpenBlogModal, isArchivePage = false }: BlogSectionProps) {
  const [visibleCount, setVisibleCount] = useState(12);

  if (!blogs || blogs.length === 0) {
    return (
      <section id="blog-section" className="py-16 relative border-t border-slate-200/60 dark:border-white/5 scroll-mt-24">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <div className="p-8 bg-white/5 border border-white/10 rounded-2xl max-w-md mx-auto">
            <BookOpen className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Editorial Articles & News</h3>
            <p className="text-xs text-gray-400 mt-1">Articles and tech publications are currently being curated.</p>
          </div>
        </div>
      </section>
    );
  }

  const visibleBlogs = blogs.slice(0, visibleCount);
  const hasMore = blogs.length > visibleCount;

  return (
    <section id="blog-section" className="py-20 relative border-t border-slate-200/60 dark:border-white/5 scroll-mt-24">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 mb-3">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">
              {isArchivePage ? "Complete Archive" : "Articles & Publications"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isArchivePage ? "Editorial Publications & Journal Archive" : "Latest Editorial Journal & Articles"}
          </h2>
          <p className="text-slate-600 dark:text-gray-400 mt-2 max-w-xl mx-auto text-sm">
            In-depth perspectives, tech-governance analysis, software architecture, and public policy journals.
          </p>
        </div>

        {/* 4x3 Grid (4 columns wide on desktop, 3 rows deep = 12 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleBlogs.map((blog) => {
            const title = blog.titleEn || "Editorial Publication";
            const content = blog.contentEn || "";
            const rawDate = blog.dateEn || "";
            const rawTime = blog.timeEn || "";
            const timestamp = formatBlogTimestamp(rawDate, rawTime, "en");
            const cleanExcerpt = content.replace(/[#*`_\[\]()]/g, '').trim();

            return (
              <div 
                key={blog.id}
                onClick={() => onOpenBlogModal(blog)}
                className="group cursor-pointer bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-xl hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all duration-300 overflow-hidden flex flex-col justify-between transform hover:-translate-y-1"
              >
                <div>
                  {/* Card Top Featured Image */}
                  <div className="relative w-full aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-t-2xl">
                    <img 
                      src={blog.mainPhoto || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80"} 
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-t-2xl"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-amber-400 border border-white/10">
                      Editorial
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2">
                    {/* Timestamp */}
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono flex items-center space-x-1.5">
                      <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                      <span>{timestamp}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {cleanExcerpt || "Read the full publication for in-depth insights and strategic engineering perspectives."}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-black/20">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                    {blog.authorEn || "Amit Joshi"}
                  </span>
                  <span className="inline-flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-1 transition-transform text-[11px] uppercase tracking-wider">
                    <span>Read Article</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination / Load More */}
        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold uppercase tracking-wider text-xs shadow-md hover:shadow-xl transition-all active:scale-95 cursor-pointer inline-flex items-center space-x-2"
            >
              <span>Load More Articles ({blogs.length - visibleCount} Remaining)</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
