import React from "react";
import { Compass, Home, BookOpen, Sliders, Landmark, GraduationCap, Users, Mail, ArrowRight } from "lucide-react";

interface NotFound404Props {
  onNavigate: (route: string) => void;
}

export default function NotFound404({ onNavigate }: NotFound404Props) {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  const quickLinks = [
    { label: "Main Homepage", path: "/", icon: Home },
    { label: "Blog & Editorial Articles", path: "/blog", icon: BookOpen },
    { label: "Utility Toolkit Deck", path: "/tools", icon: Sliders },
    { label: "Professional Services", path: "/services", icon: Landmark },
    { label: "Academic Milestones", path: "/education", icon: GraduationCap },
    { label: "Social Media Hub", path: "/social-media", icon: Users },
    { label: "Official Contact", path: "/contact", icon: Mail },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-2xl w-full bg-white/[0.02] border border-white/10 dark:border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl text-center space-y-8 relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 404 Badge */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Compass className="h-4 w-4 animate-spin" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">
              HTTP 404 &bull; Route Not Found
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-cyan-400">
            404
          </h1>

          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight font-serif">
            The requested destination does not exist.
          </h2>

          <p className="text-xs md:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            The URL <code className="px-2 py-0.5 rounded bg-black/50 border border-white/10 text-amber-300 font-mono">{currentPath}</code> could not be resolved in the dynamic routing registry.
          </p>
        </div>

        {/* Primary Action Button */}
        <div>
          <button
            onClick={() => onNavigate("/")}
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase text-xs tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Return to Homepage</span>
          </button>
        </div>

        {/* Quick Navigation Directory */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 block">
            Or explore verified dynamic destinations:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => onNavigate(link.path)}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-amber-500/30 text-xs font-mono text-gray-300 hover:text-white transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
