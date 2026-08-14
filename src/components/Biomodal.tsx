import React from "react";
import { X } from "lucide-react";

interface BioModalProps {
  isOpen: boolean;
  onClose: () => void;
  biographyFullEn: string;
  biographyTitleEn?: string;
  biographyTaglineEn?: string;
}

export default function BioModal({ 
  isOpen, 
  onClose, 
  biographyFullEn, 
  biographyTitleEn,
  biographyTaglineEn,
}: BioModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        id="bio-modal-content"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gray-950/90 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 text-white z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 cursor-pointer"
          aria-label="Close biography modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4">
          <h3 
            className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-sans"
          >
            {biographyTitleEn || "Biography of Amit Joshi"}
          </h3>
          <p className="text-xs font-mono text-cyan-400/80 mt-1">
            {biographyTaglineEn || "Senior Full-Stack Architect & Digital Localizer"}
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 text-gray-300 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
          <p className="whitespace-pre-line">
            {biographyFullEn || "Amit Joshi is an engineering leader and full-stack software architect dedicated to advancing open civic technology, localized digital tools, and scalable cloud architectures in Nepal."}
          </p>
        </div>

        <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
