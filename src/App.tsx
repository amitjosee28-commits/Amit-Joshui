import React, { useState, useEffect } from "react";
import { ref, onValue, runTransaction } from "firebase/database";
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
import BlogEditorialPage from "./components/BlogEditorialPage";
import BlogReaderPage from "./components/BlogReaderPage";
import NotFound404 from "./components/NotFound404";
import InvoiceView from "./components/InvoiceView";
import ToolRedirectModal from "./components/ToolRedirectModal";
import FormFillupModal from "./components/FormFillupModal";
import NewsletterSignup from "./components/NewsletterSignup";

export type RouteView = 
  | "home" 
  | "social-media" 
  | "initiatives" 
  | "tools" 
  | "education" 
  | "services" 
  | "contact" 
  | "blogs" 
  | "blog-detail" 
  | "invoices" 
  | "404";

export interface ParsedRoute {
  view: RouteView;
  targetId?: string;
  blog?: any;
  invoiceId?: string;
  matchedPermalink?: any;
  path: string;
}

export function resolveRoute(data: PortfolioData): ParsedRoute {
  if (typeof window === "undefined") {
    return { view: "home", targetId: "home-section", path: "/" };
  }

  const rawPath = window.location.pathname;
  const hash = window.location.hash;
  const search = window.location.search;
  const params = new URLSearchParams(search);

  // Normalize path & hash
  let cleanPath = rawPath.toLowerCase().replace(/^\/+|\/+$/g, "");
  let cleanHash = hash.toLowerCase().replace(/^#\/?|\/+$/g, "");

  // If hash routing is used (e.g. #/tools or #social-media or #blog)
  if (cleanHash && (!cleanPath || cleanPath === "index.html")) {
    cleanPath = cleanHash;
  }

  // Extract blogs list safely
  const blogsList: any[] = Array.isArray(data?.blogs?.list)
    ? data.blogs.list
    : (data?.blogs?.list && typeof data.blogs.list === "object" ? Object.values(data.blogs.list) : (defaultPortfolioData.blogs?.list || []));

  // 1. Direct query parameter triggers (e.g. ?blog=slug or ?blog=id)
  if (params.has("blog")) {
    const blogParam = params.get("blog")?.toLowerCase().trim();
    if (blogParam && blogParam !== "all" && blogParam !== "true") {
      const decodedParam = decodeURIComponent(blogParam);
      const foundBlog = blogsList.find(
        b => (b.slug && b.slug.toLowerCase() === blogParam) ||
             (b.id && b.id.toLowerCase() === blogParam) ||
             (b.slug && b.slug.toLowerCase() === decodedParam) ||
             (b.id && b.id.toLowerCase() === decodedParam)
      );
      if (foundBlog) {
        return { view: "blog-detail", blog: foundBlog, path: `/blog/${foundBlog.slug || foundBlog.id}` };
      }
    }
    return { view: "blogs", path: "/blog" };
  }

  if (params.has("invoice")) {
    return { view: "invoices", invoiceId: params.get("invoice") || "", path: `/invoices/${params.get("invoice")}` };
  }

  // 2. Standard direct SPA paths
  if (!cleanPath || cleanPath === "home" || cleanPath === "index.html") {
    return { view: "home", targetId: "home-section", path: "/" };
  }

  if (cleanPath === "social-media" || cleanPath === "social" || cleanPath === "socials" || cleanPath === "social-section") {
    return { view: "social-media", targetId: "social-section", path: "/social-media" };
  }

  if (cleanPath === "initiatives" || cleanPath === "initiative" || cleanPath === "initiatives-section") {
    return { view: "initiatives", targetId: "initiatives-section", path: "/initiatives" };
  }

  if (cleanPath === "tools" || cleanPath === "toolkit" || cleanPath === "utilities" || cleanPath === "tools-section") {
    return { view: "tools", targetId: "tools-section", path: "/tools" };
  }

  if (cleanPath === "education" || cleanPath === "academic" || cleanPath === "education-section") {
    return { view: "education", targetId: "education-section", path: "/education" };
  }

  if (cleanPath === "services" || cleanPath === "service" || cleanPath === "services-section") {
    return { view: "services", targetId: "services-section", path: "/services" };
  }

  if (cleanPath === "contact" || cleanPath === "connect" || cleanPath === "contact-section") {
    return { view: "contact", targetId: "contact-section", path: "/contact" };
  }

  // Blog Directory Listing: /blog, /blogs, /articles
  if (cleanPath === "blogs" || cleanPath === "blog" || cleanPath === "articles" || cleanPath === "blogs-section" || cleanPath === "blog-section") {
    return { view: "blogs", path: "/blog" };
  }

  // 3. Detailed Blog Article Route: /blog/:slug, /blogs/:slug, /articles/:slug
  if (cleanPath.startsWith("blogs/") || cleanPath.startsWith("blog/") || cleanPath.startsWith("articles/")) {
    const rawSlug = cleanPath.replace(/^(blogs|blog|articles)\/+/, "");
    const decodedSlug = decodeURIComponent(rawSlug).toLowerCase().trim();
    const foundBlog = blogsList.find(
      b => (b.slug && b.slug.toLowerCase() === decodedSlug) ||
           (b.id && b.id.toLowerCase() === decodedSlug) ||
           (b.slug && b.slug.toLowerCase() === rawSlug.toLowerCase()) ||
           (b.id && b.id.toLowerCase() === rawSlug.toLowerCase())
    );
    if (foundBlog) {
      return { view: "blog-detail", blog: foundBlog, path: `/blog/${foundBlog.slug || foundBlog.id}` };
    }
    // Genuinely invalid slug -> 404
    return { view: "404", path: rawPath };
  }

  // 4. Invoice Route: /invoices/:id or /invoice/:id
  if (cleanPath.startsWith("invoices/") || cleanPath.startsWith("invoice/")) {
    const invId = cleanPath.replace(/^(invoices|invoice)\/+/, "");
    return { view: "invoices", invoiceId: invId, path: `/invoices/${invId}` };
  }

  // 5. Custom permalinks from CMS
  const customLinks = data?.customLinks || [];
  const matchedPermalink = customLinks.find(link => {
    const lSlug = (link.slug || "").toLowerCase().replace(/^\/+|\/+$/g, "");
    return lSlug && (cleanPath === lSlug || cleanHash === lSlug);
  });

  if (matchedPermalink) {
    if (matchedPermalink.type === "blog") {
      const foundBlog = blogsList.find(
        b => b.id === matchedPermalink.targetId || b.slug === matchedPermalink.targetId
      );
      if (foundBlog) {
        return { view: "blog-detail", blog: foundBlog, matchedPermalink, path: `/${matchedPermalink.slug}` };
      }
    }
    if (matchedPermalink.type === "page") {
      return { view: "home", targetId: matchedPermalink.targetId, matchedPermalink, path: `/${matchedPermalink.slug}` };
    }
    return { view: "home", matchedPermalink, path: `/${matchedPermalink.slug}` };
  }

  // 6. Unknown / Invalid Path -> 404 Route Not Found
  return { view: "404", path: rawPath };
}

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);
  
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

  // SPA Route State
  const [routeState, setRouteState] = useState<ParsedRoute>(() => resolveRoute(defaultPortfolioData));

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
        // Safe extraction of blogs list
        let blogsList = defaultPortfolioData.blogs.list;
        if (val.blogs?.list) {
          if (Array.isArray(val.blogs.list)) {
            blogsList = val.blogs.list;
          } else if (typeof val.blogs.list === "object" && val.blogs.list !== null) {
            blogsList = Object.values(val.blogs.list);
          }
        }

        // Smart merge to ensure Nepali translations and required fields exist even if incomplete in Firebase
        const mergedVal = {
          ...defaultPortfolioData,
          ...val,
          blogs: {
            active: val.blogs?.active !== undefined ? val.blogs.active : true,
            iframeUrl: val.blogs?.iframeUrl || defaultPortfolioData.blogs.iframeUrl,
            list: blogsList
          },
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
        setRouteState(resolveRoute(mergedVal));
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

  // Increment total visits counter dynamically on boot and keep track of live count
  useEffect(() => {
    try {
      const statsRef = ref(db, "site_stats/visits");
      
      // Increment once per user session
      if (typeof window !== "undefined" && !sessionStorage.getItem("amit_visited_session")) {
        sessionStorage.setItem("amit_visited_session", "true");
        runTransaction(statsRef, (currentVal) => {
          if (typeof currentVal === "number" && currentVal > 0) {
            return currentVal + 1;
          }
          return 343;
        }).catch((err) => {
          console.warn("Visitor counter transaction notice:", err);
        });
      }

      const unsubscribe = onValue(
        statsRef,
        (snapshot) => {
          const val = snapshot.val();
          if (val && typeof val === "number") {
            setVisitCount(val);
          } else {
            setVisitCount(342);
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

  // URL change listener for back/forward navigation and initial load
  useEffect(() => {
    const handleUrlChange = () => {
      const resolved = resolveRoute(portfolioData);
      setRouteState(resolved);

      if (resolved.targetId) {
        setTimeout(() => {
          const el = document.getElementById(resolved.targetId!);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 80);
      }
    };

    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);

    // Initial resolution when data loaded
    if (dataLoaded) {
      handleUrlChange();
    }

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
    };
  }, [dataLoaded, portfolioData]);

  // Main client-side router navigation dispatcher
  const navigateTo = (path: string) => {
    if (path.includes("adminloginweb11") || path.includes("servicesadmin")) {
      window.location.href = path;
      return;
    }

    window.history.pushState(null, "", path);
    const resolved = resolveRoute(portfolioData);
    setRouteState(resolved);
    setMobileMenuOpen(false);

    if (resolved.targetId) {
      setTimeout(() => {
        const el = document.getElementById(resolved.targetId!);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 80);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNavScroll = (id: string) => {
    const sectionToPathMap: Record<string, string> = {
      "home-section": "/",
      "social-section": "/social-media",
      "initiatives-section": "/initiatives",
      "tools-section": "/tools",
      "education-section": "/education",
      "services-section": "/services",
      "blogs-section": "/blogs",
      "contact-section": "/contact"
    };

    const targetPath = sectionToPathMap[id] || `/#${id}`;
    navigateTo(targetPath);
  };

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

  // 6. Gemini Smart Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase().trim();
    
    // Search mapping
    const searchMap = [
      { keys: ["home", "biography", "bio", "about", "amit", "joshi"], id: "home-section" },
      { keys: ["social", "facebook", "instagram", "tiktok", "whatsapp", "contact"], id: "social-section" },
      { keys: ["initiative", "cause", "work", "community"], id: "initiatives-section" },
      { keys: ["tool", "converter", "calendar", "preeti", "rupee", "zip"], id: "tools-section" },
      { keys: ["education", "degree", "university", "ioe", "study"], id: "education-section" },
      { keys: ["blog", "iframe", "news", "articles"], id: "blogs-section" },
      { keys: ["service", "price", "audit", "consultation"], id: "services-section" },
      { keys: ["map", "location", "kathmandu", "lalitpur"], id: "contact-section" },
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
      // Show toast warning
      alert(`No section found for "${searchQuery}". Try 'tools', 'services', or 'biography'.`);
    }
    setSearchQuery("");
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
            Synchronizing database content...
          </div>
        </div>
      </div>
    );
  }

  // Standalone 404 View: structurally isolated with zero header, navigation, or footer
  if (routeState.view === "404") {
    return <NotFound404 onNavigate={(p) => navigateTo(p)} />;
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
          buttonEn={portfolioData.popup.buttonEn}
          buttonUrl={portfolioData.popup.buttonUrl}
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
              <div className="flex items-center space-x-4 cursor-pointer" onClick={() => navigateTo("/")}>
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
                    {headerData.brandTextEn}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo("/contact");
                    }} 
                    className="text-xs font-mono uppercase tracking-wider text-gray-400 hover:text-cyan-400 transition-colors flex items-center space-x-1 leading-none whitespace-nowrap cursor-pointer text-left focus:outline-none"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                    <span>Connect with Me</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Navigation nodes (Desktop) & Quick Controls */}
            <div className="flex items-center space-x-4 lg:space-x-8">
            {/* Navigation nodes (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-5 text-xs font-semibold uppercase tracking-wider">
              <button onClick={() => navigateTo("/")} className={`hover:text-cyan-400 transition-colors ${routeState.view === "home" ? "text-cyan-400 font-bold" : ""}`}>
                Home
              </button>
              <button onClick={() => navigateTo("/social-media")} className={`hover:text-cyan-400 transition-colors ${routeState.view === "social-media" ? "text-cyan-400 font-bold" : ""}`}>
                Social Media
              </button>
              <button onClick={() => navigateTo("/initiatives")} className={`hover:text-cyan-400 transition-colors ${routeState.view === "initiatives" ? "text-cyan-400 font-bold" : ""}`}>
                Initiatives
              </button>
              <button onClick={() => navigateTo("/tools")} className={`hover:text-cyan-400 transition-colors ${routeState.view === "tools" ? "text-cyan-400 font-bold" : ""}`}>
                Tools
              </button>
              <button onClick={() => navigateTo("/education")} className={`hover:text-cyan-400 transition-colors ${routeState.view === "education" ? "text-cyan-400 font-bold" : ""}`}>
                Education
              </button>
              {portfolioData.blogs?.active && (
                <button onClick={() => navigateTo("/blog")} className={`hover:text-cyan-400 transition-colors ${routeState.view === "blogs" || routeState.view === "blog-detail" ? "text-cyan-400 font-bold" : ""}`}>
                  Blogs
                </button>
              )}
              <button onClick={() => navigateTo("/services")} className={`hover:text-cyan-400 transition-colors ${routeState.view === "services" ? "text-cyan-400 font-bold" : ""}`}>
                Services
              </button>
              <button onClick={() => navigateTo("/contact")} className={`hover:text-cyan-400 transition-colors ${routeState.view === "contact" ? "text-cyan-400 font-bold" : ""}`}>
                Contact
              </button>
            </nav>

            {/* Quick Controls: Search, Theme, Dropdown */}
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              
              {/* Search emulator */}
              <form onSubmit={handleSearch} className="hidden sm:flex items-center relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Smart search..."
                  className={`rounded-full px-3 py-1.5 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-24 lg:w-32 focus:lg:w-44 transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-white/5 border border-white/10 text-white placeholder-gray-500" 
                      : "bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400"
                  }`}
                />
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 pointer-events-none" />
              </form>

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
                  onClick={() => navigateTo("/contact")}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/10 active:scale-95 duration-150 cursor-pointer"
                >
                  <span>Connect with Me</span>
                </button>

                {/* VIBROYG Dynamic Nepal Date & Time below the connect button without any boxes */}
                <div 
                  className="vibroyg-text-gradient font-mono font-bold tracking-tight text-[11px] flex items-center gap-1.5 mt-2 justify-center whitespace-nowrap select-none"
                >
                  <span>{`${nepalTime.bsDateNum} ${nepalTime.bsMonthEn} ${nepalTime.bsYear}`}</span>
                  <Clock className="h-3.5 w-3.5 inline-block shrink-0 stroke-[2.5]" style={{ stroke: 'url(#vibroyg-gradient)' }} />
                  <span>{nepalTime.timeSemicolon}</span>
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
            <button onClick={() => navigateTo("/")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
              Home
            </button>
            <button onClick={() => navigateTo("/social-media")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
              Social Media
            </button>
            <button onClick={() => navigateTo("/initiatives")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
              Initiatives
            </button>
            <button onClick={() => navigateTo("/tools")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
              Tools
            </button>
            <button onClick={() => navigateTo("/education")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
              Education
            </button>
            {portfolioData.blogs?.active && (
              <button onClick={() => navigateTo("/blog")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
                Blogs
              </button>
            )}
            <button onClick={() => navigateTo("/services")} className="text-left py-2 border-b border-white/5 hover:text-cyan-400 transition-colors">
              Services
            </button>
            <button onClick={() => navigateTo("/contact")} className="text-left py-2 hover:text-cyan-400 transition-colors">
              Contact
            </button>
          </div>
        )}
      </header>

      {/* ================= CONDITIONAL ROUTE VIEW RESOLVER ================= */}
      {routeState.view === "blogs" ? (
        <BlogEditorialPage 
          blogs={portfolioData.blogs?.list || []}
          onSelectBlog={(b) => navigateTo(`/blog/${b.slug || b.id}`)}
          onNavigateHome={() => navigateTo("/")}
        />
      ) : routeState.view === "blog-detail" && routeState.blog ? (
        <BlogReaderPage 
          blog={routeState.blog}
          allBlogs={portfolioData.blogs?.list || []}
          onNavigateBack={() => navigateTo("/blog")}
          onSelectBlog={(b) => navigateTo(`/blog/${b.slug || b.id}`)}
        />
      ) : (
        <main>
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
                  <span>{homepageData.portalPillEn || "Amit Joshi Official Portal"}</span>
                </span>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
                  {currentSlide.titleEn}
                </h1>

                <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-sans">
                  {currentSlide.subtitleEn}
                </p>
              </div>

              {/* 4-line summary block */}
              <div className="bg-white/[0.03] border border-white/8 backdrop-blur-xl rounded-2xl p-6 shadow-2xl max-w-3xl mx-auto text-left space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 border-b border-white/5 pb-2">
                  {homepageData.executiveSummaryTitleEn || "Core Executive Summary"}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed font-sans">
                  {homepageData.biographySummaryEn}
                </p>
              </div>

              {/* Portals & popup triggers */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                <button
                  onClick={() => setIsBioOpen(true)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-500/15 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  <span>{homepageData.bioBtnEn || "Read Full Biography"}</span>
                </button>

                <button
                  onClick={() => navigateTo("/contact")}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-cyan-500/10 text-cyan-400 border border-white/10 hover:border-cyan-500/25 transition-all shadow-md transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  <span>{homepageData.connectBtnEn || "Connect to Me Portal"}</span>
                </button>
              </div>

            </div>

            {/* Biography Modal */}
            <BioModal 
              isOpen={isBioOpen} 
              onClose={() => setIsBioOpen(false)} 
              biographyFullEn={homepageData.biographyFullEn || defaultPortfolioData.homepage.biographyFullEn}
              biographyTitleEn={homepageData.biographyTitleEn}
              biographyTaglineEn={homepageData.biographyTaglineEn}
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
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
                  <Landmark className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                    Directory Hub
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans">
                  Social Media Network Hub
                </h2>
                <p className="text-gray-400 mt-3 max-w-xl mx-auto text-sm">
                  Click external nodes to redirect. Each routing event increments localized database analytics.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                {(portfolioData.socials || defaultPortfolioData.socials).map((soc) => (
                  <div
                    key={soc.id}
                    onClick={() => {
                      try {
                        const idx = (portfolioData.socials || defaultPortfolioData.socials).findIndex(s => s.id === soc.id);
                        if (idx !== -1) {
                          const updateCountRef = ref(db, `portfolio/socials/${idx}/clickCount`);
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
                          {soc.titleEn}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500 font-bold uppercase group-hover:text-cyan-400 transition-colors">
                      <span>Clicks: {soc.clickCount || 0}</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>

          {/* ================= SECTION 3: INITIATIVES ================= */}
          <div id="initiatives-section" className={searchPulseSection === "initiatives-section" ? "ring-4 ring-cyan-500 ring-offset-4 ring-offset-black" : ""}>
            <InitiativesSection 
              initiatives={portfolioData.initiatives || defaultPortfolioData.initiatives}
            />
          </div>

          {/* ================= SECTION 4: USEFUL TOOLS ================= */}
          <div id="tools-section" className={searchPulseSection === "tools-section" ? "ring-4 ring-cyan-500 ring-offset-4 ring-offset-black" : ""}>
            <ToolkitSection 
              tools={portfolioData.tools || defaultPortfolioData.tools}
            />
          </div>

          {/* ================= SECTION 5: EDUCATION ================= */}
          <div id="education-section" className={searchPulseSection === "education-section" ? "ring-4 ring-cyan-500 ring-offset-4 ring-offset-black" : ""}>
            <EducationSection 
              education={portfolioData.education || defaultPortfolioData.education}
            />
          </div>

          {/* ================= SECTION 6: SERVICES & PASSION PORTAL ================= */}
          <div id="services-section" className={searchPulseSection === "services-section" ? "ring-4 ring-cyan-500 ring-offset-4 ring-offset-black" : ""}>
            <ServicesSection 
              services={portfolioData.services || defaultPortfolioData.services}
              interests={portfolioData.interests || defaultPortfolioData.interests}
              logoUrl={portfolioData.header?.logoUrl}
              faviconUrl={portfolioData.header?.faviconUrl}
              blogs={portfolioData.blogs?.list || []}
              onOpenBlogModal={(blog) => {
                navigateTo(`/blog/${blog.slug || blog.id}`);
              }}
            />
          </div>

          {/* ================= SECTION 7: NATIVE BLOG SECTION (2 BOXES PER ROW) ================= */}
          {portfolioData.blogs?.active && (
            <div id="blogs-section" className={searchPulseSection === "blogs-section" ? "ring-4 ring-amber-500 ring-offset-4 ring-offset-black" : ""}>
              <BlogSection 
                blogs={portfolioData.blogs?.list || []}
                onOpenBlogModal={(blog) => {
                  navigateTo(`/blog/${blog.slug || blog.id}`);
                }}
              />
            </div>
          )}

          {/* ================= SECTION 8: CONTACT FORM & ADDRESS MAPS ================= */}
          <div id="contact-section" className={searchPulseSection === "contact-section" ? "ring-4 ring-cyan-500 ring-offset-4 ring-offset-black" : ""}>
            <ContactForm 
              permanentMapUrl={portfolioData.maps?.permanentUrl || defaultPortfolioData.maps.permanentUrl}
              temporaryMapUrl={portfolioData.maps?.temporaryUrl || defaultPortfolioData.maps.temporaryUrl}
              permanentAddressEn={portfolioData.maps?.permanentAddressEn || defaultPortfolioData.maps.permanentAddressEn}
              temporaryAddressEn={portfolioData.maps?.temporaryAddressEn || defaultPortfolioData.maps.temporaryAddressEn}
            />
          </div>
        </main>
      )}

      {/* ================= FOOTER ================= */}
      <footer className={`py-16 border-t relative z-10 transition-colors ${
        isDarkMode 
          ? "bg-black/60 border-white/5 text-gray-400" 
          : "bg-slate-100 border-slate-200 text-slate-700"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Newsletter Subscription Component */}
          <div className="mb-12">
            <NewsletterSignup />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-white/5">
            {/* Column 1: Brand & Subtitle */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {headerData.logoUrl && (
                  <img src={headerData.logoUrl} alt="Logo" className="h-8 w-8 rounded-full object-cover border border-cyan-400" referrerPolicy="no-referrer" />
                )}
                <span className="text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-sans">
                  {headerData.brandTextEn}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                Official website of Amit Joshi, a student with a strong passion for technology, web development, and digital design. I believe that technology is more than just a field of study—it is a powerful tool for creativity, innovation, and solving real-world problems. I enjoy building digital products that are not only functional but also visually appealing, user-friendly, and professionally designed. Every project I work on is an opportunity to learn something new, improve my skills, and challenge myself to become a better developer and designer.
              </p>
            </div>

            {/* Column 2: Useful Links Tab */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                Useful Links
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
                          <span>{link.titleEn}</span>
                        </a>
                      </li>
                    ));
                  })()
                ) : (
                  <li className="text-gray-600 font-mono italic text-[11px]">
                    No links staged
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
                      ? "Show Less ↑" 
                      : `Show More (${(portfolioData.usefulLinks || []).length - 8} more) ↓`}
                  </span>
                </button>
              )}
            </div>

            {/* Column 3: Downloads Tab (PDF/JPG/PNG/GIF Supportable) */}
            <div className="space-y-4">
              <h4 
                onClick={() => setIsDownloadsModalOpen(true)}
                className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors flex items-center space-x-1.5"
              >
                <span>Downloads Center</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-full font-sans lowercase">
                  {(portfolioData.downloads || []).length}
                </span>
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                Access official offline resources, documents, images, and files in a unified sandbox.
              </p>
              <button 
                onClick={() => setIsDownloadsModalOpen(true)}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/25 active:scale-95 transition-all duration-200"
              >
                <Download className="h-3.5 w-3.5 animate-pulse" />
                <span>Open Downloads Hub</span>
              </button>
            </div>

            {/* Column 4: Legal Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                Legal & Compliance
              </h4>
              <div className="flex flex-col space-y-2 text-xs">
                <button 
                  onClick={() => {
                    setLegalModalContent({
                      title: "Privacy Policy",
                      content: portfolioData.privacyPolicyEn || "No privacy policy specified yet."
                    });
                    setIsLegalModalOpen(true);
                  }}
                  className="hover:text-cyan-400 transition-colors text-left flex items-center space-x-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400/80" />
                  <span>Privacy Policy</span>
                </button>

                <button 
                  onClick={() => {
                    setLegalModalContent({
                      title: "Terms & Conditions",
                      content: portfolioData.termsConditionsEn || "No terms and conditions specified yet."
                    });
                    setIsLegalModalOpen(true);
                  }}
                  className="hover:text-cyan-400 transition-colors text-left flex items-center space-x-1.5"
                >
                  <FileSignature className="h-3.5 w-3.5 text-cyan-400/80" />
                  <span>Terms & Conditions</span>
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
                  <span>Total Website Visitors</span>
                </span>
                <div className="flex items-center space-x-1.5 bg-black/80 p-2 rounded-2xl border border-amber-500/30 shadow-xl">
                  {String(visitCount).padStart(6, '0').split('').map((digit, i) => (
                    <div key={i} className="odometer-digit">
                      {digit}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] font-mono text-gray-400 space-y-1 text-center sm:text-left border-l border-white/10 sm:pl-6 pt-2 sm:pt-0">
                <div className="flex items-center justify-center sm:justify-start space-x-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>Last Edited:</span>
                  <strong className="text-amber-300 font-bold">{portfolioData.lastEdited || "2026-08-12 18:30:00"}</strong>
                </div>
                <p className="text-[10px] text-gray-500">
                  Realtime sync connected to Cloud Node
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
        isDarkMode={isDarkMode}
      />

      {/* Deep Link / Custom Permalink Modals */}
      <BlogReaderModal
        isOpen={isBlogModalOpen}
        blog={selectedBlog}
        onClose={() => {
          setIsBlogModalOpen(false);
          setSelectedBlog(null);
        }}
      />

      <ToolRedirectModal
        isOpen={isToolModalOpen}
        tool={selectedTool}
        onClose={() => {
          setIsToolModalOpen(false);
          setSelectedTool(null);
        }}
      />

      <FormFillupModal
        isOpen={formModalState.isOpen}
        formTitle={formModalState.title}
        targetId={formModalState.targetId}
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
    titleNp?: string;
    fileUrl: string;
    fileType?: string;
  }>;
  isDarkMode: boolean;
}

const DownloadsModal: React.FC<DownloadsModalProps> = ({ isOpen, onClose, downloads, isDarkMode }) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  if (!isOpen) return null;

  const filtered = downloads.filter(dl => {
    const title = dl.titleEn || "";
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
              Downloads Center
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
              placeholder="Filter resources..."
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
                          {dl.titleEn}
                        </p>
                        <span className="text-[9px] font-mono uppercase bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold">
                          {dl.fileType || "File"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-dashed border-white/5 flex justify-end">
                      <a 
                        href={dl.fileUrl} 
                        download={dl.titleEn} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
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
                No assets found matching the filter
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
