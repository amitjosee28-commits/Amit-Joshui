import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Play, RotateCcw, Volume2, VolumeX, Maximize2, 
  Minimize2, Calendar, Clock, Compass, Shield, Flame, ChevronRight,
  Share2, Check, Bell
} from "lucide-react";

// Target launch date: 21 October 2026, 11:25 AM Nepal Time (+05:45)
const TARGET_LAUNCH_DATE_ISO = "2026-10-21T11:25:00+05:45";

interface FestiveLaunchBannerProps {
  isDarkMode?: boolean;
  onExploreSite?: () => void;
}

export default function FestiveLaunchBanner({ 
  isDarkMode = true,
  onExploreSite
}: FestiveLaunchBannerProps) {
  // Animation stage 0 to 9
  // 0: Initial ambient
  // 1: Soft glowing particles appear
  // 2: Dashain elements gradually illuminate
  // 3: Tika/jamara and marigolds gently sway in foreground
  // 4: Golden light sweeps across scene
  // 5: Transition into Tihar/Diwali
  // 6: Diyas light up one by one
  // 7: Subtle fireworks burst in background
  // 8: Futuristic digital cyber glow forms behind text
  // 9: Final powerful golden-white light pulse behind launch announcement
  const [animStage, setAnimStage] = useState<number>(9); // Defaults to fully revealed, can replay
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"banner" | "details">("banner");

  // Countdown state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPassed: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: false });

  // Current Nepal Time for comparison
  const [currentNpt, setCurrentNpt] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Calculate live countdown to target date
  useEffect(() => {
    const targetTime = new Date(TARGET_LAUNCH_DATE_ISO).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds, isPassed: false });
      }

      // Format Nepal Time now
      try {
        const nptString = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kathmandu",
          dateStyle: "medium",
          timeStyle: "medium"
        }).format(new Date());
        setCurrentNpt(nptString);
      } catch (e) {
        // Fallback
        const nptDate = new Date(now + (5 * 60 + 45) * 60 * 1000);
        setCurrentNpt(nptDate.toUTCString().replace("GMT", "NPT"));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web Audio sound synthesizer for festive celebratory chimes
  const playFestiveSound = (type: "bell" | "sweep" | "pulse" | "spark") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === "bell") {
        // Tibetan/Nepalese temple singing bell harmony
        osc.type = "sine";
        osc.frequency.setValueAtTime(528, now); // 528Hz Solfeggio / Auspicious frequency
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.8);
      } else if (type === "sweep") {
        // Golden light sweep
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(960, now + 0.8);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      } else if (type === "pulse") {
        // Grand launch pulse
        osc.type = "sine";
        osc.frequency.setValueAtTime(432, now);
        osc.frequency.exponentialRampToValueAtTime(1080, now + 0.6);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.5);
      } else if (type === "spark") {
        // Fireworks spark
        osc.type = "sine";
        osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  };

  // Run the 9-stage sequence if isPlaying
  useEffect(() => {
    if (!isPlaying) return;

    const stageTimeouts: NodeJS.Timeout[] = [];
    const delays = [
      0,     // stage 1: Particles appear (0ms)
      1200,  // stage 2: Dashain elements illuminate
      2600,  // stage 3: Tika & jamara details move
      4000,  // stage 4: Golden light sweep
      5600,  // stage 5: Transition into Tihar
      7200,  // stage 6: Diyas light up
      8800,  // stage 7: Subtle fireworks in background
      10400, // stage 8: Digital cyber glow forms
      12200  // stage 9: Final golden-white launch announcement pulse
    ];

    delays.forEach((delay, idx) => {
      const t = setTimeout(() => {
        const nextStage = idx + 1;
        setAnimStage(nextStage);
        if (nextStage === 2) playFestiveSound("bell");
        if (nextStage === 4) playFestiveSound("sweep");
        if (nextStage === 6) playFestiveSound("bell");
        if (nextStage === 7) playFestiveSound("spark");
        if (nextStage === 9) {
          playFestiveSound("pulse");
          setIsPlaying(false);
        }
      }, delay);
      stageTimeouts.push(t);
    });

    return () => {
      stageTimeouts.forEach(clearTimeout);
    };
  }, [isPlaying, soundEnabled]);

  const handleStartSequence = () => {
    setAnimStage(1);
    setIsPlaying(true);
    playFestiveSound("bell");
  };

  const handleSkipToEnd = () => {
    setIsPlaying(false);
    setAnimStage(9);
    playFestiveSound("pulse");
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (nextVal) {
      playFestiveSound("bell");
    }
  };

  const copyShareLink = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(`Amit Joshi Website Re-launch | 21 October 2026, 11:25 AM Nepal Time — Celebrating Dashain & Tihar! ${url}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Canvas particle simulation for celebratory embers, marigold petals, and fireworks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 1200);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 675);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle pool
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
      type: "ember" | "petal" | "spark" | "diyaGlow";
      rot?: number;
      vRot?: number;
    }

    const particles: Particle[] = [];
    const colors = [
      "#f59e0b", // Gold
      "#fbbf24", // Warm yellow
      "#ea580c", // Saffron
      "#dc2626", // Crimson
      "#38bdf8", // Cyan cyber
      "#fb7185", // Marigold rose
      "#fef08a"  // Bright diya light
    ];

    // Seed initial particles
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.3 - Math.random() * 0.7,
        size: 1.5 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.2 + Math.random() * 0.8,
        decay: 0.002 + Math.random() * 0.004,
        type: Math.random() > 0.4 ? "ember" : "petal",
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.03
      });
    }

    // Fireworks bursts generator
    let lastFirework = Date.now();

    const addFireworkBurst = () => {
      const fx = width * 0.6 + Math.random() * (width * 0.35); // towards Tihar side
      const fy = height * 0.15 + Math.random() * (height * 0.35);
      const burstColor = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 28; i++) {
        const angle = (Math.PI * 2 * i) / 28;
        const speed = 1.2 + Math.random() * 2.2;
        particles.push({
          x: fx,
          y: fy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.5 + Math.random() * 2,
          color: burstColor,
          alpha: 1,
          decay: 0.018 + Math.random() * 0.015,
          type: "spark"
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Trigger occasional fireworks if stage >= 7
      if (animStage >= 7 && Date.now() - lastFirework > 2400) {
        addFireworkBurst();
        lastFirework = Date.now();
      }

      // Update & render particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.type === "petal") {
          p.x += Math.sin(p.y * 0.02) * 0.5;
          if (p.rot !== undefined && p.vRot !== undefined) {
            p.rot += p.vRot;
          }
        }

        if (p.alpha <= 0 || p.y < -10 || p.x < -10 || p.x > width + 10) {
          // Recycle
          p.x = Math.random() * width;
          p.y = height + 10;
          p.vx = (Math.random() - 0.5) * 0.7;
          p.vy = -0.4 - Math.random() * 0.8;
          p.alpha = 0.3 + Math.random() * 0.7;
          p.color = colors[Math.floor(Math.random() * colors.length)];
          p.type = Math.random() > 0.4 ? "ember" : "petal";
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.type === "spark" ? 8 : 4;

        if (p.type === "petal") {
          ctx.translate(p.x, p.y);
          if (p.rot) ctx.rotate(p.rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.9, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [animStage]);

  return (
    <section 
      ref={containerRef}
      className={`relative w-full overflow-hidden transition-all duration-700 ${
        isFullscreen 
          ? "fixed inset-0 z-50 bg-black flex flex-col justify-center items-center p-0 m-0" 
          : "border-b border-amber-500/20 shadow-[0_15px_60px_rgba(0,0,0,0.8)]"
      }`}
      aria-label="Dashain and Tihar Festive Launch Banner"
    >
      {/* Aspect Ratio Container (16:9 cinematic framing with responsive min-height) */}
      <div className={`relative w-full overflow-hidden ${
        isFullscreen ? "h-full min-h-screen" : "aspect-[16/9] min-h-[580px] sm:min-h-[640px] md:min-h-[720px] max-h-[880px]"
      }`}>
        
        {/* ================= 1. LUXURY 16:9 BACKDROP IMAGE ================= */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/festive_launch_banner_1791294106530.jpg"
            alt="Dashain and Tihar Celebration Banner - Amit Joshi Portal Launch"
            className={`w-full h-full object-cover object-center transform transition-transform duration-[8000ms] ease-out select-none ${
              animStage >= 4 ? "scale-105" : "scale-100"
            }`}
            referrerPolicy="no-referrer"
          />

          {/* Deep cinematic overlays: Left Crimson/Saffron (Dashain), Right Deep Navy/Violet (Tihar), Center Glass Vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/70 via-black/45 to-indigo-950/75 mix-blend-multiply" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-[#030712]/95" />

          {/* Cyber Digital Network Grid Overlay (Represents modern personal technology chapter) */}
          <div 
            className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
              animStage >= 8 ? "opacity-35" : "opacity-15"
            }`}
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(245, 158, 11, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px"
            }}
          />

          {/* Animated Golden Light Sweep (Stage 4+) */}
          <div 
            className={`absolute inset-0 pointer-events-none transition-all duration-[3000ms] ${
              animStage >= 4 
                ? "translate-x-full opacity-0" 
                : "-translate-x-full opacity-60"
            }`}
            style={{
              background: "linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.35), rgba(255, 255, 255, 0.6), rgba(245, 158, 11, 0.35), transparent)",
              width: "200%"
            }}
          />

          {/* Volumetric Shakti / Durga Divine Aura Halo on Dashain Left Side (Stage 2+) */}
          <div 
            className={`absolute -left-20 top-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-red-600/35 via-amber-500/25 to-transparent blur-3xl pointer-events-none transition-all duration-1000 ${
              animStage >= 2 ? "opacity-90 scale-110" : "opacity-0 scale-75"
            }`}
          />

          {/* Golden Diya Constellation Glow on Tihar Right Side (Stage 6+) */}
          <div 
            className={`absolute -right-20 top-1/3 w-96 h-96 rounded-full bg-gradient-to-bl from-amber-400/35 via-violet-600/25 to-transparent blur-3xl pointer-events-none transition-all duration-1000 ${
              animStage >= 6 ? "opacity-90 scale-110" : "opacity-0 scale-75"
            }`}
          />
        </div>

        {/* ================= 2. CANVAS PARTICLE & SPARK FIREWORKS LAYER ================= */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ${
            animStage >= 1 ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* ================= 3. TOP FESTIVE STATUS BADGE BAR ================= */}
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-3 pointer-events-auto">
          {/* Left: Traditional Spiritual Accent & Festival Pill */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-mono tracking-wider shadow-lg shadow-black/40">
              <span className="text-amber-400 font-serif text-sm font-bold">ॐ</span>
              <span className="hidden sm:inline text-amber-200/70">|</span>
              <span className="font-semibold text-amber-300">बडा दशैँ &amp; तिहार विशेष</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            </div>

            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/50 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span>Full-Stack Web Architecture Re-Launch</span>
            </div>
          </div>

          {/* Right: Interactive Controls (Replay, Audio, Fullscreen, Share) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl backdrop-blur-md border transition-all text-xs font-mono flex items-center gap-1.5 ${
                soundEnabled 
                  ? "bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                  : "bg-black/60 border-white/10 text-gray-400 hover:text-white"
              }`}
              title={soundEnabled ? "Mute temple chime sounds" : "Enable festive audio chimes"}
              aria-label="Toggle festive sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden lg:inline text-[11px]">{soundEnabled ? "Audio On" : "Chimes"}</span>
            </button>

            {/* Replay Cinematic Sequence */}
            <button
              onClick={handleStartSequence}
              disabled={isPlaying}
              className="px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 hover:border-amber-400/40 text-gray-300 hover:text-amber-300 transition-all text-xs font-mono flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Play 9-step cinematic transition sequence"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isPlaying ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline text-[11px]">{isPlaying ? "Playing..." : "Replay"}</span>
            </button>

            {/* Share Launch Link */}
            <button
              onClick={copyShareLink}
              className="px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 text-gray-300 hover:text-cyan-300 transition-all text-xs font-mono flex items-center gap-1.5 active:scale-95"
              title="Copy launch announcement link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-[11px]">{copiedLink ? "Copied!" : "Share"}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 hover:border-white/30 text-gray-300 hover:text-white transition-all text-xs"
              title={isFullscreen ? "Exit fullscreen" : "Enter wide cinematic theater mode"}
              aria-label="Toggle full screen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ================= 4. CENTERPIECE: TYPOGRAPHY & LAUNCH DETAILS ================= */}
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 pointer-events-none">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-12 pb-8 pointer-events-auto">

            {/* Sacred Auspicious Heading (Devanagari with subtle golden glow) */}
            <div 
              className={`transform transition-all duration-1000 ${
                animStage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-950/80 via-amber-950/60 to-indigo-950/80 border border-amber-500/40 backdrop-blur-xl shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                <span className="text-amber-400 text-xs font-serif">ॐ</span>
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 font-serif drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
                  शुभ दीपावली तथा विजयादशमी
                </h2>
                <span className="text-amber-400 text-xs font-serif">ॐ</span>
              </div>
            </div>

            {/* English Tagline: Celebrating New Beginnings */}
            <div 
              className={`transform transition-all duration-1000 delay-150 ${
                animStage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <p className="text-xs sm:text-sm md:text-base font-mono uppercase tracking-[0.35em] text-cyan-300/90 font-medium drop-shadow-md">
                Celebrating New Beginnings
              </p>
            </div>

            {/* Main Headline: MY WEBSITE IS GOING LIVE */}
            <div 
              className={`relative transform transition-all duration-1000 delay-300 ${
                animStage >= 5 ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              {/* Backlight Pulse (Stage 9) */}
              <div 
                className={`absolute inset-0 bg-gradient-to-r from-amber-500/20 via-cyan-400/20 to-amber-500/20 blur-2xl rounded-full transition-opacity duration-1000 ${
                  animStage >= 9 ? "opacity-100 scale-125 animate-pulse" : "opacity-0"
                }`}
              />

              <h1 className="relative text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight font-sans uppercase leading-none drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-400">
                  MY WEBSITE IS
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-300 drop-shadow-[0_0_35px_rgba(251,191,36,0.6)]">
                  GOING LIVE
                </span>
              </h1>
            </div>

            {/* STRONGEST INFORMATION: 21 OCTOBER 2026 — 11:25 AM Nepal Time */}
            <div 
              className={`transform transition-all duration-1000 delay-500 ${
                animStage >= 7 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="relative inline-block p-1 rounded-2xl bg-gradient-to-r from-amber-500/40 via-yellow-300/60 to-cyan-400/40 shadow-[0_0_50px_rgba(245,158,11,0.35)]">
                <div className="px-6 py-4 sm:px-10 sm:py-5 rounded-[14px] bg-slate-950/85 backdrop-blur-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
                  
                  {/* Date badge */}
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span className="text-xl sm:text-2xl md:text-3xl font-extrabold font-mono tracking-wider text-white">
                      21 OCTOBER 2026
                    </span>
                  </div>

                  <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-amber-400/40 to-transparent" />

                  {/* Time badge */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="text-base sm:text-lg md:text-xl font-bold font-mono text-cyan-300 tracking-wide">
                      11:25 AM <span className="text-xs uppercase text-amber-300 font-sans tracking-widest px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">Nepal Time</span>
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* Smaller Closing Line */}
            <div 
              className={`transform transition-all duration-1000 delay-700 ${
                animStage >= 8 ? "opacity-100" : "opacity-0"
              }`}
            >
              <p className="text-xs sm:text-sm md:text-base text-gray-300/90 font-serif italic tracking-wide max-w-xl mx-auto drop-shadow-md">
                “See you at the beginning of a new digital chapter.”
              </p>
            </div>

            {/* LIVE COUNTDOWN METRICS (Days, Hours, Minutes, Seconds) */}
            <div 
              className={`pt-2 transform transition-all duration-1000 delay-900 ${
                animStage >= 9 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="inline-flex items-center gap-2 sm:gap-3 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-xl">
                
                {/* Days */}
                <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/[0.04]">
                  <span className="text-base sm:text-xl font-extrabold font-mono text-amber-400">
                    {String(timeLeft.days).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono">Days</span>
                </div>

                <span className="text-amber-500/60 font-bold font-mono">:</span>

                {/* Hours */}
                <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/[0.04]">
                  <span className="text-base sm:text-xl font-extrabold font-mono text-amber-400">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono">Hours</span>
                </div>

                <span className="text-amber-500/60 font-bold font-mono">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/[0.04]">
                  <span className="text-base sm:text-xl font-extrabold font-mono text-amber-400">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono">Mins</span>
                </div>

                <span className="text-amber-500/60 font-bold font-mono">:</span>

                {/* Seconds */}
                <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/[0.04]">
                  <span className="text-base sm:text-xl font-extrabold font-mono text-cyan-400">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-cyan-300 font-mono">Secs</span>
                </div>

                {/* Current Time reference */}
                {currentNpt && (
                  <div className="hidden lg:flex flex-col text-left pl-3 border-l border-white/10">
                    <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Kathmandu Now:</span>
                    <span className="text-[11px] font-mono text-emerald-400 font-medium">{currentNpt}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ================= 5. FOOTER TIMELINE SCRUBBER / STAGE STEPPER ================= */}
        <div className="absolute bottom-3 left-4 right-4 z-30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-gray-400 bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/5 pointer-events-auto">
          
          {/* Progress / Step Indicators 1 to 9 */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold mr-1 shrink-0">
              Sequence:
            </span>
            {[
              { id: 1, name: "Particles" },
              { id: 2, name: "Dashain" },
              { id: 3, name: "Jamara & Tika" },
              { id: 4, name: "Golden Light" },
              { id: 5, name: "Tihar Transition" },
              { id: 6, name: "Diyas" },
              { id: 7, name: "Fireworks" },
              { id: 8, name: "Cyber Glow" },
              { id: 9, name: "Launch Pulse" }
            ].map((step) => (
              <button
                key={step.id}
                onClick={() => {
                  setAnimStage(step.id);
                  if (step.id === 9) playFestiveSound("pulse");
                  else if (step.id === 7) playFestiveSound("spark");
                  else playFestiveSound("bell");
                }}
                className={`px-2 py-0.5 rounded text-[10px] transition-all shrink-0 ${
                  animStage >= step.id
                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                    : "bg-white/5 text-gray-500 hover:text-gray-300"
                }`}
                title={`Jump to step ${step.id}: ${step.name}`}
              >
                {step.id}. {step.name}
              </button>
            ))}
          </div>

          {/* Quick Action: Explore site below */}
          <div className="flex items-center gap-2 shrink-0">
            {onExploreSite && (
              <button
                onClick={onExploreSite}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-amber-400/20 text-gray-200 hover:text-amber-300 transition-all text-[11px] flex items-center gap-1 active:scale-95"
              >
                <span>Continue to Portal</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
