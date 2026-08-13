import React, { useState } from "react";
import { X, Calendar, Clock, User, Share2, Facebook, Check, Image as ImageIcon } from "lucide-react";
import { BlogPost } from "../utils/defaultData";

interface BlogReaderModalProps {
  isOpen: boolean;
  blog: BlogPost | null;
  lang: "en" | "np";
  onClose: () => void;
}

export default function BlogReaderModal({ isOpen, blog, lang, onClose }: BlogReaderModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<string | null>(null);

  if (!isOpen || !blog) return null;

  const title = lang === "en" ? blog.titleEn : (blog.titleNp || blog.titleEn);
  const content = lang === "en" ? blog.contentEn : (blog.contentNp || blog.contentEn);
  const author = lang === "en" ? blog.authorEn : (blog.authorNp || blog.authorEn);
  const date = lang === "en" ? blog.dateEn : (blog.dateNp || blog.dateEn);
  const time = lang === "en" ? blog.timeEn : (blog.timeNp || blog.timeEn);

  // Generate shareable URL for Facebook
  const currentUrl = typeof window !== "undefined" 
    ? `${window.location.origin}${window.location.pathname}?blog=${blog.slug || blog.id}`
    : `https://amitjoshi.info.np/?blog=${blog.slug || blog.id}`;

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(title + " - Written by " + author)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Extract first letter for Editorial DropCap
  const firstLetter = content.trim().charAt(0);
  const remainingContent = content.trim().slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Container with dynamic size adjustment */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-amber-50/95 dark:bg-[#0c0d12] border border-amber-900/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-gray-900 dark:text-gray-100">
        
        {/* Modal Top Control Bar */}
        <div className="sticky top-0 z-20 px-6 py-4 bg-amber-100/90 dark:bg-black/80 border-b border-amber-900/10 dark:border-white/10 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-amber-600/20 text-amber-900 dark:text-amber-400 font-mono text-[10px] font-bold uppercase rounded-full">
              {lang === "en" ? "Editorial Journal" : "सम्पादकीय लेख"}
            </span>
            <span className="text-xs font-mono text-gray-500 hidden sm:inline">
              ID: {blog.slug || blog.id}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={fbShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
              title="Share on Facebook"
            >
              <Facebook className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share on FB</span>
            </a>

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-amber-800/10 dark:bg-white/10 hover:bg-amber-800/20 dark:hover:bg-white/20 text-xs font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
              title="Copy link"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content Body */}
        <div className="overflow-y-auto p-6 md:p-10 space-y-8 flex-1">
          
          {/* Header Metadata */}
          <div className="space-y-4 border-b border-amber-900/10 dark:border-white/10 pb-6 text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-amber-900/80 dark:text-amber-300">
              <span className="flex items-center space-x-1.5 bg-amber-500/10 px-3 py-1 rounded-full">
                <User className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>{lang === "en" ? "Written by:" : "लेखक:"} <strong>{author}</strong></span>
              </span>

              <span className="flex items-center space-x-1.5 bg-amber-500/10 px-3 py-1 rounded-full">
                <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>{date}</span>
              </span>

              {time && (
                <span className="flex items-center space-x-1.5 bg-amber-500/10 px-3 py-1 rounded-full">
                  <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{time}</span>
                </span>
              )}
            </div>
          </div>

          {/* Main Photo with dynamic auto-resize (No Cropping) */}
          {blog.mainPhoto && (
            <div className="relative w-full rounded-2xl overflow-hidden bg-black/40 border border-amber-900/10 dark:border-white/10 flex items-center justify-center p-2">
              <img 
                src={blog.mainPhoto} 
                alt={title}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          )}

          {/* Formatted Article Body */}
          <div className="prose dark:prose-invert max-w-none font-sans text-gray-800 dark:text-gray-200 text-base md:text-lg leading-relaxed space-y-4">
            <p className="whitespace-pre-line">
              <span className="editorial-dropcap">{firstLetter}</span>
              {remainingContent}
            </p>
          </div>

          {/* Additional Photos Gallery if available */}
          {blog.additionalPhotos && blog.additionalPhotos.length > 0 && (
            <div className="space-y-4 border-t border-amber-900/10 dark:border-white/10 pt-6">
              <h3 className="text-base font-serif font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <ImageIcon className="h-4 w-4 text-amber-500" />
                <span>{lang === "en" ? "Photo Gallery & Documents" : "तस्बिर ग्यालरी"}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {blog.additionalPhotos.map((photo, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setSelectedGalleryPhoto(photo)}
                    className="group relative h-40 rounded-xl overflow-hidden border border-amber-900/10 dark:border-white/10 bg-black/40 cursor-pointer"
                  >
                    <img 
                      src={photo} 
                      alt={`Gallery item ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono">
                      View Photo
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Gallery Image Full Viewer Sub-Modal */}
        {selectedGalleryPhoto && (
          <div className="absolute inset-0 z-50 bg-black/95 p-4 flex flex-col items-center justify-center">
            <button
              onClick={() => setSelectedGalleryPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={selectedGalleryPhoto} 
              alt="Full preview"
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            />
          </div>
        )}

      </div>
    </div>
  );
}
