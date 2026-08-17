import React, { useEffect } from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import NetworkCanvas from "./NetworkCanvas";

interface NotFound404Props {
  onNavigate: (route: string) => void;
}

export default function NotFound404({ onNavigate }: NotFound404Props) {
  useEffect(() => {
    // 404 SEO: dynamically tag as noindex, nofollow
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const previousContent = metaRobots ? metaRobots.content : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
    
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.name = "robots";
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = "noindex, nofollow";

    const originalTitle = document.title;
    document.title = "404 Page Not Found | Amit Joshi Official Portal";

    return () => {
      document.title = originalTitle;
      if (metaRobots) {
        metaRobots.content = previousContent;
      }
    };
  }, []);

  const handleReturn = () => {
    onNavigate("/");
  };

  return (
    <div id="standalone-404-container" className="relative min-h-screen w-full bg-[#030712] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Particle Network Canvas Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <NetworkCanvas isDarkMode={true} />
      </div>

      {/* Cyber Grid Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Standalone Error Card */}
      <div className="relative z-10 max-w-lg w-full bg-slate-900/85 border border-cyan-500/30 rounded-3xl p-8 sm:p-12 backdrop-blur-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] text-center space-y-8">
        {/* Subtle Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Small Status Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase">
          <ShieldAlert className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>404 &bull; ROUTE NOT FOUND</span>
        </div>

        {/* Big 404 Headline */}
        <div className="space-y-2">
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-500 leading-none">
            404
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif uppercase">
            PAGE NOT FOUND
          </h2>
        </div>

        {/* Explanatory Message */}
        <p className="text-sm sm:text-base text-gray-300 max-w-md mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>

        {/* Single Primary Action Button */}
        <div className="pt-2">
          <button
            id="return-to-main-website-btn"
            onClick={handleReturn}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold uppercase text-xs tracking-wider shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>RETURN TO MAIN WEBSITE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
