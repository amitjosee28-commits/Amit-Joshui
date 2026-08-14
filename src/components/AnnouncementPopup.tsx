import { useState, useEffect } from "react";
import { Facebook, Instagram, Music, MessageSquare, Mail, X } from "lucide-react";

interface AnnouncementPopupProps {
  active: boolean;
  imageUrl: string;
  textEn: string;
  buttonEn: string;
  buttonUrl: string;
}

export default function AnnouncementPopup({
  active,
  imageUrl,
  textEn,
  buttonEn,
  buttonUrl,
}: AnnouncementPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (active) {
      const isClosed = sessionStorage.getItem("announcement_closed_2026");
      if (!isClosed) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [active]);

  if (!isOpen || !active) return null;

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("announcement_closed_2026", "true");
  };

  const isLongText = (textEn || "").split("\n").length > 8 || (textEn || "").length > 380;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark background overlay */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Announcement Dialog Box */}
      <div 
        id="announcement-modal"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-cyan-500/35 bg-gray-950/95 p-5 shadow-[0_0_30px_rgba(6,182,212,0.25)] text-white z-10 transition-all duration-300 transform scale-100 scale-in animate-in fade-in zoom-in-95"
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-cyan-400 transition-colors bg-white/5 hover:bg-white/15 p-2 rounded-full focus:outline-none z-20 border border-white/10 cursor-pointer"
          aria-label="Close Announcement"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Featured Banner Image */}
        {imageUrl && (
          <div className="relative -mx-5 -mt-5 mb-4 max-h-[50vh] overflow-hidden border-b border-cyan-500/20 bg-black/60 flex items-center justify-center p-1">
            <img 
              src={imageUrl} 
              alt="Announcement Banner" 
              className="max-h-[45vh] w-auto max-w-full object-contain brightness-95 transform hover:scale-105 transition-transform duration-500 rounded-lg shadow-lg"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <div className="absolute bottom-2 left-3">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-cyan-500 text-black shadow-lg">
                Announcement
              </span>
            </div>
          </div>
        )}

        {/* Body Text */}
        <div className="space-y-3">
          <div className="max-h-[180px] overflow-y-auto pr-1 text-sm text-gray-300 leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
            <p className="whitespace-pre-line font-sans">
              {textEn}
            </p>
            {isLongText && (
              <div className="mt-2 border-t border-dashed border-white/10 pt-2 text-[11px] text-cyan-400/80 font-mono text-center">
                * View Full Details *
              </div>
            )}
          </div>

          {/* Action Trigger Link */}
          {buttonUrl && (
            <div className="pt-2">
              <a
                href={buttonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/35 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 duration-150 cursor-pointer"
              >
                {buttonEn || "Learn More"}
              </a>
            </div>
          )}
        </div>

        {/* Official channels */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono font-bold">
            Official Channels
          </span>
          <div className="flex items-center space-x-3 text-gray-400">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Music className="h-4 w-4" />
            </a>
            <a href="https://wa.me/9779800000000" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">
              <MessageSquare className="h-4 w-4" />
            </a>
            <a href="mailto:amit@amitjoshi.info.np" className="hover:text-purple-400 transition-colors">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
