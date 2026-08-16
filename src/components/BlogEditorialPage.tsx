import React, { useState, useMemo } from "react";
import { 
  BookOpen, 
  Search, 
  Clock, 
  ChevronRight, 
  ArrowLeft, 
  Newspaper, 
  FileText, 
  Music, 
  BookMarked, 
  Scroll, 
  Filter,
  Sparkles
} from "lucide-react";
import { BlogPost, BlogType } from "../utils/defaultData";
import { formatBlogTimestamp } from "../utils/date";

interface BlogEditorialPageProps {
  blogs: BlogPost[];
  onSelectBlog: (blog: BlogPost) => void;
  onNavigateHome: () => void;
  lang?: "en" | "np";
}

const TYPE_CONFIG: Record<string, { labelEn: string; labelNp: string; icon: any; color: string; bg: string }> = {
  news: { labelEn: "News", labelNp: "समाचार", icon: Newspaper, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  article: { labelEn: "Article", labelNp: "लेख", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  song: { labelEn: "Song", labelNp: "गीत", icon: Music, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
  story: { labelEn: "Story", labelNp: "कथा", icon: BookMarked, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  poem: { labelEn: "Poem", labelNp: "कविता", icon: Scroll, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30" }
};

export default function BlogEditorialPage({
  blogs,
  onSelectBlog,
  onNavigateHome,
  lang = "en"
}: BlogEditorialPageProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchType = selectedType === "all" || (b.type || "article") === selectedType;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.titleEn?.toLowerCase().includes(q) ||
        b.titleNp?.toLowerCase().includes(q) ||
        b.contentEn?.toLowerCase().includes(q) ||
        b.contentNp?.toLowerCase().includes(q) ||
        b.authorEn?.toLowerCase().includes(q) ||
        b.authorNp?.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [blogs, selectedType, searchQuery]);

  const categories = [
    { id: "all", labelEn: "All Posts", labelNp: "सबै रचनाहरू", icon: Sparkles },
    { id: "news", labelEn: "News", labelNp: "समाचार", icon: Newspaper },
    { id: "article", labelEn: "Articles", labelNp: "लेखहरू", icon: FileText },
    { id: "song", labelEn: "Songs", labelNp: "गीतहरू", icon: Music },
    { id: "story", labelEn: "Stories", labelNp: "कथाहरू", icon: BookMarked },
    { id: "poem", labelEn: "Poems", labelNp: "कविताहरू", icon: Scroll }
  ];

  const visibleBlogs = filteredBlogs.slice(0, visibleCount);
  const hasMore = filteredBlogs.length > visibleCount;

  return (
    <div id="blog-editorial-page" className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-gray-400 hover:text-amber-400 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>{lang === "np" ? "मुख्य पृष्ठमा फर्कनुहोस्" : "Back to Home Portal"}</span>
          </button>

          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400">
              {filteredBlogs.length} {lang === "np" ? "प्रकाशनहरू उपलब्ध" : "Publications Available"}
            </span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">
              {lang === "np" ? "सम्पादकीय र ब्लग अभिलेख" : "Editorial & Publication Archive"}
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-serif">
            {lang === "np" ? "विचार, प्रविधि, साहित्य र विश्लेषण" : "Insights, Tech, Literature & Analysis"}
          </h1>
          
          <p className="text-sm md:text-base text-gray-400 leading-relaxed">
            {lang === "np"
              ? "अमित जोशीका प्राविधिक लेखहरू, समाचार, कविताहरू, गीत र कथाहरूको आधिकारिक संग्रह।"
              : "Explore official publications spanning software architecture, news updates, poetry, lyrics, and analytical essays."}
          </p>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-xl space-y-4">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(12);
              }}
              placeholder={lang === "np" ? "शीर्षक, लेखक वा सामग्री खोज्नुहोस्..." : "Search by title, topic, author or keywords..."}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-sm text-white placeholder-gray-500 outline-none transition-all"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="h-3.5 w-3.5 text-gray-500 shrink-0 ml-1 mr-1" />
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedType === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedType(cat.id);
                    setVisibleCount(12);
                  }}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                      : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{lang === "np" ? cat.labelNp : cat.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Blog Grid */}
        {visibleBlogs.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-4">
            <BookOpen className="h-10 w-10 text-gray-600 mx-auto" />
            <h3 className="text-lg font-bold text-white font-serif">
              {lang === "np" ? "कुनै प्रकाशन भेटिएन" : "No Publications Found"}
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {lang === "np"
                ? "कृपया अर्को खोज शब्द वा विधा चयन गर्नुहोस्।"
                : "Try adjusting your search criteria or choosing a different category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleBlogs.map((blog) => {
              const title = (lang === "np" ? blog.titleNp || blog.titleEn : blog.titleEn) || "Editorial Post";
              const content = (lang === "np" ? blog.contentNp || blog.contentEn : blog.contentEn) || "";
              const rawDate = (lang === "np" ? blog.dateNp || blog.dateEn : blog.dateEn) || "";
              const rawTime = (lang === "np" ? blog.timeNp || blog.timeEn : blog.timeEn) || "";
              const timestamp = formatBlogTimestamp(rawDate, rawTime);
              const cleanExcerpt = content.replace(/[#*`_\[\]()]/g, '').trim();

              const blogType = blog.type || "article";
              const typeMeta = TYPE_CONFIG[blogType] || TYPE_CONFIG.article;
              const TypeIcon = typeMeta.icon;

              return (
                <div
                  key={blog.id}
                  id={`blog-card-${blog.id}`}
                  onClick={() => onSelectBlog(blog)}
                  className="group cursor-pointer bg-slate-900/90 border border-white/10 hover:border-amber-500/50 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 overflow-hidden flex flex-col justify-between transform hover:-translate-y-1"
                >
                  <div>
                    {/* Featured Image */}
                    <div className="relative w-full aspect-video overflow-hidden bg-slate-800 rounded-t-2xl">
                      <img
                        src={blog.mainPhoto || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80"}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-t-2xl"
                        loading="lazy"
                      />
                      
                      {/* Type Badge */}
                      <div className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border backdrop-blur-md flex items-center space-x-1 ${typeMeta.bg} ${typeMeta.color}`}>
                        <TypeIcon className="h-3 w-3" />
                        <span>{lang === "np" ? typeMeta.labelNp : typeMeta.labelEn}</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-2">
                      <div className="text-[11px] text-gray-500 font-mono flex items-center space-x-1.5">
                        <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                        <span>{timestamp}</span>
                      </div>

                      <h3 className="font-bold text-white text-sm md:text-base line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors font-serif">
                        {title}
                      </h3>

                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                        {cleanExcerpt || "Read the full publication for details."}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-gray-400 bg-black/20">
                    <span className="text-[11px] font-semibold text-gray-500 truncate max-w-[120px]">
                      {(lang === "np" ? blog.authorNp : blog.authorEn) || "Amit Joshi"}
                    </span>
                    <span className="inline-flex items-center space-x-1 text-amber-400 font-bold group-hover:translate-x-1 transition-transform text-[11px] uppercase tracking-wider">
                      <span>{lang === "np" ? "पढ्नुहोस्" : "Read"}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center pt-6">
            <button
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer inline-flex items-center space-x-2"
            >
              <span>{lang === "np" ? "थप रचनाहरू हेर्नुहोस्" : "Load More Publications"}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
