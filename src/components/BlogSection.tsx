import React, { useState } from "react";
import { BookOpen, Calendar, Clock, ChevronRight } from "lucide-react";
import { BlogPost } from "../utils/defaultData";
import { formatBlogTimestamp } from "../utils/date";

interface BlogSectionProps {
  lang: "en" | "np";
  blogs: BlogPost[];
  onOpenBlogModal: (blog: BlogPost) => void;
}

export default function BlogSection({ lang, blogs, onOpenBlogModal }: BlogSectionProps) {
  const [showAll, setShowAll] = useState(false);

  if (!blogs || blogs.length === 0) return null;

  const visibleBlogs = showAll ? blogs : blogs.slice(0, 6);

  return (
    <section id="blog-section" className="py-20 relative border-t border-slate-200/60 dark:border-white/5 scroll-mt-24">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 mb-3">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">
              {lang === "en" ? "Articles & News" : "सामग्री र लेखहरू"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {lang === "en" ? "Latest Editorial Journal & Publications" : "सम्पादकीय लेख र प्रकाशनहरू"}
          </h2>
          <p className="text-slate-600 dark:text-gray-400 mt-2 max-w-xl mx-auto text-sm">
            {lang === "en" 
              ? "In-depth perspectives, tech-governance analysis, and localized web engineering journals."
              : "गहन दृष्टिकोण, प्रविधि-शासन विश्लेषण, र स्थानीयकृत वेब इन्जिनियरिङ जर्नलहरू।"}
          </p>
        </div>

        {/* 3 Columns Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleBlogs.map((blog) => {
            const title = lang === "en" ? blog.titleEn : (blog.titleNp || blog.titleEn);
            const content = lang === "en" ? blog.contentEn : (blog.contentNp || blog.contentEn);
            const rawDate = lang === "en" ? blog.dateEn : (blog.dateNp || blog.dateEn);
            const rawTime = lang === "en" ? blog.timeEn : (blog.timeNp || blog.timeEn);
            const timestamp = formatBlogTimestamp(rawDate, rawTime, lang);
            const cleanExcerpt = content.replace(/[#*`_]/g, '').trim();

            return (
              <div 
                key={blog.id}
                onClick={() => onOpenBlogModal(blog)}
                className="group cursor-pointer bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
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
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-2">
                    {/* Title */}
                    <h3 className="font-bold text-slate-900 dark:text-white text-base md:text-lg line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {title}
                    </h3>

                    {/* Timestamp */}
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-mono flex items-center space-x-1.5 pt-0.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>{timestamp}</span>
                    </div>

                    {/* Excerpt / Snippet */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {cleanExcerpt}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {lang === "en" ? "Article" : "लेख"}
                  </span>
                  <span className="inline-flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
                    <span>{lang === "en" ? "Read Full" : "पढ्नुहोस्"}</span>
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Read More Posts / Toggle */}
        {blogs.length > 6 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold uppercase tracking-wider text-xs shadow-md hover:shadow-xl transition-all active:scale-95 cursor-pointer inline-flex items-center space-x-2"
            >
              <span>{showAll ? (lang === "en" ? "Show Fewer Posts" : "कम पोस्टहरू देखाउनुहोस्") : (lang === "en" ? `View All Articles (${blogs.length - 6} More)` : `सबै लेखहरू हेर्नुहोस् (${blogs.length - 6} थप)`)}</span>
              <ChevronRight className={`h-4 w-4 transform transition-transform ${showAll ? "rotate-90" : ""}`} />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}

