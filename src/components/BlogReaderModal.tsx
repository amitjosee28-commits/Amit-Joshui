import React, { useState, useEffect } from "react";
import { X, ArrowLeft, Calendar, MapPin, Volume2, Link, Check, Image as ImageIcon } from "lucide-react";
import { BlogPost } from "../utils/defaultData";
import { formatBlogLocationDate } from "../utils/date";

interface BlogReaderModalProps {
  isOpen: boolean;
  blog: BlogPost | null;
  lang: "en" | "np";
  onClose: () => void;
}

export default function BlogReaderModal({ isOpen, blog, lang, onClose }: BlogReaderModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<string | null>(null);

  // Stop speech synthesis on unmount or blog change
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [blog]);

  if (!isOpen || !blog) return null;

  const title = lang === "en" ? blog.titleEn : (blog.titleNp || blog.titleEn);
  const content = lang === "en" ? blog.contentEn : (blog.contentNp || blog.contentEn);
  const author = lang === "en" ? blog.authorEn : (blog.authorNp || blog.authorEn);
  const rawDate = lang === "en" ? blog.dateEn : (blog.dateNp || blog.dateEn);
  const dateAndLocation = formatBlogLocationDate(rawDate, lang);

  // Shareable URL
  const currentUrl = typeof window !== "undefined" 
    ? `${window.location.origin}${window.location.pathname}?blog=${blog.slug || blog.id}`
    : `https://amitjoshi.info.np/?blog=${blog.slug || blog.id}`;

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + currentUrl)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`;

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
      const cleanText = content.replace(/[#*`_]/g, '');
      const utterance = new SpeechSynthesisUtterance(`${title}. ${cleanText}`);
      utterance.lang = lang === "np" ? "ne-NP" : "en-US";
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
            <span>{lang === "en" ? "< Back to Articles" : "< सामग्री र लेखहरू"}</span>
          </button>

          <button
            onClick={handleModalClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto p-6 md:p-10 space-y-8 flex-1">
          
          {/* Main Title & Social Bar */}
          <div className="space-y-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h1>

            {/* Social Sharing & Audio Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Listen Button */}
              <button
                onClick={handleListenToggle}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold inline-flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer ${
                  isSpeaking 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-500/30"
                }`}
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>{isSpeaking ? (lang === "en" ? "Pause" : "रोक्नुहोस्") : (lang === "en" ? "Listen" : "सुन्नुहोस्")}</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

              <span className="text-xs font-mono font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                SHARE:
              </span>

              {/* Facebook */}
              <a
                href={fbShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white transition-colors cursor-pointer"
                title="Facebook"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* X / Twitter */}
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-colors cursor-pointer"
                title="X (Twitter)"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href={linkedinShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-[#0A66C2]/10 hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white transition-colors cursor-pointer"
                title="LinkedIn"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-colors cursor-pointer"
                title="WhatsApp"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                </svg>
              </a>

              {/* Telegram */}
              <a
                href={telegramShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-[#229ED9]/10 hover:bg-[#229ED9] text-[#229ED9] hover:text-white transition-colors cursor-pointer"
                title="Telegram"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.536-.196 1.006.128.832.942z"/>
                </svg>
              </a>

              {/* Copy Link Button */}
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Copy Article Link"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link className="h-3.5 w-3.5 text-slate-500" />}
                <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* Two-Column Desktop Body & Media Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Side: Metadata & Full Rich Body Content */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Date & Location Metadata Bar */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="flex items-center space-x-1.5">
                  <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                  <strong className="text-slate-800 dark:text-slate-200">{dateAndLocation.location}</strong>
                </span>

                <span>•</span>

                <span className="flex items-center space-x-1.5">
                  <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{dateAndLocation.dateStr}</span>
                </span>

                {author && (
                  <>
                    <span>•</span>
                    <span>By: <strong className="text-slate-800 dark:text-slate-200">{author}</strong></span>
                  </>
                )}
              </div>

              {/* Full Content */}
              <div className="prose dark:prose-invert max-w-none font-sans text-slate-800 dark:text-slate-200 text-base md:text-lg leading-relaxed space-y-4">
                <p className="whitespace-pre-line leading-relaxed">
                  {content}
                </p>
              </div>
            </div>

            {/* Right Side: Featured Image & Photo Gallery */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Featured Image */}
              {blog.mainPhoto && (
                <div className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-lg">
                  <img 
                    src={blog.mainPhoto} 
                    alt={title}
                    className="w-full h-auto max-h-[500px] object-cover rounded-2xl"
                  />
                </div>
              )}

              {/* Additional Photos Gallery */}
              {blog.additionalPhotos && blog.additionalPhotos.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4 text-amber-500" />
                    <span>{lang === "en" ? "Photo Gallery & Attachments" : "तस्बिर ग्यालरी"}</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {blog.additionalPhotos.map((photo, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setSelectedGalleryPhoto(photo)}
                        className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 cursor-pointer"
                      >
                        <img 
                          src={photo} 
                          alt={`Gallery item ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono">
                          View
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Full Image Preview Sub-Modal */}
        {selectedGalleryPhoto && (
          <div className="absolute inset-0 z-50 bg-black/95 p-4 flex flex-col items-center justify-center animate-in fade-in duration-200">
            <button
              onClick={() => setSelectedGalleryPhoto(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={selectedGalleryPhoto} 
              alt="Full preview"
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        )}

      </div>
    </div>
  );
}
