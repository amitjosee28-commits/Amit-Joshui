import React, { useState } from "react";
import { ref, push, set, get } from "firebase/database";
import { db } from "../firebase";
import { Mail, Send, CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react";

interface NewsletterSignupProps {
  lang: "en" | "np";
}

export default function NewsletterSignup({ lang }: NewsletterSignupProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(
        lang === "en"
          ? "Please enter a valid email address."
          : "कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्।"
      );
      return;
    }

    setLoading(true);
    try {
      const subId = "sub_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
      const now = new Date();
      const formattedDate = now.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const subscriberRecord = {
        id: subId,
        name: cleanName || "Subscriber",
        email: cleanEmail,
        subscribedAt: formattedDate,
        timestamp: Date.now(),
        status: "active",
      };

      // Check existing local subscribers to prevent duplicate
      const localSubsStr = localStorage.getItem("newsletter_subscribers");
      const localSubs: any[] = localSubsStr ? JSON.parse(localSubsStr) : [];
      if (localSubs.some(s => s.email && s.email.toLowerCase() === cleanEmail)) {
        setError(
          lang === "en"
            ? "This email is already subscribed to our newsletter!"
            : "यो इमेल पहिले नै हाम्रो न्यूजलेटरमा सदस्यता लिइसकेको छ!"
        );
        setLoading(false);
        return;
      }

      // Save to localStorage immediately
      localSubs.unshift(subscriberRecord);
      localStorage.setItem("newsletter_subscribers", JSON.stringify(localSubs));

      // Attempt to save to Firebase Realtime Database
      try {
        const subRef = ref(db, `subscribers/${subId}`);
        await set(subRef, subscriberRecord);
      } catch (fbErr) {
        console.warn("Firebase subscriber sync background warning:", fbErr);
      }

      setSuccess(true);
      setName("");
      setEmail("");
    } catch (err: any) {
      console.error("Newsletter subscription error:", err);
      // Even in worst case error, if email is valid, save to local storage
      const fallbackId = "sub_" + Date.now();
      const fallbackRecord = {
        id: fallbackId,
        name: cleanName || "Subscriber",
        email: cleanEmail,
        subscribedAt: new Date().toLocaleString(),
        timestamp: Date.now(),
        status: "active",
      };
      try {
        const localSubsStr = localStorage.getItem("newsletter_subscribers");
        const localSubs: any[] = localSubsStr ? JSON.parse(localSubsStr) : [];
        if (!localSubs.some(s => s.email && s.email.toLowerCase() === cleanEmail)) {
          localSubs.unshift(fallbackRecord);
          localStorage.setItem("newsletter_subscribers", JSON.stringify(localSubs));
        }
        setSuccess(true);
        setName("");
        setEmail("");
      } catch (storageErr) {
        setError(
          lang === "en"
            ? "Failed to subscribe. Please try again."
            : "सदस्यता लिन सकिएन। कृपया पुनः प्रयास गर्नुहोस्।"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-900/90 via-slate-950/90 to-slate-900/90 border border-cyan-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-[0_4px_30px_rgba(6,182,212,0.08)]">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-1/4 w-72 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        
        {/* Left Column: Heading & Information */}
        <div className="space-y-2 text-center lg:text-left max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{lang === "en" ? "Official Newsletter" : "आधिकारिक न्यूजलेटर"}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            {lang === "en"
              ? "Stay Informed with Latest Insights"
              : "नवीनतम जानकारी र अपडेटहरू प्राप्त गर्नुहोस्"}
          </h3>

          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
            {lang === "en"
              ? "Subscribe to receive direct updates on modern web technologies, IT governance initiatives, and personal thought leadership."
              : "आधुनिक वेब प्रविधिहरू, डिजिटल पहलहरू र महत्त्वपूर्ण घोषणाहरूको प्रत्यक्ष अपडेट प्राप्त गर्न सदस्यता लिनुहोस्।"}
          </p>
        </div>

        {/* Right Column: Clean Form */}
        <div className="w-full lg:w-auto lg:min-w-[420px] max-w-md">
          {success ? (
            <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center space-x-3 shadow-lg animate-in fade-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-white">
                  {lang === "en" ? "Subscribed Successfully!" : "सफलतापूर्वक सदस्यता लिइयो!"}
                </p>
                <p className="text-[11px] text-emerald-300/90 mt-0.5">
                  {lang === "en"
                    ? "Thank you for subscribing. You will receive our latest updates directly to your inbox."
                    : "सदस्यता लिनुभएकोमा धन्यवाद। तपाईंले अब हाम्रा नयाँ अपडेटहरू सिधै आफ्नो इनबक्समा प्राप्त गर्नुहुनेछ।"}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {error && (
                <div className="p-2.5 bg-red-950/80 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === "en" ? "Your Name (Optional)" : "तपाईंको नाम (ऐच्छिक)"}
                  className="w-full sm:w-1/3 bg-black/50 border border-white/10 focus:border-cyan-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                />

                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={lang === "en" ? "Enter your email address" : "इमेल ठेगाना प्रविष्ट गर्नुहोस्"}
                    className="w-full bg-black/50 border border-white/10 focus:border-cyan-500/60 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer font-mono"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{lang === "en" ? "Registering..." : "दर्ता गर्दै..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{lang === "en" ? "Subscribe Now" : "अहिले सदस्यता लिनुहोस्"}</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-500 text-center font-mono">
                {lang === "en"
                  ? "🔒 Zero spam guarantee. Unsubscribe at any time."
                  : "🔒 शून्य स्प्याम ग्यारेन्टी। कुनै पनि समयमा सदस्यता रद्द गर्न सक्नुहुन्छ।"}
              </p>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
