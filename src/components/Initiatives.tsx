import React, { useState, memo } from "react";
import { BookOpen, ExternalLink, X } from "lucide-react";

interface InitiativeItem {
  id: string;
  titleEn: string;
  titleNp?: string;
  textEn: string;
  textNp?: string;
  readMoreEn: string;
  readMoreNp?: string;
  fbIframe: string;
}

interface InitiativesSectionProps {
  initiatives: InitiativeItem[];
}

const FacebookEmbed = memo(({ iframeHtml }: { iframeHtml: string }) => {
  return (
    <div 
      className="w-full h-full"
      dangerouslySetInnerHTML={{ __html: iframeHtml }} 
    />
  );
}, (prev, next) => prev.iframeHtml === next.iframeHtml);

FacebookEmbed.displayName = "FacebookEmbed";

export default function InitiativesSection({ initiatives }: InitiativesSectionProps) {
  const [selectedInit, setSelectedInit] = useState<InitiativeItem | null>(null);

  if (!initiatives || initiatives.length === 0) return null;

  return (
    <section id="initiatives-section" className="py-20 relative border-t border-white/5 scroll-mt-24">
      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
              Social Causes & Strategic Hubs
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans">
            Key Strategic Initiatives
          </h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto text-sm">
            Empowering community nodes and accelerating digital capabilities across regional Nepal.
          </p>
        </div>

        {/* Initiatives List */}
        <div className="space-y-16">
          {initiatives.map((item, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div 
                key={item.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md hover:border-cyan-500/30 transition-all duration-300 shadow-xl"
              >
                {/* Left/Right Column: Text Content */}
                <div className={`lg:col-span-7 space-y-4 ${isEven ? "lg:order-1" : "lg:order-2"}`}>
                  <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-widest">
                    Initiative #{idx + 1}
                  </span>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {item.titleEn}
                  </h3>
                  
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {item.textEn}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedInit(item)}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/25 transition-all duration-200 shadow-md transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      <span>Read Full Impact Story</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Left/Right Column: Live Embed / Video Container */}
                <div className={`lg:col-span-5 ${isEven ? "lg:order-2" : "lg:order-1"}`}>
                  <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black/60 aspect-video flex items-center justify-center group">
                    {item.fbIframe ? (
                      <FacebookEmbed iframeHtml={item.fbIframe} />
                    ) : (
                      <div className="p-6 text-center space-y-2">
                        <BookOpen className="h-8 w-8 text-cyan-400/50 mx-auto" />
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider block">
                          Interactive Live Embed Staging
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Expanded Story Dialog */}
      {selectedInit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0c0d14] border border-cyan-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-cyan-400 font-serif">
                {selectedInit.titleEn}
              </h3>
              <button 
                onClick={() => setSelectedInit(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-gray-300 leading-relaxed font-sans">
              <p>{selectedInit.textEn}</p>
              {selectedInit.readMoreEn && (
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Detailed Execution Story:
                  </h4>
                  <p>{selectedInit.readMoreEn}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedInit(null)}
                className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase text-xs cursor-pointer"
              >
                Close Story
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
