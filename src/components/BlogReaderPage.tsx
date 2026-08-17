import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Clock, 
  Volume2, 
  VolumeX,
  Link, 
  Check, 
  Image as ImageIcon, 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle,
  Newspaper,
  FileText,
  Music,
  BookMarked,
  Scroll,
  BookOpen,
  User
} from "lucide-react";
import { BlogPost, BlogType } from "../utils/defaultData";
import { formatBlogTimestamp, formatBlogLocationDate } from "../utils/date";
import BlogContentRenderer from "./BlogContentRenderer";

interface BlogReaderPageProps {
  blog: BlogPost;
  allBlogs?: BlogPost[];
  onNavigateBack: () => void;
  onSelectBlog?: (blog: BlogPost) => void;
  lang?: "en" | "np";
}

const TYPE_CONFIG: Record<string, { labelEn: string; labelNp: string; icon: any; color: string; bg: string }> = {
  news: { labelEn: "News", labelNp: "समाचार", icon: Newspaper, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  article: { labelEn: "Article", labelNp: "लेख", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  song: { labelEn: "Song", labelNp: "गीत", icon: Music, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
  story: { labelEn: "Story", labelNp: "कथा", icon: BookMarked, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  poem: { labelEn: "Poem", labelNp: "कविता", icon: Scroll, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30" }
};

export default function BlogReaderPage({
  blog,
  allBlogs = [],
  onNavigateBack,
  onSelectBlog,
  lang = "en"
}: BlogReaderPageProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<string | null>(null);

  const title = (lang === "np" ? blog.titleNp || blog.titleEn : blog.titleEn) || "Editorial Publication";
  const content = (lang === "np" ? blog.contentNp || blog.contentEn : blog.contentEn) || "";
  const author = (lang === "np" ? blog.authorNp || blog.authorEn : blog.authorEn) || "Amit Joshi";
  const rawDate = (lang === "np" ? blog.dateNp || blog.dateEn : blog.dateEn) || "";
  const rawTime = (lang === "np" ? blog.timeNp || blog.timeEn : blog.timeEn) || "";
  const timestamp = formatBlogTimestamp(rawDate, rawTime);
  const dateAndLocation = formatBlogLocationDate(rawDate);

  const blogType = blog.type || "article";
  const typeMeta = TYPE_CONFIG[blogType] || TYPE_CONFIG.article;
  const TypeIcon = typeMeta.icon;

  const currentUrl = typeof window !== "undefined"
    ? `${window.location.origin}/blog/${blog.slug || blog.id}`
    : `https://amitjoshi.info.np/blog/${blog.slug || blog.id}`;

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + currentUrl)}`;

  // Set document title and meta tags
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${title} | Amit Joshi Official Portal`;

    return () => {
      document.title = originalTitle;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [title]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleListenToggle = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = content.replace(/[#*`_\[\]()]/g, "");
      const utterance = new SpeechSynthesisUtterance(`${title}. ${cleanText}`);
      utterance.lang = lang === "np" ? "hi-IN" : "en-US";
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Related blogs
  const relatedBlogs = allBlogs
    .filter((b) => b.id !== blog.id)
    .slice(0, 3);

  return (
    <div id="blog-reader-page" className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Top Header & Navigation */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-gray-400 hover:text-amber-400 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>{lang === "np" ? "ब्लग सूचीमा फर्कनुहोस्" : "Back to Articles"}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/5 border border-white/10 hover:border-amber-500/40 text-gray-300 hover:text-white transition-all inline-flex items-center space-x-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Copied" : "Share Link"}</span>
            </button>
          </div>
        </div>

        {/* Article Meta Bar */}
        <div className="space-y-6">
          
          <div className="flex flex-wrap items-center gap-3">
            <div className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border backdrop-blur-md flex items-center space-x-1.5 ${typeMeta.bg} ${typeMeta.color}`}>
              <TypeIcon className="h-3.5 w-3.5" />
              <span>{lang === "np" ? typeMeta.labelNp : typeMeta.labelEn}</span>
            </div>

            <div className="flex items-center space-x-1 text-xs font-mono text-gray-400">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>{timestamp}</span>
            </div>

            {dateAndLocation && (
              <span className="text-xs font-mono text-gray-500">
                &bull; {dateAndLocation}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight leading-tight font-serif">
            {title}
          </h1>

          {/* Author & Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-white/10">
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{author}</p>
                <p className="text-xs font-mono text-gray-400">Architect & Author</p>
              </div>
            </div>

            {/* Social Share Icons & Audio */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleListenToggle}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isSpeaking
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30 animate-pulse"
                    : "bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white"
                }`}
              >
                {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                <span>{isSpeaking ? "Pause Audio" : "Listen"}</span>
              </button>

              <a
                href={fbShareUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/5 hover:bg-blue-600/30 border border-white/10 hover:border-blue-500/50 text-gray-300 hover:text-blue-400 transition-colors"
                title="Share on Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>

              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/5 hover:bg-cyan-600/30 border border-white/10 hover:border-cyan-500/50 text-gray-300 hover:text-cyan-400 transition-colors"
                title="Share on Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>

              <a
                href={linkedinShareUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/5 hover:bg-blue-700/30 border border-white/10 hover:border-blue-400/50 text-gray-300 hover:text-blue-400 transition-colors"
                title="Share on LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>

              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/5 hover:bg-emerald-600/30 border border-white/10 hover:border-emerald-500/50 text-gray-300 hover:text-emerald-400 transition-colors"
                title="Share via WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>

          </div>
        </div>

        {/* Featured Main Image */}
        {blog.mainPhoto && (
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl">
            <img
              src={blog.mainPhoto}
              alt={title}
              className="w-full max-h-[520px] object-cover"
            />
          </div>
        )}

        {/* Main Content Body - Exactly preserving user formatting, newlines, blank lines, and structure */}
        <div className="text-gray-300 text-base md:text-lg leading-relaxed font-sans">
          <BlogContentRenderer content={content} />
        </div>

        {/* Additional Photos / Artifacts Gallery */}
        {blog.additionalPhotos && blog.additionalPhotos.length > 0 && (
          <div className="pt-8 border-t border-white/10 space-y-4">
            <div className="flex items-center space-x-2 text-sm font-mono font-bold text-amber-400 uppercase tracking-wider">
              <ImageIcon className="h-4 w-4" />
              <span>{lang === "np" ? "अतिरिक्त तस्विरहरू र संलग्नकहरू" : "Gallery Artifacts & Visuals"}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {blog.additionalPhotos.map((photo, pIdx) => (
                <div
                  key={pIdx}
                  onClick={() => setSelectedGalleryPhoto(photo)}
                  className="group relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-slate-900 cursor-pointer hover:border-amber-500/50 transition-all"
                >
                  <img
                    src={photo}
                    alt={`Artifact ${pIdx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono">
                    View Fullscreen
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fullscreen Photo Lightbox */}
        {selectedGalleryPhoto && (
          <div
            onClick={() => setSelectedGalleryPhoto(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 flex items-center justify-center cursor-pointer"
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={selectedGalleryPhoto}
                alt="Fullscreen View"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              />
              <p className="text-center text-xs font-mono text-gray-400 mt-2">Click anywhere to close</p>
            </div>
          </div>
        )}

        {/* Related Articles */}
        {relatedBlogs.length > 0 && (
          <div className="pt-12 border-t border-white/10 space-y-6">
            <h3 className="text-xl font-bold text-white font-serif flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-amber-400" />
              <span>{lang === "np" ? "सम्बन्धित लेखहरू" : "More From Editorial"}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedBlogs.map((rel) => {
                const relTitle = (lang === "np" ? rel.titleNp || rel.titleEn : rel.titleEn) || "Related Post";
                return (
                  <div
                    key={rel.id}
                    onClick={() => {
                      if (onSelectBlog) onSelectBlog(rel);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="group cursor-pointer p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-amber-500/30 transition-all space-y-2"
                  >
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                      {relTitle}
                    </h4>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {(rel.contentEn || "").replace(/[#*`_\[\]()]/g, "")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
