import React, { useState, memo } from "react";
import { BookOpen, ExternalLink, X } from "lucide-react";

interface InitiativeItem {
  id: string;
  titleEn: string;
  titleNp: string;
  textEn: string;
  textNp: string;
  readMoreEn: string;
  readMoreNp: string;
  fbIframe: string;
}

interface InitiativesSectionProps {
  initiatives: InitiativeItem[];
  lang: "en" | "np";
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

export default function InitiativesSection({ initiatives, lang }: InitiativesSectionProps) {
  const [selectedInit, setSelectedInit] = useState<InitiativeItem | null>(null);

  if (!initiatives || initiatives.length === 0) return null;

  return (
    <section id="initiatives-section" className="py-20 relative border-t border-white/5 scroll-mt-24">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span 
              className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase"
              data-en="Social Causes & Hubs"
              data-np="सामाजिक कार्य र पहलहरू"
            >
              {lang === "en" ? "Social Causes & Hubs" : "सामाजिक कार्य र पहलहरू"}
            </span>
          </div>
          <h2 
            className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans"
            data-en="Key Strategic Initiatives"
            data-np="प्रमुख रणनीतिक पहलहरू"
          >
            {lang === "en" ? "Key Strategic Initiatives" : "प्रमुख रणनीतिक पहलहरू"}
          </h2>
          <p 
            className="text-gray-400 mt-3 max-w-xl mx-auto text-sm"
            data-en="Empowering community nodes and accelerating digital capabilities in regional Nepal."
            data-np="नेपालका विभिन्न क्षेत्रहरूमा सामुदायिक नोडहरू सशक्त बनाउँदै र डिजिटल क्षमताहरूको विकास गर्दै।"
          >
            {lang === "en" ? "Empowering community nodes and accelerating digital capabilities in regional Nepal." : "नेपालका विभिन्न क्षेत्रहरूमा सामुदायिक नोडहरू सशक्त बनाउँदै र डिजिटल क्षमताहरूको विकास गर्दै।"}
          </p>
        </div>

        {/* Initiatives List */}
        <div className="space-y-16">
          {initiatives.map((item, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div 
                key={item.id}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md hover:border-cyan-500/30 transition-all duration-300 shadow-xl`}
              >
                {/* Left/Right Column: Text Content */}
                <div className={`lg:col-span-7 space-y-4 ${isEven ? "lg:order-1" : "lg:order-2"}`}>
                  <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-widest">
                    {lang === "en" ? `Initiative #${idx + 1}` : `पहल #${toNepaliDigits(idx + 1)}`}
                  </span>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {lang === "en" ? item.titleEn : item.titleNp}
                  </h3>
                  
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {lang === "en" ? item.textEn : item.textNp}
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedInit(item)}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/25 transition-all duration-200 shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span data-en="Read Full Impact Story" data-np="पूर्ण प्रभाव कथा पढ्नुहोस्">
                        {lang === "en" ? "Read Full Impact Story" : "पूर्ण प्रभाव कथा पढ्नुहोस्"}
                      </span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Left/Right Column: Facebook Iframe Element */}
                <div className={`lg:col-span-5 h-[350px] w-full bg-black/40 rounded-2xl border border-white/5 overflow-hidden shadow-inner flex flex-col items-center justify-center relative ${isEven ? "lg:order-2" : "lg:order-1"}`}>
                  {item.fbIframe ? (
                    <FacebookEmbed iframeHtml={item.fbIframe} />
                  ) : (
                    <div className="text-gray-500 font-mono text-xs text-center p-4">
                      {lang === "en" ? "No Facebook Iframe Set" : "फेसबुक आईफ्रेम सेट गरिएको छैन"}
                    </div>
                  )}
                  {/* Subtle glass overlay border */}
                  <div className="absolute inset-0 pointer-events-none rounded-2xl border border-white/10" />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Detail Pop-up Modal */}
      {selectedInit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedInit(null)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-gray-950 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 text-white z-10">
            
            <button 
              onClick={() => setSelectedInit(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                {lang === "en" ? "Expanded Impact Brief" : "विस्तृत प्रभाव विवरण"}
              </span>
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-white mt-1">
                {lang === "en" ? selectedInit.titleEn : selectedInit.titleNp}
              </h3>
            </div>

            <div className="max-h-[50vh] overflow-y-auto pr-1 text-sm text-gray-300 leading-relaxed scrollbar-thin scrollbar-thumb-white/10 space-y-3">
              <p className="whitespace-pre-line text-xs font-mono text-gray-400 italic">
                {lang === "en" ? selectedInit.textEn : selectedInit.textNp}
              </p>
              <div className="border-t border-white/10 pt-3 text-gray-200">
                {lang === "en" ? selectedInit.readMoreEn : selectedInit.readMoreNp}
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
              <button
                onClick={() => setSelectedInit(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-lg active:scale-95"
              >
                {lang === "en" ? "Close Impact Brief" : "विवरण बन्द गर्नुहोस्"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Simple Nepali translation digits helper
function toNepaliDigits(num: number): string {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num.toString().split('').map(char => {
    const parsed = parseInt(char);
    return isNaN(parsed) ? char : nepaliDigits[parsed];
  }).join('');
}
