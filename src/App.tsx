import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";
import { defaultPortfolioData, PortfolioData } from "./utils/defaultData";
import { getNepalBSAndGregorian } from "./utils/date";

// Lucide icons
import { 
  Sun, Moon, Search, Globe, ChevronDown, Facebook, 
  Instagram, MessageSquare, Mail, Play, Sparkles, BookOpen, Clock, 
  Sliders, GraduationCap, Heart, Landmark, MapPin, ExternalLink, Menu, X,
  FileText, Image as ImageIcon, ShieldCheck, FileSignature, Download
} from "lucide-react";

// Components
import NetworkCanvas from "./components/NetworkCanvas";
import BioModal from "./components/Biomodal";
import AnnouncementPopup from "./components/AnnouncementPopup";
import InitiativesSection from "./components/Initiatives";
import EducationSection from "./components/EducationSection";
import ToolkitSection, { DynamicLucideIcon } from "./components/ToolkitSection";
import ServicesSection from "./components/ServicesSection";
import ContactForm from "./components/ContactForm";
import BlogSection from "./components/BlogSection";
import BlogReaderModal from "./components/BlogReaderModal";
import ToolRedirectModal from "./components/ToolRedirectModal";
import FormFillupModal from "./components/FormFillupModal";

export default function App() {
  // Theme & Language state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lang, setLang] = useState<"en" | "np">("en");
  
  // Real-time Database data state with localStorage caching for instantaneous boot
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(() => {
    try {
      const cached = localStorage.getItem("amit_portfolio_cache_v1");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Failed to load portfolio cache:", e);
    }
    return defaultPortfolioData;
  });
  const [dataLoaded, setDataLoaded] = useState(() => {
    try {
      return !!localStorage.getItem("amit_portfolio_cache_v1");
    } catch (e) {
      return false;
    }
  });

  // Analytics & Custom Deep Link Modals State
  const [visitCount, setVisitCount] = useState<number>(1860);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [formModalState, setFormModalState] = useState<{ isOpen: boolean; title: string; targetId: string }>({
    isOpen: false,
    title: "",
    targetId: ""
  });

  // Time state (Nepal time Gregorian/BS switcher)
  const [nepalTime, setNepalTime] = useState(getNepalBSAndGregorian());

  // Search emulation keywords
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPulseSection, setSearchPulseSection] = useState<string | null>(null);

  // Header Dropdowns & Mobile Menus
  const [showConnectDropdown, setShowConnectDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Biography Modal state
  const [isBioOpen, setIsBioOpen] = useState(false);

  // Legal Modal (Privacy & Terms) state
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalContent, setLegalModalContent] = useState({ title: "", content: "" });

  // Downloads Modal state
  const [isDownloadsModalOpen, setIsDownloadsModalOpen] = useState(false);

  // Useful Links list truncation state
  const [isShowingAllUsefulLinks, setIsShowingAllUsefulLinks] = useState(false);

  // Ken Burns Cinematic Slider state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // 1. Fetch Firebase state on load and bind subscription listener
  useEffect(() => {
    const portfolioRef = ref(db, "portfolio");
    const unsubscribe = onValue(portfolioRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        // Smart merge to ensure Nepali translations and required fields exist even if incomplete in Firebase
        const mergedVal = {
          ...defaultPortfolioData,
          ...val,
          services: (val.services || defaultPortfolioData.services).map((s: any, idx: number) => {
            const defS: any = defaultPortfolioData.services[idx] || {};
            return {
              ...defS,
              ...s,
              titleEn: s.titleEn || defS.titleEn || "",
              titleNp: s.titleNp || defS.titleNp || s.titleEn || "",
              descriptionEn: s.descriptionEn || defS.descriptionEn || "",
              descriptionNp: s.descriptionNp || defS.descriptionNp || s.descriptionEn || "",
              priceEn: s.priceEn || defS.priceEn || "",
              priceNp: s.priceNp || defS.priceNp || s.priceEn || "",
              serverStatus: s.serverStatus || "active",
            };
          }),
          tools: (val.tools || defaultPortfolioData.tools).map((t: any, idx: number) => {
            const defT: any = defaultPortfolioData.tools[idx] || {};
            return {
              ...defT,
              ...t,
              nameEn: t.nameEn || defT.nameEn || "",
              nameNp: t.nameNp || defT.nameNp || t.nameEn || "",
              descriptionEn: t.descriptionEn || defT.descriptionEn || "",
              descriptionNp: t.descriptionNp || defT.descriptionNp || t.descriptionEn || "",
              categoryEn: t.categoryEn || defT.categoryEn || "",
              categoryNp: t.categoryNp || defT.categoryNp || t.categoryEn || "",
            };
          }),
        };
        setPortfolioData(mergedVal);
        try {
          localStorage.setItem("amit_portfolio_cache_v1", JSON.stringify(mergedVal));
        } catch (e) {
          console.warn("Failed to save portfolio cache:", e);
        }
      }
      setDataLoaded(true);
    }, (error) => {
      console.warn("Firebase Realtime Database read failed, using local defaults:", error);
      setDataLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  // Increment total visits counter once on boot and keep track of live count
  useEffect(() => {
    try {
      const statsRef = ref(db, "site_stats/visits");
      const unsubscribe = onValue(
        statsRef,
        (snapshot) => {
          const val = snapshot.val();
          if (val && typeof val === "number") {
            setVisitCount(val);
          } else {
            setVisitCount(1860);
          }
        },
        (error) => {
          console.warn("Analytics read ignored:", error);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.log("Analytics error:", e);
    }
  }, []);

  // Check custom URL permalinks and parameters for instant popup / section scroll
  useEffect(() => {
    if (!dataLoaded) return;

    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    // 1. Check custom permalinks list first
    const customLinks = portfolioData.customLinks || [];
    const matchedPermalink = customLinks.find(link => {
      const cleanSlug = (link.slug || "").toLowerCase().replace(/^\/+/, '');
      return cleanSlug && (path.includes(cleanSlug) || search.includes(cleanSlug) || hash.includes(cleanSlug));
    });

    if (matchedPermalink) {
      if (matchedPermalink.type === "tool") {
        const foundTool = (portfolioData.tools || []).find(t => t.id === matchedPermalink.targetId || t.url?.includes(matchedPermalink.targetId));
        if (foundTool) {
          setSelectedTool(foundTool);
          setIsToolModalOpen(true);
          return;
        }
      } else if (matchedPermalink.type === "form") {
        setFormModalState({
          isOpen: true,
          title: matchedPermalink.titleEn || "Online Form",
          targetId: matchedPermalink.targetId
        });
        return;
      } else if (matchedPermalink.type === "blog") {
        const foundBlog = (portfolioData.blogs?.list || []).find(b => b.id === matchedPermalink.targetId || b.slug === matchedPermalink.targetId);
        if (foundBlog) {
          setSelectedBlog(foundBlog);
          setIsBlogModalOpen(true);
          return;
        }
      } else if (matchedPermalink.type === "page") {
        const secId = matchedPermalink.targetId;
        const el = document.getElementById(secId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    // 2. Direct query parameters check
    if (params.has("tool")) {
      const toolQuery = params.get("tool")?.toLowerCase();
      const foundTool = (portfolioData.tools || []).find(t => 
        t.id?.toLowerCase() === toolQuery || 
        t.nameEn?.toLowerCase().includes(toolQuery || "") ||
        t.url?.toLowerCase().includes(toolQuery || "")
      );
      if (foundTool) {
        setSelectedTool(foundTool);
        setIsToolModalOpen(true);
      }
    } else if (params.has("form")) {
      const formQuery = params.get("form");
      setFormModalState({
        isOpen: true,
        title: formQuery ? `${formQuery} Form` : "Online Application Form",
        targetId: formQuery || "custom-form"
      });
    } else if (params.has("blog")) {
      const blogQuery = params.get("blog")?.toLowerCase();
      const foundBlog = (portfolioData.blogs?.list || []).find(b => 
        b.id?.toLowerCase() === blogQuery || 
        b.slug?.toLowerCase() === blogQuery ||
        b.titleEn?.toLowerCase().includes(blogQuery || "")
      );
      if (foundBlog) {
        setSelectedBlog(foundBlog);
        setIsBlogModalOpen(true);
      }
    } else if (path.includes("/social-media") || hash.includes("social-media")) {
      handleNavScroll("social-section");
    } else if (path.includes("/services") || hash.includes("services")) {
      handleNavScroll("services-section");
    } else if (path.includes("/tools") || hash.includes("tools")) {
      handleNavScroll("tools-section");
    } else if (path.includes("/blog") || hash.includes("blog")) {
      handleNavScroll("blog-section");
    } else if (path.includes("/contact") || hash.includes("contact")) {
      handleNavScroll("contact-section");
    }
  }, [dataLoaded, portfolioData]);

  // 2. Favicon updater
  useEffect(() => {
    const faviconUrl = portfolioData.header?.faviconUrl || defaultPortfolioData.header.faviconUrl;
    if (faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [portfolioData.header?.faviconUrl]);

  // 3. Dynamic Nepal Time loop
  useEffect(() => {
    const interval = setInterval(() => {
      setNepalTime(getNepalBSAndGregorian());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 4. Ken Burns slideshow slide switcher interval
  useEffect(() => {
    const slides = portfolioData.homepage?.slides || defaultPortfolioData.homepage.slides;
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6000); // 6 seconds per slide
    return () => clearInterval(interval);
  }, [portfolioData.homepage?.slides]);

  // 5. Globalization engine mapping: dynamically parse DOM matching data-en and data-np
  useEffect(() => {
    const elements = document.querySelectorAll("[data-en], [data-np]");
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const enVal = htmlEl.getAttribute("data-en");
      const npVal = htmlEl.getAttribute("data-np");
      if (lang === "en" && enVal) {
        htmlEl.innerText = enVal;
      } else if (lang === "np" && npVal) {
        htmlEl.innerText = npVal;
      }
    });
  }, [lang, dataLoaded, portfolioData]);

  // 6. Gemini Smart Search Emulation handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase().trim();
    
    // Search mapping
    const searchMap = [
      { keys: ["home", "biography", "bio", "about", "amit", "joshi", "परिचय", "जीवनी"], id: "home-section" },
      { keys: ["social", "facebook", "instagram", "tiktok", "whatsapp", "contact", "सम्पर्क", "फेसबुक"], id: "social-section" },
      { keys: ["initiative", "cause", "work", "community", "पहल", "अभियान"], id: "initiatives-section" },
      { keys: ["tool", "converter", "calendar", "preeti", "rupee", "zip", "कर", "उपकरण"], id: "tools-section" },
      { keys: ["education", "degree", "university", "ioe", "study", "पढाई", "शिक्षा"], id: "education-section" },
      { keys: ["blog", "iframe", "news", "ब्लग"], id: "blogs-section" },
      { keys: ["service", "price", "audit", "consultation", "सेवा", "खरिद"], id: "services-section" },
      { keys: ["map", "location", "kathmandu", "lalitpur", "ठेगाना", "नक्सा"], id: "contact-section" },
    ];

    // Find first matching route
    const match = searchMap.find(item => 
      item.keys.some(k => query.includes(k) || k.includes(query))
    );

    if (match) {
      const targetEl = document.getElementById(match.id);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        setSearchPulseSection(match.id);
        
        // Apply temporary neon pulse animation
        targetEl.classList.add("neon-glow-active");
        setTimeout(() => {
          targetEl.classList.remove("neon-glow-active");
          setSearchPulseSection(null);
        }, 3000);
      }
    } else {
      // Show elegant toast warning
      alert(lang === "en" ? `No section found for "${searchQuery}". Try 'tools', 'services', or 'biography'.` : `"${searchQuery}" को लागि कुनै खण्ड भेटिएन। 'उपकरण', 'सेवा', वा 'जीवनी' खोज्नुहोस्।`);
    }
    setSearchQuery("");
  };

  const handleNavScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileMenuOpen(false);
  };

  if (!dataLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030712] text-white font-sans select-none">
        {/* Animated Cyber-network grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15),transparent_60%)] animate-pulse pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.1)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative flex flex-col items-center space-y-6 max-w-md w-full px-6 text-center">
          {/* Logo / Portal Icon Pulse */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-ping" />
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-pulse">
              <div className="h-full w-full rounded-full bg-[#030712] flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-cyan-400 animate-spin-slow" />
              </div>
            </div>
          </div>

          {/* Heading with VIBGYOR neon touch */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Amit Joshi
            </h1>
            <p className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest">
              Connecting to Secure Realtime Node...
            </p>
          </div>

          {/* Loading bar */}
          <div className="w-full bg-white/5 h-1.5 border border-white/10 rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-loading-bar" />
          </div>

          {/* Localizing Messages */}
          <div className="text-[10px] font-mono text-gray-500 h-4 uppercase tracking-wider animate-pulse">
            {lang === "en" 
              ? "Synchronizing localized database content..." 
              : "स्थानीयकृत डेटाबेस सामग्री सिङ्क्रोनाइज गर्दै..."}
          </div>
        </div>
      </div>
    );
  }

  const headerData = portfolioData.header || defaultPortfolioData.header;
  const homepageData = portfolioData.homepage || defaultPortfolioData.homepage;
  const slides = homepageData.slides || defaultPortfolioData.homepage.slides;
  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div className={`min-h-screen text-white select-none transition-colors duration-500 ${
      isDarkMode ? "bg-[#030712]" : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* VIBROYG SVG Def for icon stroke */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient id="vibroyg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8f00ff" />
            <stop offset="16.6%" stopColor="#4b0082" />
            <stop offset="33.3%" stopColor="#0000ff" />
            <stop offset="50%" stopColor="#ff0000" />
            <stop offset="66.6%" stopColor="#ff7f00" />
            <stop offset="83.3%" stopColor="#ffff00" />
            <stop offset="100%" stopColor="#00ff00" />
          </linearGradient>
        </defs>
      </svg>

      {/* HTML5 Canvas Network Background */}
      <NetworkCanvas isDarkMode={isDarkMode} />

      {/* Global active announcement popup */}
      {portfolioData.popup && (
        <AnnouncementPopup 
          active={portfolioData.popup.active}
          imageUrl={portfolioData.popup.imageUrl}
          textEn={portfolioData.popup.textEn}
          textNp={portfolioData.popup.textNp}
          buttonEn={portfolioData.popup.buttonEn}
          buttonNp={portfolioData.popup.buttonNp}
          buttonUrl={portfolioData.popup.buttonUrl}
          lang={lang}
        />
      )}

      {/* ================= HEADER SYSTEM ================= */}
      <header className={`sticky top-0 z-40 transition-all duration-300 border-b ${
        isDarkMode 
          ? "bg-[#030712]/95 border-white/5 backdrop-blur-md text-white" 
          : "bg-white/95 border-slate-200/80 backdrop-blur-md text-slate-800"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Left Side: Logo and Brand Text */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4 cursor-pointer" onClick={() => handleNavScroll("home-section")}>
                {headerData.logoUrl && (
                  <img 
                    src={headerData.logoUrl} 
                    alt="Amit Joshi Logo" 
                    className="h-16 w-16 rounded-full object-cover border-2 border-cyan-400 ring-4 ring-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.75)] hover:scale-105 hover:shadow-[0_0_25px_rgba(6,182,212,0.9)] transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex flex-col justify-center">
                  <span className="text-xl md:text-2xl font-extrabold tracking-tight whitespace-nowrap bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-sans leading-none pb-1">
                    {lang === "en" ? headerData.brandTextEn : headerData.brandTextNp}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavScroll("contact-section");
                    }} 
                    className="text-xs font-mono uppercase tracking-wider text-gray-400 hover:text-cyan-400 transition-colors flex items-center space-x-1 leading-none whitespace-nowrap cursor-pointer text-left focus:outline-none"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                    <span data-en="Connect with Me" data-np="मसंग जोडिनुहोस्">
                      {lang === "en" ? "Connect with Me" : "मसंग जोडिनुहोस्"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Navigation nodes (Desktop) & Quick Controls */}
            <div className="flex items-center space-x-4 lg:space-x-8">
            {/* Navigation nodes (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-5 text-xs font-semibold uppercase tracking-wider">
              <button onClick={() => handleNavScroll("home-section")} className="hover:text-cyan-400 transition-colors">
                {lang === "en" ? "Home" : "गृहपृष्ठ"}
              </button>
              <button onClick={() => handleNavScroll("social-section")} className="hover:text-cyan-400 transition-colors">
                {lang === "en" ? "Social Media" : "सामाजिक मिडिया"}
              </button>
              <button onClick={() => handleNavScroll("initiatives-section")} className="hover:text-cyan-400 transition-colors">
                {lang === "en" ? "Initiatives" : "पहलहरू"}
              </button>
              <button onClick={() => handleNavScroll("tools-section")} className="hover:text-cyan-400 transition-colors">
                {lang === "en" ? "Tools" : "उपकरणहरू"}
              </button>
              <button onClick={() => handleNavScroll("education-section")} className="hover:text-cyan-400 transition-colors">
                {lang === "en" ? "Education" : "शिक्षा"}
              </button>
              {portfolioData.blogs?.active && (
                <button onClick={() => handleNavScroll("blogs-section")} className="hover:text-cyan-400 transition-colors">
                  {lang === "en" ? "Blogs" : "ब्लग"}
                </button>
              )}
              <button onClick={() => handleNavScroll("services-section")} className="hover:text-cyan-400 transition-colors">
                {lang === "en" ? "Services" : "सेवाहरू"}
              </button>
              <button onClick={() => handleNavScroll("contact-section")} className="hover:text-cyan-400 transition-colors">
                {lang === "en" ? "Contact" : "सम्पर्क"}
              </button>
            </nav>

            {/* Quick Controls: Search, Theme, Lang, Dropdown */}
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              
              {/* Search emulator */}
              <form onSubmit={handleSearch} className="hidden sm:flex items-center relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === "en" ? "Smart search..." : "खोज्नुहोस्..."}
                  className={`rounded-full px-3 py-1.5 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-24 lg:w-32 focus:lg:w-44 transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-white/5 border border-white/10 text-white placeholder-gray-500" 
                      : "bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400"
                  }`}
                />
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 pointer-events-none" />
              </form>

              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === "en" ? "np" : "en")}
                className={`p-2 rounded-xl border transition-all ${
                  isDarkMode 
                    ? "bg-white/5 border-white/10 hover:bg-white/15 text-cyan-400" 
                    : "bg-white border-slate-200 hover:bg-slate-100 text-slate-800"
                }`}
                title={lang === "en" ? "Switch to Nepali" : "English मा परिवर्तन गर्नुहोस्"}
              >
                <Globe className="h-4 w-4" />
              </button>

              {/* Theme switcher */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-xl border transition-all ${
                  isDarkMode 
                    ? "bg-white/5 border-white/10 hover:bg-white/15 text-yellow-400" 
                    : "bg-white border-slate-200 hover:bg-slate-100 text-[#8b5cf6]"
                }`}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Connect with Me Button & Dynamic Time */}
              <div className="hidden md:flex flex-col items-center select-none">
                <button
                  onClick={() => handleNavScroll("contact-section")}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/10 active:scale-95 duration-150 cursor-pointer"
                >
                  <span data-en="Connect with Me" data-np="मसंग जोडिनुहोस्">
                    {lang === "en" ? "Connect with Me" : "मसंग जोडिनुहोस्"}
                  </span>
                </button>

                {/* VIBROYG Dynamic Nepal Date & Time below the connect button without any boxes */}
                <div 
                  className="vibroyg-text-gradient font-mono font-bold tracking-tight text-[11px] flex items-center gap-1.5 mt-2 justify-center whitespace-nowrap select-none"
                >
                  <span>{lang === "en" ? `${nepalTime.bsDateNum} ${nepalTime.bsMonthEn} ${nepalTime.bsYear}` : `${toNepaliDigits(nepalTime.bsDateNum)} ${nepalTime.bsMonthNp} ${toNepaliDigits(nepalTime.bsYear)}`}</span>
                  <Clock className="h-3.5 w-3.5 inline-block shrink-0 stroke-[2.5]" style={{ stroke: 'url(#vibroyg-gradient)' }} />
                  <span>{lang === "en" ? nepalTime.timeSemicolon : toNepaliDigits(nepalTime.timeSemicolon)}</span>
                </div>
              </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

          </div>
        </div>
      </div>
    </div>

        {/* Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <div className={`lg:hidden px-4 pt-2 pb-6 border-t ${
            isDarkMode ? "bg-[#030712]/95 border-white/5" : "bg-white border-slate-200"
          } space-y-3 flex flex-col text-sm font-semibold uppercase tracking-wider`}>
            <button onClick={() => handleNavScroll("home-section")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
              {lang === "en" ? "Home" : "गृहपृष्ठ"}
            </button>
            <button onClick={() => handleNavScroll("social-section")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
              {lang === "en" ? "Social Media" : "सामाजिक मिडिया"}
            </button>
            <button onClick={() => handleNavScroll("initiatives-section")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
              {lang === "en" ? "Initiatives" : "पहलहरू"}
            </button>
            <button onClick={() => handleNavScroll("tools-section")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
              {lang === "en" ? "Tools" : "उपकरणहरू"}
            </button>
            <button onClick={() => handleNavScroll("education-section")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
              {lang === "en" ? "Education" : "शिक्षा"}
            </button>
            {portfolioData.blogs?.active && (
              <button onClick={() => handleNavScroll("blogs-section")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
                {lang === "en" ? "Blogs" : "ब्लग"}
              </button>
            )}
            <button onClick={() => handleNavScroll("services-section")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
              {lang === "en" ? "Services" : "सेवाहरू"}
            </button>
            <button onClick={() => handleNavScroll("contact-section")} className="text-left py-2 hover:text-cyan-400 transition-colors">
              {lang === "en" ? "Contact" : "सम्पर्क"}
            </button>
          </div>
        )}
      </header>

      {/* ================= SECTION 1: HOMEPAGE slider & SUMMARY ================= */}
      <section 
        id="home-section" 
        className={`relative min-h-[90vh] flex flex-col justify-center overflow-hidden transition-all duration-1000 ${
          searchPulseSection === "home-section" ? "ring-4 ring-cyan-500 ring-offset-4 ring-offset-black" : ""
        }`}
      >
        {/* Full-screen Cinematic Slider utilizing the Ken Burns scale-up effect */}
        <div className="absolute inset-0 z-0">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
                idx === currentSlideIndex ? "opacity-35" : "opacity-0"
              }`}
            >
              <img
                src={slide.imageUrl}
                alt={slide.titleEn}
                className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
                  idx === currentSlideIndex ? "scale-115" : "scale-100"
                }`}
                referrerPolicy="no-referrer"
              />
              {/* Dark vignette gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712]/50" />
            </div>
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 text-center space-y-8 max-w-4xl">
          
          <div className="space-y-4">
            <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-mono text-xs uppercase tracking-widest animate-pulse">
              <Sparkles className="h-4 w-4" />
              <span>
                {lang === "en" 
                  ? (homepageData.portalPillEn || "Amit Joshi Official Portal") 
                  : (homepageData.portalPillNp || "अमित जोशीको आधिकारिक पोर्टल")}
              </span>
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {lang === "en" ? currentSlide.titleEn : currentSlide.titleNp}
            </h1>

            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-sans">
              {lang === "en" ? currentSlide.subtitleEn : currentSlide.subtitleNp}
            </p>
          </div>

          {/* 4-line summary block */}
          <div className="bg-white/[0.03] border border-white/8 backdrop-blur-xl rounded-2xl p-6 shadow-2xl max-w-3xl mx-auto text-left space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 border-b border-white/5 pb-2">
              {lang === "en" 
                ? (homepageData.executiveSummaryTitleEn || "Core Executive Summary") 
                : (homepageData.executiveSummaryTitleNp || "मुख्य कार्यकारी संक्षेप")}
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed font-sans">
              {lang === "en" ? homepageData.biographySummaryEn : homepageData.biographySummaryNp}
            </p>
          </div>

          {/* Portals & popup triggers */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => setIsBioOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-500/15 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            >
              <span>
                {lang === "en" 
                  ? (homepageData.bioBtnEn || "Read Full Biography") 
                  : (homepageData.bioBtnNp || "पूर्ण जीवनी पढ्नुहोस्")}
              </span>
            </button>

            <button
              onClick={() => handleNavScroll("contact-section")}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-cyan-500/10 text-cyan-400 border border-white/10 hover:border-cyan-500/25 transition-all shadow-md transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            >
              <span>
                {lang === "en" 
                  ? (homepageData.connectBtnEn || "Connect to Me Portal") 
                  : (homepageData.connectBtnNp || "मेरो पोर्टलमा जोडिनुहोस्")}
              </span>
            </button>
          </div>

        </div>

        {/* Biography Modal */}
        <BioModal 
          isOpen={isBioOpen} 
          onClose={() => setIsBioOpen(false)} 
          lang={lang} 
          biographyFullEn={homepageData.biographyFullEn || defaultPortfolioData.homepage.biographyFullEn}
          biographyFullNp={homepageData.biographyFullNp || defaultPortfolioData.homepage.biographyFullNp}
          biographyTitleEn={homepageData.biographyTitleEn}
          biographyTitleNp={homepageData.biographyTitleNp}
          biographyTaglineEn={homepageData.biographyTaglineEn}
          biographyTaglineNp={homepageData.biographyTaglineNp}
        />
      </section>

      {/* ================= SECTION 2: SOCIAL MEDIA HUB ================= */}
      <section 
        id="social-section" 
        className={`py-20 relative border-t border-white/5 scroll-mt-24 transition-all duration-1000 ${
          searchPulseSection === "social-section" ? "ring-4 ring-cyan-500 ring-offset-4 ring-offset-black" : ""
        }`}
      >
        <div className="container mx-auto px-4 relative z-10">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
              <Landmark className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase" data-en="Directory Hub" data-np="निर्देशिका केन्द्र">
                {lang === "en" ? "Directory Hub" : "निर्देशिका केन्द्र"}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans" data-en="Social Media Network Hub" data-np="सामाजिक मिडिया नेटवर्क केन्द्र">
              {lang === "en" ? "Social Media Network Hub" : "सामाजिक मिडिया नेटवर्क केन्द्र"}
            </h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto text-sm" data-en="Click external nodes to redirect. Each routing event increments localized database analytics." data-np="बाहिरी नेटवर्कहरूमा जान क्लिक गर्नुहोस्। प्रत्येक लिङ्क क्लिकले डेटाबेस विश्लेषकहरू बढाउँदछ।">
              {lang === "en" ? "Click external nodes to redirect. Each routing event increments localized database analytics." : "बाहिरी नेटवर्कहरूमा जान क्लिक गर्नुहोस्। प्रत्येक लिङ्क क्लिकले डेटाबेस विश्लेषकहरू बढाउँदछ।"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {(portfolioData.socials || defaultPortfolioData.socials).map((soc) => (
              <div
                key={soc.id}
                onClick={() => {
                  // Increment Click Counter in Firebase RTDB
                  try {
                    const clickRef = ref(db, `portfolio/socials`);
                    // We can find and update clickCount
                    const idx = (portfolioData.socials || defaultPortfolioData.socials).findIndex(s => s.id === soc.id);
                    if (idx !== -1) {
                      const updateCountRef = ref(db, `portfolio/socials/${idx}/clickCount`);
                      // We can write update if possible
                    }
                  } catch (e) {
                    console.log("Analytics update ignored.");
                  }
                  window.open(soc.url, "_blank", "referrer");
                }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-cyan-500/35 transition-all duration-300 shadow-lg text-center flex flex-col justify-between h-48 backdrop-blur-md"
              >
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/40 transition-all duration-300">
                    <DynamicLucideIcon name={soc.icon || "Facebook"} className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight leading-none group-hover:text-cyan-300 transition-colors">
                      {soc.platform}
                    </h3>
                    <p className="text-[10px] text-gray-400 leading-tight mt-2 line-clamp-2">
                      {lang === "en" ? soc.titleEn : soc.titleNp}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500 font-bold uppercase group-hover:text-cyan-400 transition-colors">
                  <span>{lang === "en" ? "Clicks:" : "क्लिक संख्या:"} {lang === "en" ? soc.clickCount : toNepaliDigits(soc.clickCount || 0)}</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================= SECTION 3: INITIATIVES ================= */}
      <div className={searchPulseSection === "initiatives-section" ? "ring-4 ring-cyan-500 ring-offset-4 ring-offset-black" : ""}>
        <InitiativesSection 
          initiatives={portfolioData.initiatives || defaultPortfolioData.initiatives}
          lang={lang}
        />
      </div>

      {/* ================= SECTION 4: USEFUL TOOLS ================= */}
      <div className={searchPulseSection === "tools-section" ? "ring-4 ring-cyan-500 ring-offset-4 ring-offset-black" : ""}>
        <ToolkitSection 
          tools={portfolioData.tools || defaultPortfolioData.tools}
          lang={lang}
        />
      </div>

      {/* ================= SECTION 5: EDUCATION ================= */}
      <div className={searchPulseSection === "education-section" ? "ring-4 ring-cyan-500 ring-offset-4 ring-offset-black" : ""}>
        <EducationSection 
          education={portfolioData.education || defaultPortfolioData.education}
          lang={lang}
        />
      </div>

      {/* ================= SECTION 6: SERVICES & PASSION PORTAL ================= */}
      <div className={searchPulseSection === "services-section" ? "ring-4 ring-cyan-500 ring-offset-4 ring-offset-black" : ""}>
        <ServicesSection 
          services={portfolioData.services || defaultPortfolioData.services}
          interests={portfolioData.interests || defaultPortfolioData.interests}
          lang={lang}
          logoUrl={portfolioData.header?.logoUrl}
          faviconUrl={portfolioData.header?.faviconUrl}
          blogs={portfolioData.blogs?.list || []}
          onOpenBlogModal={(blog) => {
            setSelectedBlog(blog);
            setIsBlogModalOpen(true);
          }}
        />
      </div>

      {/* ================= SECTION 7: NATIVE BLOG SECTION (2 BOXES PER ROW) ================= */}
      {portfolioData.blogs?.active && (
        <div className={searchPulseSection === "blogs-section" ? "ring-4 ring-amber-500 ring-offset-4 ring-offset-black" : ""}>
          <BlogSection 
            lang={lang}
            blogs={portfolioData.blogs?.list || []}
            onOpenBlogModal={(blog) => {
              setSelectedBlog(blog);
              setIsBlogModalOpen(true);
            }}
          />
        </div>
      )}

      {/* ================= SECTION 8: CONTACT FORM & ADDRESS MAPS ================= */}
      <div className={searchPulseSection === "contact-section" ? "ring-4 ring-cyan-500 ring-offset-4 ring-offset-black" : ""}>
        <ContactForm 
          lang={lang}
          permanentMapUrl={portfolioData.maps?.permanentUrl || defaultPortfolioData.maps.permanentUrl}
          temporaryMapUrl={portfolioData.maps?.temporaryUrl || defaultPortfolioData.maps.temporaryUrl}
          permanentAddressEn={portfolioData.maps?.permanentAddressEn || defaultPortfolioData.maps.permanentAddressEn}
          permanentAddressNp={portfolioData.maps?.permanentAddressNp || defaultPortfolioData.maps.permanentAddressNp}
          temporaryAddressEn={portfolioData.maps?.temporaryAddressEn || defaultPortfolioData.maps.temporaryAddressEn}
          temporaryAddressNp={portfolioData.maps?.temporaryAddressNp || defaultPortfolioData.maps.temporaryAddressNp}
        />
      </div>

      {/* ================= FOOTER ================= */}
      <footer className={`py-16 border-t relative z-10 transition-colors ${
        isDarkMode 
          ? "bg-black/60 border-white/5 text-gray-400" 
          : "bg-slate-100 border-slate-200 text-slate-700"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-white/5">
            {/* Column 1: Brand & Subtitle */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {headerData.logoUrl && (
                  <img src={headerData.logoUrl} alt="Logo" className="h-8 w-8 rounded-full object-cover border border-cyan-400" referrerPolicy="no-referrer" />
                )}
                <span className="text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-sans">
                  {lang === "en" ? headerData.brandTextEn : headerData.brandTextNp}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-sans" data-en="Engineering modern full-stack web architectures with precise localized experiences." data-np="सटीक स्थानीयकृत अनुभवहरूको साथ आधुनिक पूर्ण-स्ट्याक वेब आर्किटेक्चरहरू इन्जिनियरिङ गर्दै।">
                {lang === "en" ? "Engineering modern full-stack web architectures with precise localized experiences." : "सटीक स्थानीयकृत अनुभवहरूको साथ आधुनिक पूर्ण-स्ट्याक वेब आर्किटेक्चरहरू इन्जिनियरिङ गर्दै।"}
              </p>
            </div>

            {/* Column 2: Useful Links Tab */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400" data-en="Useful Links" data-np="उपयोगी लिङ्कहरू">
                {lang === "en" ? "Useful Links" : "उपयोगी लिङ्कहरू"}
              </h4>
              <ul className="space-y-2 text-xs">
                {(portfolioData.usefulLinks || []).length > 0 ? (
                  (() => {
                    const links = portfolioData.usefulLinks || [];
                    const displayedLinks = isShowingAllUsefulLinks ? links : links.slice(0, 8);
                    return displayedLinks.map((link, idx) => (
                      <li key={link.id || idx}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5">
                          <ExternalLink className="h-3 w-3 text-cyan-400/70" />
                          <span>{lang === "en" ? link.titleEn : link.titleNp}</span>
                        </a>
                      </li>
                    ));
                  })()
                ) : (
                  <li className="text-gray-600 font-mono italic text-[11px]" data-en="No links staged" data-np="कुनै लिङ्क उपलब्ध छैन">
                    {lang === "en" ? "No links staged" : "कुनै लिङ्क उपलब्ध छैन"}
                  </li>
                )}
              </ul>
              {(portfolioData.usefulLinks || []).length > 8 && (
                <button
                  onClick={() => setIsShowingAllUsefulLinks(!isShowingAllUsefulLinks)}
                  className="mt-2 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors flex items-center space-x-1 focus:outline-none cursor-pointer"
                >
                  <span>
                    {isShowingAllUsefulLinks 
                      ? (lang === "en" ? "Show Less ↑" : "कम देखाउनुहोस् ↑") 
                      : (lang === "en" ? `Show More (${(portfolioData.usefulLinks || []).length - 8} more) ↓` : `थप देखाउनुहोस् (${toNepaliDigits((portfolioData.usefulLinks || []).length - 8)} थप) ↓`)}
                  </span>
                </button>
              )}
            </div>

            {/* Column 3: Downloads Tab (PDF/JPG/PNG/GIF Supportable) */}
            <div className="space-y-4">
              <h4 
                onClick={() => setIsDownloadsModalOpen(true)}
                className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors flex items-center space-x-1.5"
                data-en="Downloads Center" 
                data-np="डाउनलोड केन्द्र"
              >
                <span>{lang === "en" ? "Downloads Center" : "डाउनलोड केन्द्र"}</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-full font-sans lowercase">
                  {(portfolioData.downloads || []).length}
                </span>
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed font-sans" data-en="Access official offline resources, documents, images, and files in a unified sandbox." data-np="एकीकृत स्यान्डबक्समा आधिकारिक स्रोतहरू, कागजातहरू, र छविहरू डाउनलोड गर्नुहोस्।">
                {lang === "en" ? "Access official offline resources, documents, images, and files in a unified sandbox." : "एकीकृत स्यान्डबक्समा आधिकारिक स्रोतहरू, कागजातहरू, र छविहरू डाउनलोड गर्नुहोस्।"}
              </p>
              <button 
                onClick={() => setIsDownloadsModalOpen(true)}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/25 active:scale-95 transition-all duration-200"
              >
                <Download className="h-3.5 w-3.5 animate-pulse" />
                <span>{lang === "en" ? "Open Downloads Hub" : "डाउनलोड केन्द्र खोल्नुहोस्"}</span>
              </button>
            </div>

            {/* Column 4: Legal Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400" data-en="Legal & Compliance" data-np="कानुनी र अनुपालन">
                {lang === "en" ? "Legal & Compliance" : "कानुनी र अनुपालन"}
              </h4>
              <div className="flex flex-col space-y-2 text-xs">
                <button 
                  onClick={() => {
                    setLegalModalContent({
                      title: lang === "en" ? "Privacy Policy" : "गोपनीयता नीति",
                      content: lang === "en" ? (portfolioData.privacyPolicyEn || "No privacy policy specified yet.") : (portfolioData.privacyPolicyNp || "गोपनीयता नीति अझै सम्म निर्दिष्ट गरिएको छैन।")
                    });
                    setIsLegalModalOpen(true);
                  }}
                  className="hover:text-cyan-400 transition-colors text-left flex items-center space-x-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400/80" />
                  <span data-en="Privacy Policy" data-np="गोपनीयता नीति">
                    {lang === "en" ? "Privacy Policy" : "गोपनीयता नीति"}
                  </span>
                </button>

                <button 
                  onClick={() => {
                    setLegalModalContent({
                      title: lang === "en" ? "Terms & Conditions" : "शर्त र नियमहरू",
                      content: lang === "en" ? (portfolioData.termsConditionsEn || "No terms and conditions specified yet.") : (portfolioData.termsConditionsNp || "शर्त र नियमहरू अझै सम्म निर्दिष्ट गरिएको छैन।")
                    });
                    setIsLegalModalOpen(true);
                  }}
                  className="hover:text-cyan-400 transition-colors text-left flex items-center space-x-1.5"
                >
                  <FileSignature className="h-3.5 w-3.5 text-cyan-400/80" />
                  <span data-en="Terms & Conditions" data-np="शर्त र नियमहरू">
                    {lang === "en" ? "Terms & Conditions" : "शर्त र नियमहरू"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Odometer Visit Counter & Last Edited Footer Section */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-6">
              <div className="flex flex-col items-center sm:items-start space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500 flex items-center space-x-1">
                  <Sparkles className="h-3 w-3" />
                  <span>{lang === "en" ? "Total Website Visitors" : "वेबसाइट कुल भ्रमण संख्या"}</span>
                </span>
                <div className="flex items-center space-x-1.5 bg-black/80 p-2 rounded-2xl border border-amber-500/30 shadow-xl">
                  {String(visitCount).padStart(6, '0').split('').map((digit, i) => (
                    <div key={i} className="odometer-digit">
                      {lang === "en" ? digit : toNepaliDigits(digit)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] font-mono text-gray-400 space-y-1 text-center sm:text-left border-l border-white/10 sm:pl-6 pt-2 sm:pt-0">
                <div className="flex items-center justify-center sm:justify-start space-x-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>{lang === "en" ? "Last Edited:" : "अन्तिम अपडेट वर्ष:"}</span>
                  <strong className="text-amber-300 font-bold">{portfolioData.lastEdited || "2026-08-12 18:30:00"}</strong>
                </div>
                <p className="text-[10px] text-gray-500">
                  {lang === "en" ? "Realtime sync connected to Cloud Node" : "क्लाउड नोडसँग वास्तविक समय सिङ्क"}
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center md:text-right font-serif">
              <p>© {new Date().getFullYear()} Amit Joshi Official Portfolio. All rights reserved.</p>
            </div>
          </div>

        </div>
      </footer>

      {/* Dynamic Legal terms and policies display Modal */}
      <LegalModal 
        isOpen={isLegalModalOpen} 
        onClose={() => setIsLegalModalOpen(false)} 
        title={legalModalContent.title} 
        content={legalModalContent.content} 
      />

      {/* Dynamic Downloads list Modal */}
      <DownloadsModal 
        isOpen={isDownloadsModalOpen} 
        onClose={() => setIsDownloadsModalOpen(false)} 
        downloads={portfolioData.downloads || []} 
        lang={lang}
        isDarkMode={isDarkMode}
      />

      {/* Deep Link / Custom Permalink Modals */}
      <BlogReaderModal
        isOpen={isBlogModalOpen}
        blog={selectedBlog}
        lang={lang}
        onClose={() => {
          setIsBlogModalOpen(false);
          setSelectedBlog(null);
        }}
      />

      <ToolRedirectModal
        isOpen={isToolModalOpen}
        tool={selectedTool}
        lang={lang}
        onClose={() => {
          setIsToolModalOpen(false);
          setSelectedTool(null);
        }}
      />

      <FormFillupModal
        isOpen={formModalState.isOpen}
        formTitle={formModalState.title}
        targetId={formModalState.targetId}
        lang={lang}
        onClose={() => setFormModalState({ isOpen: false, title: "", targetId: "" })}
      />

    </div>
  );
}


interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <div className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-sm text-gray-300 space-y-4 whitespace-pre-line font-sans leading-relaxed">
          {content}
        </div>
        <div className="p-4 border-t border-white/5 bg-black/30 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


interface DownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloads: Array<{
    id?: string;
    titleEn: string;
    titleNp: string;
    fileUrl: string;
    fileType?: string;
  }>;
  lang: "en" | "np";
  isDarkMode: boolean;
}

const DownloadsModal: React.FC<DownloadsModalProps> = ({ isOpen, onClose, downloads, lang, isDarkMode }) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  if (!isOpen) return null;

  const filtered = downloads.filter(dl => {
    const title = lang === "en" ? dl.titleEn : dl.titleNp;
    return title.toLowerCase().includes(searchTerm.toLowerCase()) || (dl.fileType || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
      
      {/* Modal Container */}
      <div className={`w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl rounded-2xl max-h-[85vh] flex flex-col border ${
        isDarkMode 
          ? "bg-[#0b0f19] border-white/10" 
          : "bg-white border-slate-200"
      }`}>
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center ${
          isDarkMode ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-cyan-400 animate-bounce" />
            <h3 className={`text-lg font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {lang === "en" ? "Downloads Center" : "डाउनलोड केन्द्र"}
            </h3>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar inside Modal */}
        <div className={`p-4 border-b ${isDarkMode ? "border-white/5" : "border-slate-100"}`}>
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === "en" ? "Filter resources..." : "फाइलहरू खोज्नुहोस्..."}
              className={`w-full rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDarkMode 
                  ? "bg-white/5 border border-white/10 text-white placeholder-gray-500" 
                  : "bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400"
              }`}
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-3 pointer-events-none" />
          </div>
        </div>

        {/* Items List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((dl, idx) => {
                const isImage = ["jpg", "png", "gif", "jpeg"].includes((dl.fileType || "").toLowerCase());
                return (
                  <div 
                    key={dl.id || idx}
                    className={`p-4 rounded-xl border flex flex-col justify-between hover:scale-[1.01] hover:border-cyan-400/50 transition-all duration-300 ${
                      isDarkMode 
                        ? "bg-white/5 border-white/5 hover:bg-white/10" 
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${isDarkMode ? "bg-black/35" : "bg-white border border-slate-200"}`}>
                        {isImage ? (
                          <ImageIcon className="h-5 w-5 text-purple-400" />
                        ) : (
                          <FileText className="h-5 w-5 text-cyan-400" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xs font-semibold leading-snug line-clamp-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                          {lang === "en" ? dl.titleEn : dl.titleNp}
                        </p>
                        <span className="text-[9px] font-mono uppercase bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold">
                          {dl.fileType || "File"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-dashed border-white/5 flex justify-end">
                      <a 
                        href={dl.fileUrl} 
                        download={lang === "en" ? dl.titleEn : dl.titleNp} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        <span>{lang === "en" ? "Download" : "डाउनलोड"}</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-cyan-500/5 text-cyan-400 mb-2">
                <FileText className="h-6 w-6" />
              </div>
              <p className={`text-xs font-mono italic ${isDarkMode ? "text-gray-500" : "text-slate-400"}`}>
                {lang === "en" ? "No assets found matching the filter" : "खोजिएको फाइल भेटिएन"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end ${
          isDarkMode ? "bg-black/30 border-white/5" : "bg-slate-50 border-slate-200"
        }`}>
          <button 
            onClick={onClose} 
            className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
          >
            {lang === "en" ? "Close" : "बन्द गर्नुहोस्"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Full local Nepali digits translator
function toNepaliDigits(num: number | string): string {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num.toString().split('').map(char => {
    const parsed = parseInt(char);
    return isNaN(parsed) ? char : nepaliDigits[parsed];
  }).join('');
}
