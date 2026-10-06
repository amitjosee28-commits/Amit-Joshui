import React, { useState, useEffect, useRef } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

// Traditional Mangal Dhun (Malshree) Shehnai Melody Notes (Frequencies in Hz)
// Iconic opening motif: Sa, Re, Ga, Pa, Dha, Sa' (Festive Malshree Dhun)
const MANGAL_DHUN_NOTES = [
  { freq: 440.0, dur: 0.45 }, // A4 (Sa)
  { freq: 493.88, dur: 0.35 }, // B4 (Re)
  { freq: 554.37, dur: 0.65 }, // C#5 (Ga)
  { freq: 659.25, dur: 0.8 }, // E5 (Pa)
  { freq: 739.99, dur: 0.5 }, // F#5 (Dha)
  { freq: 880.0, dur: 1.1 }, // A5 (Taar Sa)
  { freq: 739.99, dur: 0.4 }, // F#5
  { freq: 659.25, dur: 0.6 }, // E5
  { freq: 554.37, dur: 0.5 }, // C#5
  { freq: 493.88, dur: 0.4 }, // B4
  { freq: 440.0, dur: 1.2 }, // A4
  // Second festive phrase
  { freq: 554.37, dur: 0.4 },
  { freq: 659.25, dur: 0.5 },
  { freq: 880.0, dur: 0.9 },
  { freq: 987.77, dur: 0.4 },
  { freq: 1108.73, dur: 1.3 }
];

export default function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const isYtPlayingRef = useRef(false);

  // Smooth 3D Parallax Lerp calculation
  useEffect(() => {
    let frameId: number;
    const lerp = () => {
      setParallax((prev) => {
        const dx = prev.targetX - prev.x;
        const dy = prev.targetY - prev.y;
        if (Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) {
          return prev;
        }
        return {
          ...prev,
          x: prev.x + dx * 0.08,
          y: prev.y + dy * 0.08
        };
      });
      frameId = requestAnimationFrame(lerp);
    };
    frameId = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Desktop Mouse Parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax((prev) => ({
      ...prev,
      targetX: Math.max(-0.5, Math.min(0.5, x)),
      targetY: Math.max(-0.5, Math.min(0.5, y))
    }));
  };

  // Mobile Touch Parallax
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / rect.width - 0.5;
    const y = (touch.clientY - rect.top) / rect.height - 0.5;
    setParallax((prev) => ({
      ...prev,
      targetX: Math.max(-0.5, Math.min(0.5, x)),
      targetY: Math.max(-0.5, Math.min(0.5, y))
    }));
  };

  // Mobile Gyroscope / Device Tilt Parallax
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        const x = Math.min(Math.max(e.gamma / 25, -0.5), 0.5);
        const y = Math.min(Math.max((e.beta - 40) / 25, -0.5), 0.5);
        setParallax((prev) => ({ ...prev, targetX: x, targetY: y }));
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  // Instant Web Audio Shehnai Synthesis Engine (Plays at 0ms with zero network lag)
  const startInstantShehnaiTune = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      if (synthGainRef.current) return; // already playing

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.15);
      masterGain.connect(ctx.destination);
      synthGainRef.current = masterGain;

      // Temple singing bell harmony on start
      const bellOsc = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bellOsc.type = "sine";
      bellOsc.frequency.setValueAtTime(528, ctx.currentTime);
      bellGain.gain.setValueAtTime(0.2, ctx.currentTime);
      bellGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
      bellOsc.connect(bellGain);
      bellGain.connect(masterGain);
      bellOsc.start();
      bellOsc.stop(ctx.currentTime + 2.5);

      // Play traditional Shehnai reed melody notes
      let currentTime = ctx.currentTime + 0.1;
      const playMelodyLoop = () => {
        if (!synthGainRef.current || isYtPlayingRef.current) return;

        MANGAL_DHUN_NOTES.forEach((note) => {
          // Shehnai dual-reed harmonic oscillator
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const vibrato = ctx.createOscillator();
          const vibratoGain = ctx.createGain();
          const noteGain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          // Authentic Shehnai reedy timbre
          osc1.type = "sawtooth";
          osc2.type = "triangle";
          osc1.frequency.setValueAtTime(note.freq, currentTime);
          osc2.frequency.setValueAtTime(note.freq * 1.003, currentTime); // subtle detune

          // Natural Shehnai pitch bend & vibrato (5.5Hz)
          vibrato.frequency.setValueAtTime(5.5, currentTime);
          vibratoGain.gain.setValueAtTime(note.freq * 0.015, currentTime);
          vibrato.connect(vibratoGain);
          vibratoGain.connect(osc1.frequency);
          vibratoGain.connect(osc2.frequency);

          // Resonant acoustic chamber filter
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(note.freq * 2.2, currentTime);
          filter.Q.setValueAtTime(3.2, currentTime);

          // Note envelope with gentle legato
          noteGain.gain.setValueAtTime(0.001, currentTime);
          noteGain.gain.exponentialRampToValueAtTime(0.35, currentTime + 0.05);
          noteGain.gain.setValueAtTime(0.35, currentTime + note.dur * 0.85);
          noteGain.gain.exponentialRampToValueAtTime(0.001, currentTime + note.dur);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(noteGain);
          noteGain.connect(masterGain);

          osc1.start(currentTime);
          osc2.start(currentTime);
          vibrato.start(currentTime);

          osc1.stop(currentTime + note.dur);
          osc2.stop(currentTime + note.dur);
          vibrato.stop(currentTime + note.dur);

          currentTime += note.dur;
        });
      };

      playMelodyLoop();
    } catch (e) {
      console.warn("Instant audio synth:", e);
    }
  };

  // Fade out synth once YouTube stream takes over
  const fadeOutSynth = () => {
    if (synthGainRef.current && audioCtxRef.current) {
      isYtPlayingRef.current = true;
      try {
        const ctx = audioCtxRef.current;
        synthGainRef.current.gain.setValueAtTime(synthGainRef.current.gain.value, ctx.currentTime);
        synthGainRef.current.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        setTimeout(() => {
          synthGainRef.current = null;
        }, 1300);
      } catch (e) {}
    }
  };

  // YouTube Player initialization & zero-latency playback handler
  useEffect(() => {
    // 1. Immediately fire Web Audio so music begins at 0ms!
    startInstantShehnaiTune();

    // 2. Initialize YouTube Player API for the official Mangal Dhun video (oic6eXNWX5E)
    let checkYtInterval: NodeJS.Timeout;

    const initYt = () => {
      const YT = (window as any).YT;
      if (YT && YT.Player) {
        if (!ytPlayerRef.current) {
          ytPlayerRef.current = new YT.Player("yt-mangal-player", {
            height: "2",
            width: "2",
            videoId: "oic6eXNWX5E",
            playerVars: {
              autoplay: 1,
              controls: 0,
              loop: 1,
              playlist: "oic6eXNWX5E",
              playsinline: 1,
              rel: 0,
              enablejsapi: 1,
              modestbranding: 1
            },
            events: {
              onReady: (event: any) => {
                event.target.playVideo();
                event.target.unMute();
                event.target.setVolume(100);
              },
              onStateChange: (event: any) => {
                // When YouTube is playing (state 1), fade out the instant prelude
                if (event.data === 1) {
                  fadeOutSynth();
                }
              }
            }
          });
        }
      } else {
        // Fallback postMessage direct trigger
        if (iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "playVideo", args: [] }),
            "*"
          );
        }
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initYt();
    } else {
      checkYtInterval = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          clearInterval(checkYtInterval);
          initYt();
        }
      }, 100);
    }

    // 3. User interaction listener to bypass any strict mobile browser autoplay restrictions
    const handleGesture = () => {
      startInstantShehnaiTune();
      if (ytPlayerRef.current && ytPlayerRef.current.playVideo) {
        ytPlayerRef.current.playVideo();
        ytPlayerRef.current.unMute();
      }
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: [] }),
          "*"
        );
      }
    };

    window.addEventListener("click", handleGesture, { passive: true });
    window.addEventListener("touchstart", handleGesture, { passive: true });
    window.addEventListener("pointerdown", handleGesture, { passive: true });
    window.addEventListener("keydown", handleGesture, { passive: true });
    window.addEventListener("scroll", handleGesture, { passive: true });

    return () => {
      clearInterval(checkYtInterval);
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
      window.removeEventListener("pointerdown", handleGesture);
      window.removeEventListener("keydown", handleGesture);
      window.removeEventListener("scroll", handleGesture);
    };
  }, []);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Canvas Particle & Firework Motion Graphics Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 1920);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 1080);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
      type: "firework" | "ember" | "petal" | "cyber";
      rot?: number;
      vRot?: number;
    }

    const particles: Particle[] = [];
    const colors = [
      "#f59e0b", // Gold
      "#fbbf24", // Warm yellow
      "#ea580c", // Saffron
      "#ef4444", // Crimson
      "#38bdf8", // Neon Cyan
      "#c084fc", // Radiant Violet
      "#ffffff", // Shimmer white
      "#34d399"  // Emerald
    ];

    // Embers rising from diyas
    const emberCount = window.innerWidth < 768 ? 20 : 38;
    for (let i = 0; i < emberCount; i++) {
      particles.push({
        x: width * 0.52 + Math.random() * (width * 0.46),
        y: height * 0.6 + Math.random() * (height * 0.4),
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.4 - Math.random() * 0.8,
        size: 1.2 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * 3)],
        alpha: 0.3 + Math.random() * 0.7,
        decay: 0.002 + Math.random() * 0.004,
        type: "ember"
      });
    }

    // Marigold petals
    const petalCount = window.innerWidth < 768 ? 12 : 20;
    for (let i = 0; i < petalCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.3 + Math.random() * 0.6,
        size: 2.2 + Math.random() * 3.5,
        color: Math.random() > 0.5 ? "#f59e0b" : "#ea580c",
        alpha: 0.3 + Math.random() * 0.6,
        decay: 0.001 + Math.random() * 0.002,
        type: "petal",
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.04
      });
    }

    // Cyber particles
    for (let i = 0; i < 14; i++) {
      particles.push({
        x: width * 0.3 + Math.random() * (width * 0.4),
        y: height * 0.45 + Math.random() * (height * 0.35),
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        size: 1.2 + Math.random() * 1.8,
        color: "#38bdf8",
        alpha: 0.2 + Math.random() * 0.6,
        decay: 0.003 + Math.random() * 0.005,
        type: "cyber"
      });
    }

    // Fireworks generator in top-right night sky
    let lastFireworkTime = Date.now();
    const spawnFirework = () => {
      const fx = width * 0.68 + Math.random() * (width * 0.28);
      const fy = height * 0.08 + Math.random() * (height * 0.32);
      const burstColor = colors[Math.floor(Math.random() * colors.length)];
      const count = window.innerWidth < 768 ? 26 : 42;

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.25);
        const speed = 1.3 + Math.random() * 2.8;
        particles.push({
          x: fx,
          y: fy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.3 + Math.random() * 2,
          color: burstColor,
          alpha: 1,
          decay: 0.016 + Math.random() * 0.017,
          type: "firework"
        });
      }
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (Date.now() - lastFireworkTime > 1700) {
        spawnFirework();
        lastFireworkTime = Date.now();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.type === "firework") {
          p.vy += 0.026;
          p.vx *= 0.985;
          p.vy *= 0.985;
        } else if (p.type === "petal") {
          p.x += Math.sin(p.y * 0.015) * 0.6;
          if (p.rot !== undefined && p.vRot !== undefined) {
            p.rot += p.vRot;
          }
        }

        if (p.alpha <= 0 || p.y < -15 || p.y > height + 20 || p.x < -15 || p.x > width + 15) {
          if (p.type === "ember") {
            p.x = width * 0.52 + Math.random() * (width * 0.46);
            p.y = height * 0.8 + Math.random() * (height * 0.2);
            p.vx = (Math.random() - 0.5) * 0.5;
            p.vy = -0.4 - Math.random() * 0.8;
            p.alpha = 0.3 + Math.random() * 0.7;
          } else if (p.type === "petal") {
            p.x = Math.random() * width;
            p.y = -10;
            p.alpha = 0.4 + Math.random() * 0.5;
          } else if (p.type === "cyber") {
            p.x = width * 0.3 + Math.random() * (width * 0.4);
            p.y = height * 0.5 + Math.random() * (height * 0.3);
            p.alpha = 0.3 + Math.random() * 0.5;
          } else {
            particles.splice(i, 1);
            continue;
          }
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.type === "firework" ? 10 : p.type === "cyber" ? 6 : 4;

        if (p.type === "petal") {
          ctx.translate(p.x, p.y);
          if (p.rot) ctx.rotate(p.rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.85, 0, 0, Math.PI * 2);
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

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 w-screen h-[100dvh] bg-[#030712] flex items-center justify-center p-0 m-0 overflow-hidden select-none touch-none overscroll-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* 
        High-priority active YouTube Iframe for Mangal Dhun
        Rendered with small dimensions offscreen (not display: none) so browser thread keeps decoding active without delay
      */}
      <div 
        id="yt-mangal-player" 
        className="absolute -top-[9999px] -left-[9999px] w-[20px] h-[20px] opacity-[0.01] pointer-events-none" 
      />
      
      <iframe
        ref={iframeRef}
        src="https://www.youtube-nocookie.com/embed/oic6eXNWX5E?enablejsapi=1&autoplay=1&mute=0&loop=1&playlist=oic6eXNWX5E&controls=0&playsinline=1&modestbranding=1&rel=0"
        title="Mangal Dhun Live"
        className="absolute -top-[9999px] -left-[9999px] w-[20px] h-[20px] opacity-[0.01] pointer-events-none"
        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
      />

      {/* ================= 1. DYNAMIC AMBIENT BACKDROP ================= */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-45 pointer-events-none transition-transform duration-700 ease-out"
        style={{ 
          backgroundImage: `url('/launch-banner.jpg')`,
          transform: `scale(1.2) translate(${parallax.x * -20}px, ${parallax.y * -20}px)`
        }}
      />

      {/* Atmospheric Golden Sunrise Light Cone */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen"
        style={{
          background: "radial-gradient(ellipse at 22% 30%, rgba(251, 191, 36, 0.45) 0%, rgba(239, 68, 68, 0.15) 45%, transparent 75%)",
          transform: `translate(${parallax.x * -10}px, ${parallax.y * -10}px)`
        }}
      />

      {/* ================= 2. 3D PARALLAX MOTION POSTER (Full Device Responsive) ================= */}
      <div 
        ref={containerRef}
        className="relative z-10 w-full max-w-full h-auto max-h-[100dvh] aspect-[16/9] flex items-center justify-center overflow-hidden shadow-[0_0_90px_rgba(0,0,0,0.98)]"
        style={{
          transform: `perspective(1200px) rotateX(${parallax.y * -4}deg) rotateY(${parallax.x * 4}deg) scale(1.005)`,
          transition: "transform 0.1s ease-out"
        }}
      >
        {/* Layer 0: Master Artwork (Model Image as uploaded) */}
        <img
          src="/launch-banner.jpg"
          alt="Amit Joshi - amitjoshi.info.np | बडा दशैँ तथा शुभ दिपावली को हार्दिक मंगलमय शुभकामना - WILL BE LIVE ON 21 OCTOBER 2026, 11:25 AM Nepal Time"
          className="w-full h-full object-contain pointer-events-none relative z-0"
          style={{
            animation: "subtle-breathe 8s ease-in-out infinite"
          }}
          referrerPolicy="no-referrer"
        />

        {/* ================= 3. LUXURY CINEMATIC MOTION GRAPHICS OVERLAYS ================= */}

        {/* Feature A: Divine Goddess Durga Shakti Aura (Rotational Sacred Geometry Rays) */}
        <div 
          className="absolute top-[2%] left-[2%] w-[26%] h-[38%] pointer-events-none rounded-full z-10"
          style={{
            background: "radial-gradient(circle, rgba(253, 224, 71, 0.35) 0%, rgba(239, 68, 68, 0.2) 45%, transparent 75%)",
            animation: "durga-shakti 5s ease-in-out infinite",
            transform: `translate(${parallax.x * 8}px, ${parallax.y * 8}px)`
          }}
        />

        {/* Feature B: Golden Sunbeams in Mountain Pass */}
        <div 
          className="absolute top-[18%] left-[16%] w-[20%] h-[24%] pointer-events-none mix-blend-screen z-10"
          style={{
            background: "radial-gradient(circle, rgba(254, 240, 138, 0.55) 0%, rgba(245, 158, 11, 0.25) 50%, transparent 80%)",
            animation: "himalaya-sunbeam 6s ease-in-out infinite",
            transform: `translate(${parallax.x * -5}px, ${parallax.y * -5}px)`
          }}
        />

        {/* Feature C: Live Wind-Swaying Kite in Mountain Sky */}
        <div 
          className="absolute top-[26%] left-[17.5%] w-[3%] h-[5%] pointer-events-none z-10"
          style={{
            animation: "kite-wind 4s ease-in-out infinite",
            transform: `translate(${parallax.x * 12}px, ${parallax.y * 12}px)`
          }}
        >
          <div className="w-full h-full rounded-full bg-red-500/25 filter blur-sm" />
        </div>

        {/* Feature D: Sacred ॐ Golden Pulsing Aura */}
        <div 
          className="absolute top-[11.2%] left-[47.6%] w-[4.8%] h-[7.2%] pointer-events-none rounded-full z-10"
          style={{
            background: "radial-gradient(circle, rgba(254, 240, 138, 0.6) 0%, rgba(245, 158, 11, 0.3) 50%, transparent 85%)",
            animation: "om-pulse 3.2s ease-in-out infinite",
            transform: `translate(${parallax.x * 4}px, ${parallax.y * 4}px)`
          }}
        />

        {/* Feature E: Luxury Calligraphy Gold Light Sheen Sweep across Greeting */}
        <div 
          className="absolute top-[17%] left-[28%] w-[44%] h-[28%] pointer-events-none overflow-hidden z-10"
          style={{
            transform: `translate(${parallax.x * 6}px, ${parallax.y * 6}px)`
          }}
        >
          <div 
            className="w-[200%] h-full pointer-events-none opacity-30"
            style={{
              background: "linear-gradient(110deg, transparent 15%, rgba(254, 240, 138, 0.7) 45%, rgba(255, 255, 255, 0.95) 50%, rgba(254, 240, 138, 0.7) 55%, transparent 85%)",
              animation: "gold-sheen-sweep 5s cubic-bezier(0.4, 0, 0.2, 1) infinite"
            }}
          />
        </div>

        {/* Feature F: Cyber-Tech Hexagon Neon Breathing Border & Circuit Flow */}
        <div 
          className="absolute top-[51.5%] left-[25.5%] w-[49%] h-[27.5%] pointer-events-none rounded-2xl z-10"
          style={{
            boxShadow: "inset 0 0 30px rgba(56, 189, 248, 0.3), 0 0 45px rgba(56, 189, 248, 0.35)",
            border: "1.5px solid rgba(56, 189, 248, 0.45)",
            animation: "cyber-neon-breathe 3.5s ease-in-out infinite",
            transform: `translate(${parallax.x * 10}px, ${parallax.y * 10}px)`
          }}
        >
          {/* Laser scanning beam flowing down hexagonal container */}
          <div 
            className="w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent pointer-events-none"
            style={{
              animation: "laser-scan 4s linear infinite"
            }}
          />
        </div>

        {/* Feature G: Multi-Point Diya Flame Flickers (Tihar Lamps & Village Steps) */}
        {/* Diya 1: Main foreground brass lamp */}
        <div 
          className="absolute bottom-[16%] right-[2.5%] w-[8%] h-[12%] pointer-events-none rounded-full z-10"
          style={{
            background: "radial-gradient(circle, rgba(254, 240, 138, 0.6) 0%, rgba(245, 158, 11, 0.35) 50%, transparent 80%)",
            animation: "diya-flicker-a 1.8s ease-in-out infinite",
            transform: `translate(${parallax.x * 14}px, ${parallax.y * 14}px)`
          }}
        />

        {/* Diya 2: Mid-ground terracotta diya */}
        <div 
          className="absolute bottom-[23.5%] right-[11.2%] w-[6.5%] h-[9.5%] pointer-events-none rounded-full z-10"
          style={{
            background: "radial-gradient(circle, rgba(254, 240, 138, 0.55) 0%, rgba(245, 158, 11, 0.28) 50%, transparent 80%)",
            animation: "diya-flicker-b 2.2s ease-in-out infinite",
            transform: `translate(${parallax.x * 12}px, ${parallax.y * 12}px)`
          }}
        />

        {/* Diya 3: Village terrace illumination */}
        <div 
          className="absolute top-[51%] right-[16.5%] w-[13%] h-[16%] pointer-events-none rounded-full z-10"
          style={{
            background: "radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, rgba(234, 88, 12, 0.18) 60%, transparent 85%)",
            animation: "diya-flicker-c 2.7s ease-in-out infinite",
            transform: `translate(${parallax.x * 8}px, ${parallax.y * 8}px)`
          }}
        />

        {/* Feature H: Wet Floor Reflective Water Ripple */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[24%] pointer-events-none overflow-hidden opacity-35 mix-blend-color-dodge z-10"
          style={{
            background: "linear-gradient(180deg, transparent 0%, rgba(56, 189, 248, 0.12) 50%, rgba(245, 158, 11, 0.16) 100%)",
            animation: "water-reflections 4.5s ease-in-out infinite"
          }}
        />

        {/* ================= 4. CANVAS MOTION PARTICLES & FIREWORKS ================= */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* Discreet Fullscreen button in top corner */}
        <div className="absolute top-3 right-3 z-30 pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition-all text-xs cursor-pointer active:scale-95 shadow-xl"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes subtle-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }

        @keyframes durga-shakti {
          0%, 100% { opacity: 0.35; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.8; transform: scale(1.12) rotate(3deg); }
        }

        @keyframes himalaya-sunbeam {
          0%, 100% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        @keyframes kite-wind {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(5px, -8px) rotate(5deg); }
          50% { transform: translate(2px, -3px) rotate(1deg); }
          75% { transform: translate(-4px, 5px) rotate(-4deg); }
        }

        @keyframes om-pulse {
          0%, 100% { opacity: 0.45; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes gold-sheen-sweep {
          0% { transform: translateX(-100%); }
          35%, 100% { transform: translateX(100%); }
        }

        @keyframes cyber-neon-breathe {
          0%, 100% { 
            box-shadow: inset 0 0 25px rgba(56, 189, 248, 0.25), 0 0 35px rgba(56, 189, 248, 0.28);
            border-color: rgba(56, 189, 248, 0.35);
          }
          50% { 
            box-shadow: inset 0 0 45px rgba(56, 189, 248, 0.5), 0 0 55px rgba(192, 132, 252, 0.5);
            border-color: rgba(56, 189, 248, 0.75);
          }
        }

        @keyframes laser-scan {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.9; }
          100% { transform: translateY(220px); opacity: 0; }
        }

        @keyframes diya-flicker-a {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          25% { opacity: 0.9; transform: scale(1.08); }
          50% { opacity: 0.45; transform: scale(0.92); }
          75% { opacity: 1; transform: scale(1.14); }
        }

        @keyframes diya-flicker-b {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          30% { opacity: 0.4; transform: scale(0.9); }
          65% { opacity: 0.95; transform: scale(1.1); }
        }

        @keyframes diya-flicker-c {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          40% { opacity: 0.85; transform: scale(1.08); }
          80% { opacity: 0.5; transform: scale(0.94); }
        }

        @keyframes water-reflections {
          0%, 100% { opacity: 0.25; transform: scaleY(1); }
          50% { opacity: 0.48; transform: scaleY(1.08); }
        }
      `}</style>
    </div>
  );
}
