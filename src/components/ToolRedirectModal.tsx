import React, { useEffect, useState } from "react";
import { Sliders, ExternalLink, X, Clock } from "lucide-react";
import { ToolItem } from "../utils/defaultData";

interface ToolRedirectModalProps {
  isOpen: boolean;
  tool: ToolItem | null;
  onClose: () => void;
}

export default function ToolRedirectModal({ isOpen, tool, onClose }: ToolRedirectModalProps) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!isOpen || !tool) {
      setCountdown(30);
      return;
    }

    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (tool.url) {
            window.location.href = tool.url;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, tool]);

  if (!isOpen || !tool) return null;

  const toolName = tool.nameEn || "Utility Tool";
  const toolDesc = tool.descriptionEn || "Official digital utility tool.";
  const toolCat = tool.categoryEn || "Utility Tool Portal";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-amber-950/90 dark:bg-slate-900/95 border border-amber-500/30 dark:border-cyan-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sliders className="h-8 w-8 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 block">
            {toolCat}
          </span>
          <h2 className="text-2xl font-serif font-bold text-white">
            {toolName}
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed max-w-md mx-auto">
            {toolDesc}
          </p>
        </div>

        {/* Live 30-Second Countdown Odometer Gauge */}
        <div className="p-5 bg-black/50 border border-white/10 rounded-2xl text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 text-amber-400 font-mono text-xs font-bold uppercase">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Auto-Redirecting to External Tool</span>
          </div>

          <div className="text-4xl font-extrabold font-mono text-cyan-400 tracking-wider">
            {countdown} <span className="text-xs text-gray-400 uppercase">sec</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 30) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black shadow-lg transition-all active:scale-95 cursor-pointer font-sans"
          >
            <span>Open Tool Instantly Now</span>
            <ExternalLink className="h-4 w-4" />
          </a>

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer font-sans"
          >
            Stay on Website
          </button>
        </div>

      </div>
    </div>
  );
}
