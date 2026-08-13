import React, { useState } from "react";
import { BookOpen, Calendar, Clock, User, Share2, Eye, X, ChevronRight, MessageCircle } from "lucide-react";
import { BlogPost } from "../utils/defaultData";

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
    <section id="blog-section" className="py-20 relative border-t border-amber-900/10 dark:border-white/5 scroll-mt-24">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 mb-3">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">
              {lang === "en" ? "Articles & Insights" : "सामग्री र लेखहरू"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white tracking-tight">
            {lang === "en" ? "Editorial Journal & Publications" : "सम्पादकीय जर्नल र प्रकाशनहरू"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-xl mx-auto text-sm">
            {lang === "en" 
              ? "In-depth perspectives, analytical blogs, and tech-governance documentation."
              : "गहन दृष्टिकोण, विश्लेषणात्मक ब्लगहरू, र प्रविधि-शासन कागजातहरू।"}
          </p>
        </div>

        {/* 2 Boxes Per Row Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {visibleBlogs.map((blog) => {
            const title = lang === "en" ? blog.titleEn : (blog.titleNp || blog.titleEn);
            const content = lang === "en" ? blog.contentEn : (blog.contentNp || blog.contentEn);
            const author = lang === "en" ? blog.authorEn : (blog.authorNp || blog.authorEn);
            const date = lang === "en" ? blog.dateEn : (blog.dateNp || blog.dateEn);
            const time = lang === "en" ? blog.timeEn : (blog.timeNp || blog.timeEn);

            return (
              <div 
                key={blog.id}
                onClick={() => onOpenBlogModal(blog)}
                className="group cursor-pointer bg-amber-500/5 dark:bg-white/[0.02] border border-amber-900/10 dark:border-white/10 rounded-2xl overflow-hidden hover:border-amber-600/40 dark:hover:border-amber-400/40 transition-all duration-300 shadow-md hover:shadow-2xl flex flex-col justify-between"
              >
                <div>
                  {/* Photo Thumbnail */}
                  <div className="relative h-60 w-full overflow-hidden bg-black/40">
                    <img 
                      src={blog.mainPhoto || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80"} 
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute top-3 left-3 bg-amber-600/90 text-black text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md backdrop-blur-sm">
                      {lang === "en" ? "Article" : "लेख"}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-amber-200/90 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                        {date}
                      </span>
                      {time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          {time}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-6 space-y-3">
                    <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                      {title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-3 leading-relaxed">
                      {content.replace(/[#*`_]/g, '')}
                    </p>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="px-6 pb-6 pt-2 border-t border-amber-900/5 dark:border-white/5 flex items-center justify-between text-xs font-mono text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1.5">
                    <User className="h-3.5 w-3.5 text-amber-500" />
                    <span>{lang === "en" ? "Written by:" : "लेखक:"} <strong className="text-gray-800 dark:text-gray-200">{author}</strong></span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-amber-700 dark:text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
                    <span>{lang === "en" ? "Read Full Post" : "पूर्ण पढ्नुहोस्"}</span>
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Read More Posts Toggle */}
        {blogs.length > 6 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase tracking-wider text-xs shadow-lg transition-all active:scale-95 cursor-pointer inline-flex items-center space-x-2"
            >
              <span>{showAll ? (lang === "en" ? "Show Fewer Posts" : "कम पोस्टहरू देखाउनुहोस्") : (lang === "en" ? `Read More Posts (${blogs.length - 6} More)` : `थप पोस्टहरू पढ्नुहोस् (${blogs.length - 6} थप)`)}</span>
              <ChevronRight className={`h-4 w-4 transform transition-transform ${showAll ? "rotate-90" : ""}`} />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
