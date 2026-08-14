import React, { useState } from "react";
import { ref, set, get } from "firebase/database";
import { db } from "../firebase";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  Trash2,
  UserX,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

interface NewsletterSignupProps {
  lang: "en" | "np";
}

export default function NewsletterSignup({ lang }: NewsletterSignupProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  // Unsubscribe / Purge flow states
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);

  // Helper to find all matches in Firebase & localStorage
  const checkEmailExists = async (targetEmail: string) => {
    let exists = false;

    // Check Firebase /subscribers
    try {
      const snap = await get(ref(db, "subscribers"));
      if (snap.exists()) {
        const val = snap.val();
        if (Object.values(val).some((s: any) => s?.email?.toLowerCase() === targetEmail)) {
          exists = true;
        }
      }
    } catch (e) {
      console.warn("Error checking /subscribers:", e);
    }

    // Check Firebase /portfolio/subscribers
    try {
      const portSnap = await get(ref(db, "portfolio/subscribers"));
      if (portSnap.exists()) {
        const val = portSnap.val();
        if (Object.values(val).some((s: any) => s?.email?.toLowerCase() === targetEmail)) {
          exists = true;
        }
      }
    } catch (e) {
      console.warn("Error checking /portfolio/subscribers:", e);
    }

    // Check localStorage
    try {
      const localStr = localStorage.getItem("newsletter_subscribers");
      if (localStr) {
        const localSubs: any[] = JSON.parse(localStr);
        if (localSubs.some((s) => s.email?.toLowerCase() === targetEmail)) {
          exists = true;
        }
      }
    } catch (e) {
      console.warn("Error checking local storage:", e);
    }

    return exists;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setDuplicateEmail(null);
    setPurgeSuccess(false);

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
      // 1. Check if email is already subscribed
      const alreadySubscribed = await checkEmailExists(cleanEmail);
      if (alreadySubscribed) {
        setDuplicateEmail(cleanEmail);
        setLoading(false);
        return;
      }

      // 2. Create fresh subscriber record
      const subId = "sub_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
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

      // 3. Save to Local Storage immediately
      try {
        const localSubsStr = localStorage.getItem("newsletter_subscribers");
        const localSubs: any[] = localSubsStr ? JSON.parse(localSubsStr) : [];
        localSubs.unshift(subscriberRecord);
        localStorage.setItem("newsletter_subscribers", JSON.stringify(localSubs));
      } catch (localErr) {
        console.warn("Local storage write error:", localErr);
      }

      // 4. Save to Firebase Database under /subscribers and /portfolio/subscribers
      try {
        await set(ref(db, `subscribers/${subId}`), subscriberRecord);
      } catch (fbErr1) {
        console.warn("Direct Firebase write to /subscribers warning:", fbErr1);
      }

      try {
        await set(ref(db, `portfolio/subscribers/${subId}`), subscriberRecord);
      } catch (fbErr2) {
        console.warn("Direct Firebase write to /portfolio/subscribers warning:", fbErr2);
      }

      // 5. Notify any listening admin portal windows
      window.dispatchEvent(
        new CustomEvent("newsletter_subscribers_updated", { detail: subscriberRecord })
      );

      setSuccess(true);
      setName("");
      setEmail("");
    } catch (err: any) {
      console.error("Newsletter subscription error:", err);
      setError(
        lang === "en"
          ? "Failed to subscribe. Please try again."
          : "सदस्यता लिन सकिएन। कृपया पुनः प्रयास गर्नुहोस्।"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Unsubscribe and Purge from all collections
  const handlePurgeEmail = async (targetEmail: string) => {
    setPurging(true);
    setError("");
    try {
      // 1. Purge from Firebase /subscribers
      try {
        const snap = await get(ref(db, "subscribers"));
        if (snap.exists()) {
          const val = snap.val();
          for (const key of Object.keys(val)) {
            if (val[key]?.email?.toLowerCase() === targetEmail) {
              await set(ref(db, `subscribers/${key}`), null);
            }
          }
        }
      } catch (fbErr1) {
        console.warn("Error purging from /subscribers:", fbErr1);
      }

      // 2. Purge from Firebase /portfolio/subscribers
      try {
        const portSnap = await get(ref(db, "portfolio/subscribers"));
        if (portSnap.exists()) {
          const val = portSnap.val();
          for (const key of Object.keys(val)) {
            if (val[key]?.email?.toLowerCase() === targetEmail) {
              await set(ref(db, `portfolio/subscribers/${key}`), null);
            }
          }
        }
      } catch (fbErr2) {
        console.warn("Error purging from /portfolio/subscribers:", fbErr2);
      }

      // 3. Purge from LocalStorage
      try {
        const localSubsStr = localStorage.getItem("newsletter_subscribers");
        if (localSubsStr) {
          const localSubs: any[] = JSON.parse(localSubsStr);
          const filtered = localSubs.filter(
            (s) => s.email?.toLowerCase() !== targetEmail
          );
          localStorage.setItem("newsletter_subscribers", JSON.stringify(filtered));
        }
      } catch (localErr) {
        console.warn("Error purging from local storage:", localErr);
      }

      // 4. Notify admin portal
      window.dispatchEvent(
        new CustomEvent("newsletter_subscribers_updated", { detail: { purgedEmail: targetEmail } })
      );

      setDuplicateEmail(null);
      setPurgeSuccess(true);
      setEmail("");
      setName("");
    } catch (err: any) {
      console.error("Error purging email:", err);
      setError(
        lang === "en"
          ? "Failed to unsubscribe. Please try again."
          : "सदस्यता रद्द गर्न सकिएन। कृपया पुनः प्रयास गर्नुहोस्।"
      );
    } finally {
      setPurging(false);
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

        {/* Right Column: Dynamic Form Area */}
        <div className="w-full lg:w-auto lg:min-w-[420px] max-w-md">
          
          {/* 1. DUPLICATE EMAIL DETECTED - UNSUBSCRIBE / PURGE OPTION */}
          {duplicateEmail ? (
            <div className="p-4 bg-amber-950/80 border border-amber-500/40 rounded-xl text-amber-100 text-xs shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="font-bold text-white text-sm">
                    {lang === "en" ? "Already Subscribed!" : "पहिले नै सदस्यता लिइएको छ!"}
                  </p>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    {lang === "en" ? (
                      <>
                        The email <strong className="text-white font-mono">{duplicateEmail}</strong> is currently registered in our newsletter database.
                      </>
                    ) : (
                      <>
                        इमेल ठेगाना <strong className="text-white font-mono">{duplicateEmail}</strong> पहिले नै हाम्रो न्यूजलेटर डाटाबेसमा दर्ता गरिएको छ।
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={purging}
                  onClick={() => handlePurgeEmail(duplicateEmail)}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {purging ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{lang === "en" ? "Purging..." : "हटाउँदै..."}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === "en" ? "Unsubscribe & Purge" : "सदस्यता रद्द र मेटाउनुहोस्"}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={purging}
                  onClick={() => setDuplicateEmail(null)}
                  className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === "en" ? "Cancel" : "रद्द गर्नुहोस्"}</span>
                </button>
              </div>
            </div>
          ) : purgeSuccess ? (
            /* 2. PURGE / UNSUBSCRIBE SUCCESS NOTIFICATION */
            <div className="p-4 bg-slate-900/90 border border-emerald-500/40 rounded-xl text-xs space-y-3 shadow-xl animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-white text-sm">
                    {lang === "en" ? "Unsubscribed Successfully" : "सदस्यता सफलतापूर्वक रद्द गरियो"}
                  </p>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    {lang === "en"
                      ? "Your email has been completely purged from our newsletter database. You will no longer receive updates."
                      : "तपाईंको इमेल हाम्रो डाटाबेसबाट पूर्ण रूपमा हटाइयो। तपाईंले अब उप्रान्त कुनै इमेल प्राप्त गर्नुहुने छैन।"}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPurgeSuccess(false)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === "en" ? "Subscribe Again" : "फेरि सदस्यता लिनुहोस्"}</span>
                </button>
              </div>
            </div>
          ) : success ? (
            /* 3. NEW SUBSCRIPTION SUCCESS NOTIFICATION */
            <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs space-y-3 shadow-lg animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-sm">
                    {lang === "en" ? "Subscribed Successfully!" : "सफलतापूर्वक सदस्यता लिइयो!"}
                  </p>
                  <p className="text-[11px] text-emerald-300/90 mt-0.5 leading-relaxed">
                    {lang === "en"
                      ? "Thank you for subscribing. You are now registered and will receive our latest updates directly to your inbox."
                      : "सदस्यता लिनुभएकोमा धन्यवाद। तपाईंले अब हाम्रा नयाँ अपडेटहरू सिधै आफ्नो इनबक्समा प्राप्त गर्नुहुनेछ।"}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/20 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === "en" ? "Add Another Email" : "अर्को इमेल थप्नुहोस्"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* 4. DEFAULT SIGNUP FORM */
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
                    <span>{lang === "en" ? "Checking & Registering..." : "जाँच तथा दर्ता गर्दै..."}</span>
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
                  ? "🔒 Zero spam guarantee. Unsubscribe and purge data at any time."
                  : "🔒 शून्य स्प्याम ग्यारेन्टी। कुनै पनि समयमा सदस्यता रद्द र डाटा मेटाउन सक्नुहुन्छ।"}
              </p>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

