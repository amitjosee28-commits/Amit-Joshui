import React, { useState, useEffect } from "react";
import { X, ArrowLeft, Clock, Volume2, Link, Check, Image as ImageIcon, Share2, Facebook, Twitter, Linkedin, MessageCircle } from "lucide-react";
import { BlogPost } from "../utils/defaultData";
import { formatBlogTimestamp, formatBlogLocationDate } from "../utils/date";

interface BlogReaderModalProps {
  isOpen: boolean;
  blog: BlogPost | null;
  onClose: () => void;
}

export default function BlogReaderModal({ isOpen, blog, onClose }: BlogReaderModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<string | null>(null);

  // Dynamic Open Graph & Meta Tag injection when modal is open
  useEffect(() => {
    if (!isOpen || !blog) return;

    const originalTitle = document.title;
    document.title = `${blog.titleEn} | Amit Joshi Official Blog`;

    // Inject or update Open Graph tags
    const updateMeta = (property: string, content: string) => {
      let element = document.querySelector(`meta[property='${property}']`) || document.querySelector(`meta[name='${property}']`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("property", property);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    const blogUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/blog?blog=${blog.slug || blog.id}`
      : `https://amitjoshi.info.np/blog?blog=${blog.slug || blog.id}`;

    updateMeta("og:title", blog.titleEn);
    updateMeta("og:description", blog.contentEn?.substring(0, 160) || "Official publication by Amit Joshi");
    updateMeta("og:image", blog.mainPhoto || "");
    updateMeta("og:url", blogUrl);
    updateMeta("og:type", "article");

    return () => {
      document.title = originalTitle;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, blog]);

  if (!isOpen || !blog) return null;

  const title = blog.titleEn || "Editorial Publication";
  const content = blog.contentEn || "";
  const author = blog.authorEn || "Amit Joshi";
  const rawDate = blog.dateEn || "";
  const rawTime = blog.timeEn || "";
  const timestamp = formatBlogTimestamp(rawDate, rawTime, "en");
  const dateAndLocation = formatBlogLocationDate(rawDate, "en");

  // Shareable URL
  const currentUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/blog?blog=${blog.slug || blog.id}`
    : `https://amitjoshi.info.np/blog?blog=${blog.slug || blog.id}`;

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + currentUrl)}`;

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
      const cleanText = content.replace(/[#*`_\[\]()]/g, '');
      const utterance = new SpeechSynthesisUtterance(`${title}. ${cleanText}`);
      utterance.lang = "en-US";
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleModalClose = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100">
        
        {/* Modal Top Nav Bar */}
        <div className="sticky top-0 z-20 px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md flex items-center justify-between">
          <button
            onClick={handleModalClose}
            className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>&larr; Back to Articles</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-500 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
            </button>
            <button
              onClick={handleModalClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto p-6 md:p-10 space-y-8 flex-1">
          
          {/* Main Title & Social Bar */}
          <div className="space-y-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
            <div className="flex items-center space-x-3 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
              <span>Editorial Journal</span>
              <span>&bull;</span>
              <div className="flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{timestamp}</span>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h1>

            {/* Social Sharing & Audio Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              {/* Listen Button */}
              <button
                onClick={handleListenToggle}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold inline-flex items-center space-x-2 transition-all shadow-sm cursor-pointer ${
                  isSpeaking 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-500/30"
                }`}
              >
                <Volume2 className="h-4 w-4" />
                <span>{isSpeaking ? "Pause Audio Reader" : "Listen to Article"}</span>
              </button>

              {/* Social Share Icons */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold uppercase text-slate-400 dark:text-slate-500 mr-1">
                  Share:
                </span>
                <a
                  href={fbShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#1877F2] text-slate-600 dark:text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href={twitterShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-black text-slate-600 dark:text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Twitter / X"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href={linkedinShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#0A66C2] text-slate-600 dark:text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#25D366] text-slate-600 dark:text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Author & Publication Byline */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 dark:text-white">Author:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{author}</span>
            </div>
            <div>
              <span>{dateAndLocation.location}</span>
            </div>
          </div>

          {/* Featured Image */}
          {blog.mainPhoto && (
            <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 max-h-[480px]">
              <img 
                src={blog.mainPhoto} 
                alt={title} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Article Body */}
          <div className="prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed space-y-4 font-sans text-slate-700 dark:text-slate-300">
            {content.split('\n\n').map((para, i) => (
              <p key={i} className="leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* Additional Photos / Gallery */}
          {blog.additionalPhotos && blog.additionalPhotos.length > 0 && (
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                <ImageIcon className="h-4 w-4 text-amber-500" />
                <span>Gallery & Documented Artifacts</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {blog.additionalPhotos.map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedGalleryPhoto(photo)}
                    className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 shadow-sm"
                  >
                    <img
                      src={photo}
                      alt={`Artifact ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedGalleryPhoto && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedGalleryPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedGalleryPhoto} 
              alt="Expanded view" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
            />
            <button
              onClick={() => setSelectedGalleryPhoto(null)}
              className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
