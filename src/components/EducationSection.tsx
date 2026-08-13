import { useState } from "react";
import { GraduationCap, ExternalLink, X, Calendar } from "lucide-react";

interface EducationItem {
  id: string;
  institutionEn: string;
  institutionNp: string;
  degreeEn: string;
  degreeNp: string;
  yearsEn: string;
  yearsNp: string;
  descriptionEn: string;
  descriptionNp: string;
  detailsEn: string;
  detailsNp: string;
  portalUrl: string;
}

interface EducationSectionProps {
  education: EducationItem[];
  lang: "en" | "np";
}

export default function EducationSection({ education, lang }: EducationSectionProps) {
  const [selectedEdu, setSelectedEdu] = useState<EducationItem | null>(null);

  if (!education || education.length === 0) return null;

  return (
    <section id="education-section" className="py-20 relative border-t border-white/5 scroll-mt-24">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
            <GraduationCap className="h-4 w-4 text-cyan-400" />
            <span 
              className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase"
              data-en="Academic Timeline"
              data-np="शैक्षणिक इतिहास"
            >
              {lang === "en" ? "Academic Timeline" : "शैक्षणिक इतिहास"}
            </span>
          </div>
          <h2 
            className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans"
            data-en="Education & Certifications"
            data-np="शिक्षा र प्रमाणपत्रहरू"
          >
            {lang === "en" ? "Education & Certifications" : "शिक्षा र प्रमाणपत्रहरू"}
          </h2>
          <p 
            className="text-gray-400 mt-3 max-w-xl mx-auto text-sm"
            data-en="A timeline of formal computer engineering studies and advanced enterprise software architecture credentials."
            data-np="औपचारिक कम्प्युटर इन्जिनियरिङ र उन्नत इन्टरप्राइज सफ्टवेयर वास्तुकला प्रमाणपत्रहरूको समयरेखा।"
          >
            {lang === "en" ? "A timeline of formal computer engineering studies and advanced enterprise software architecture credentials." : "औपचारिक कम्प्युटर इन्जिनियरिङ र उन्नत इन्टरप्राइज सफ्टवेयर वास्तुकला प्रमाणपत्रहरूको समयरेखा।"}
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {education.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setSelectedEdu(item)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-cyan-500/40 transition-all duration-300 shadow-xl backdrop-blur-md flex flex-col justify-between"
            >
              {/* Card top details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs text-cyan-400 font-mono bg-cyan-400/5 px-2.5 py-1 rounded-full border border-cyan-400/15">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{lang === "en" ? item.yearsEn : item.yearsNp}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 font-bold uppercase group-hover:text-cyan-400 transition-colors">
                    {lang === "en" ? "Click to view" : "हेर्न क्लिक गर्नुहोस्"} &rarr;
                  </span>
                </div>

                <h3 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight group-hover:text-cyan-300 transition-colors">
                  {lang === "en" ? item.degreeEn : item.degreeNp}
                </h3>

                <h4 className="text-xs font-semibold text-purple-400 font-mono tracking-wider uppercase">
                  {lang === "en" ? item.institutionEn : item.institutionNp}
                </h4>

                <p className="text-xs text-gray-400 leading-relaxed pt-2 line-clamp-3">
                  {lang === "en" ? item.descriptionEn : item.descriptionNp}
                </p>
              </div>

              {/* Glowing card bottom line */}
              <div className="h-1 w-full bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-purple-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 mt-6" />
            </div>
          ))}
        </div>

      </div>

      {/* Institutional descriptive modal popup */}
      {selectedEdu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedEdu(null)}
          />
          <div 
            id="education-modal"
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 text-white z-10"
          >
            <button 
              onClick={() => setSelectedEdu(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-4 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                {lang === "en" ? "Institutional Record" : "शैक्षणिक विवरण"}
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight leading-tight">
                {lang === "en" ? selectedEdu.degreeEn : selectedEdu.degreeNp}
              </h3>
              <h4 className="text-xs font-semibold text-purple-400 font-mono uppercase tracking-wider">
                {lang === "en" ? selectedEdu.institutionEn : selectedEdu.institutionNp}
              </h4>
              <div className="inline-flex items-center space-x-1.5 text-xs text-gray-400 font-mono pt-1">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                <span>{lang === "en" ? selectedEdu.yearsEn : selectedEdu.yearsNp}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 border-t border-white/10 pt-4 text-sm text-gray-300 leading-relaxed max-h-[40vh] overflow-y-auto pr-1 scrollbar-thin">
              <p className="font-sans font-medium text-gray-200">
                {lang === "en" ? selectedEdu.descriptionEn : selectedEdu.descriptionNp}
              </p>
              <p className="whitespace-pre-line text-xs text-gray-400 leading-loose border-l-2 border-cyan-500/50 pl-3">
                {lang === "en" ? selectedEdu.detailsEn : selectedEdu.detailsNp}
              </p>
            </div>

            {/* Modal Footer with External Navigation Portal */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2.5 sm:flex-row sm:justify-between items-center">
              {selectedEdu.portalUrl && (
                <a
                  href={selectedEdu.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/10 active:scale-95"
                >
                  <span data-en="Visit Portal" data-np="पोर्टल हेर्नुहोस्">
                    {lang === "en" ? "Visit Portal" : "पोर्टल हेर्नुहोस्"}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                onClick={() => setSelectedEdu(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/15 text-white border border-white/10 transition-all active:scale-95 text-center"
              >
                {lang === "en" ? "Close" : "बन्द गर्नुहोस्"}
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
