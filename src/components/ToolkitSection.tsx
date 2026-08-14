import { useState } from "react";
import * as Icons from "lucide-react";
import { Sliders, Search, ExternalLink, X } from "lucide-react";
import { ToolItem } from "../utils/defaultData";

interface ToolkitSectionProps {
  tools: ToolItem[];
  onOpenToolModal?: (tool: ToolItem) => void;
}

export function DynamicLucideIcon({ name, className = "h-6 w-6 text-cyan-400" }: { name: string; className?: string }) {
  const IconComp = (Icons as any)[name];
  if (IconComp) {
    return <IconComp className={className} />;
  }
  return <Icons.Cpu className={className} />;
}

export default function ToolkitSection({ tools, onOpenToolModal }: ToolkitSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllModal, setShowAllModal] = useState(false);

  if (!tools || tools.length === 0) return null;

  const filteredTools = tools.filter(tool => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameEn = (tool.nameEn || "").toLowerCase();
    const catEn = (tool.categoryEn || "").toLowerCase();
    const descEn = (tool.descriptionEn || "").toLowerCase();
    return nameEn.includes(q) || catEn.includes(q) || descEn.includes(q);
  });

  const limit = 15;
  const hasOverflow = filteredTools.length > limit;
  const displayedTools = hasOverflow && !searchQuery ? filteredTools.slice(0, limit) : filteredTools;

  return (
    <section id="tools-section" className="py-20 relative border-t border-white/5 scroll-mt-24">
      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
              Interactive Tool Deck
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans">
            Useful Tools & Utilities
          </h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto text-sm">
            A collection of specialized online scripts, converters, and engines built to streamline daily digital workflows in Nepal.
          </p>

          {/* Tools Live Search Input Box */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools or utilities by keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 transition-all font-mono"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tools Card Deck */}
        {displayedTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {displayedTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => {
                  if (onOpenToolModal) {
                    onOpenToolModal(tool);
                  } else if (tool.url) {
                    window.open(tool.url, "_blank", "noopener,noreferrer");
                  }
                }}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-cyan-400/35 transition-all duration-300 backdrop-blur-md shadow-lg flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Icon & Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all duration-300">
                      <DynamicLucideIcon name={tool.icon} className="h-5 w-5 text-cyan-400" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                      {tool.categoryEn}
                    </span>
                  </div>

                  {/* Name and Description */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                      {tool.nameEn}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                      {tool.descriptionEn}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-gray-500 group-hover:text-cyan-400 transition-colors">
                  <span className="text-[10px] uppercase tracking-wider font-bold">Launch Tool</span>
                  <ExternalLink className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500 font-mono text-xs">
            No tools matched "{searchQuery}".
          </div>
        )}

        {/* View All Tools Button if overflow */}
        {hasOverflow && !searchQuery && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowAllModal(true)}
              className="px-6 py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer inline-flex items-center space-x-2"
            >
              <span>Explore All {tools.length} Tools</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>

      {/* Modal for All Tools */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#0c0d14] border border-cyan-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl space-y-6 flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-cyan-400 font-sans">
                  Complete Tools Directory ({tools.length})
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Explore all deployed utilities and calculators.</p>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-1 flex-1">
              {tools.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setShowAllModal(false);
                    if (onOpenToolModal) {
                      onOpenToolModal(t);
                    } else if (t.url) {
                      window.open(t.url, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer space-y-2 group"
                >
                  <span className="text-[9px] font-mono text-purple-400 uppercase font-bold">{t.categoryEn}</span>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">{t.nameEn}</h4>
                  <p className="text-[11px] text-gray-400 line-clamp-2">{t.descriptionEn}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
