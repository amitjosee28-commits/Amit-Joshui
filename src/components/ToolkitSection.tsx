import { useState } from "react";
import * as Icons from "lucide-react";
import { Grid, ExternalLink, X, Sliders, Search } from "lucide-react";

interface ToolItem {
  id: string;
  nameEn: string;
  nameNp: string;
  categoryEn: string;
  categoryNp: string;
  descriptionEn: string;
  descriptionNp: string;
  icon: string;
  url: string;
}

interface ToolkitSectionProps {
  tools: ToolItem[];
  lang: "en" | "np";
}

// Dynamically render lucide icon from its serialized string name safely
export function DynamicLucideIcon({ name, className = "h-6 w-6 text-cyan-400" }: { name: string; className?: string }) {
  const IconComp = (Icons as any)[name];
  if (IconComp) {
    return <IconComp className={className} />;
  }
  return <Icons.Cpu className={className} />; // Fallback icon
}

export default function ToolkitSection({ tools, lang }: ToolkitSectionProps) {
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!tools || tools.length === 0) return null;

  // Filter tools based on search query (keyword matching)
  const filteredTools = tools.filter(tool => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameEn = (tool.nameEn || "").toLowerCase();
    const nameNp = (tool.nameNp || "").toLowerCase();
    const catEn = (tool.categoryEn || "").toLowerCase();
    const catNp = (tool.categoryNp || "").toLowerCase();
    const descEn = (tool.descriptionEn || "").toLowerCase();
    const descNp = (tool.descriptionNp || "").toLowerCase();
    return (
      nameEn.includes(q) ||
      nameNp.includes(q) ||
      catEn.includes(q) ||
      catNp.includes(q) ||
      descEn.includes(q) ||
      descNp.includes(q)
    );
  });

  // Strict layout overflow limit
  const limit = 15;
  const hasOverflow = filteredTools.length > limit;
  const displayedTools = hasOverflow && !searchQuery ? filteredTools.slice(0, limit) : filteredTools;

  return (
    <section id="tools-section" className="py-20 relative border-t border-white/5 scroll-mt-24">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <span 
              className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase"
              data-en="Interactive Tool Deck"
              data-np="डिजिटल टुलकिट डेक"
            >
              {lang === "en" ? "Interactive Tool Deck" : "डिजिटल टुलकिट डेक"}
            </span>
          </div>
          <h2 
            className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans"
            data-en="Useful Tools & Utilities"
            data-np="उपयोगी उपकरण र सुविधाहरू"
          >
            {lang === "en" ? "Useful Tools & Utilities" : "उपयोगी उपकरण र सुविधाहरू"}
          </h2>
          <p 
            className="text-gray-400 mt-3 max-w-xl mx-auto text-sm"
            data-en="A collection of specialized online scripts, converters, and engines built to streamline daily workflows in Nepal."
            data-np="नेपालमा दैनिक कार्यप्रवाहलाई सहज बनाउन निर्माण गरिएका विशेष अनलाइन लिपि, रूपान्तरण, र इन्जिनहरूको संग्रह।"
          >
            {lang === "en" ? "A collection of specialized online scripts, converters, and engines built to streamline daily workflows in Nepal." : "नेपालमा दैनिक कार्यप्रवाहलाई सहज बनाउन निर्माण गरिएका विशेष अनलाइन लिपि, रूपान्तरण, र इन्जिनहरूको संग्रह।"}
          </p>

          {/* Tools Live Search Input Box */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "en" ? "Search tools or utilities by single letter or keyword..." : "अक्षर वा शब्दद्वारा औजार तथा सुविधाहरू खोज्नुहोस्..."}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 transition-all font-mono"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
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
              <a
                key={tool.id}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-cyan-400/35 transition-all duration-300 backdrop-blur-md shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Icon & Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all duration-300">
                      <DynamicLucideIcon name={tool.icon} className="h-5 w-5 text-cyan-400" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                      {lang === "en" ? (tool.categoryEn || tool.categoryNp) : (tool.categoryNp || tool.categoryEn)}
                    </span>
                  </div>

                  {/* Name and Description */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                      {lang === "en" ? (tool.nameEn || tool.nameNp) : (tool.nameNp || tool.nameEn)}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                      {lang === "en" ? (tool.descriptionEn || tool.descriptionNp) : (tool.descriptionNp || tool.descriptionEn)}
                    </p>
                  </div>
                </div>

                {/* Floating Trigger Link Details */}
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-gray-500 font-bold uppercase group-hover:text-cyan-400 transition-all">
                  <span>{lang === "en" ? "Open Tool" : "उपकरण खोल्नुहोस्"}</span>
                  <ExternalLink className="h-3 w-3 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl p-6 max-w-md mx-auto text-xs text-gray-400 font-mono">
            {lang === "en" ? `No tools found matching "${searchQuery}"` : `"${searchQuery}" सँग मिल्ने कुनै औजार भेटिएन`}
          </div>
        )}

        {/* Strict layout overflow checking: append "Visit More Tools" trigger if > 15 cards */}
        {hasOverflow && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowAllModal(true)}
              className="inline-flex items-center space-x-2.5 px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-cyan-500 via-cyan-400 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            >
              <Grid className="h-4 w-4" />
              <span data-en="Visit More Tools" data-np="थप उपकरणहरू हेर्नुहोस्">
                {lang === "en" ? `Visit More Tools (${tools.length - limit}+)` : `थप उपकरणहरू हेर्नुहोस् (${toNepaliDigits(tools.length - limit)}+)`}
              </span>
            </button>
          </div>
        )}

      </div>

      {/* Full Modal Grid View of All Tools */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
            onClick={() => setShowAllModal(false)}
          />
          <div className="relative w-full max-w-5xl h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 text-white z-10 flex flex-col justify-between">
            
            {/* Modal Header */}
            <div>
              <button 
                onClick={() => setShowAllModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                aria-label="Close tools catalog"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="mb-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                  {lang === "en" ? "Complete Utility Hub" : "पूर्ण उपकरण केन्द्र"}
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-white mt-1">
                  {lang === "en" ? "All Specialized Tools & Converter Modules" : "सबै उपलब्ध उपकरणहरू र रूपान्तरण मोड्युलहरू"}
                </h3>
              </div>

              {/* Search filter input inside the modal */}
              <div className="mb-6 max-w-md relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === "en" ? "Search scripts, converters, layout types..." : "उपकरणहरू खोज्नुहोस्..."}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <div className="absolute top-3 right-3 text-gray-500">
                  <Search className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Scrollable Complete Grid */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 mb-4">
              {filteredTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                  {filteredTools.map((tool) => (
                    <a
                      key={tool.id}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] hover:border-cyan-400/35 transition-all duration-200 shadow-md"
                    >
                      <div className="flex items-start space-x-3.5">
                        <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all duration-300 flex-shrink-0">
                          <DynamicLucideIcon name={tool.icon} className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-purple-400 block">
                            {lang === "en" ? tool.categoryEn : tool.categoryNp}
                          </span>
                          <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                            {lang === "en" ? tool.nameEn : tool.nameNp}
                          </h4>
                          <p className="text-[11px] text-gray-400 leading-normal line-clamp-2">
                            {lang === "en" ? tool.descriptionEn : tool.descriptionNp}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 font-mono text-xs">
                  {lang === "en" ? "No matches found. Try another query." : "कुनै नतिजा भेटिएन। अर्को शब्द खोज्नुहोस्।"}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => {
                  setShowAllModal(false);
                  setSearchQuery("");
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20 transition-all shadow-md active:scale-95"
              >
                {lang === "en" ? "Close Catalog" : "क्याटलग बन्द गर्नुहोस्"}
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}

function toNepaliDigits(num: number): string {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num.toString().split('').map(char => {
    const parsed = parseInt(char);
    return isNaN(parsed) ? char : nepaliDigits[parsed];
  }).join('');
}
