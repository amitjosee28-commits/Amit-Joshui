import React, { useState } from "react";
import { ref, set, get, remove } from "firebase/database";
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

export default function NewsletterSignup() {
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
      setError("Please enter a valid email address.");
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
      } catch (firebaseErr) {
        console.warn("Firebase /subscribers write error:", firebaseErr);
      }

      try {
        await set(ref(db, `portfolio/subscribers/${subId}`), subscriberRecord);
      } catch (portErr) {
        console.warn("Firebase /portfolio/subscribers write error:", portErr);
      }

      setSuccess(true);
      setName("");
      setEmail("");
    } catch (err: any) {
      console.error("Newsletter subscription error:", err);
      setError(err?.message || "Unable to complete subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Unsubscribe & Purge handler
  const handlePurgeEmail = async () => {
    if (!duplicateEmail) return;
    setPurging(true);
    setError("");

    try {
      // 1. Purge from Firebase /subscribers
      try {
        const snap = await get(ref(db, "subscribers"));
        if (snap.exists()) {
          const val = snap.val();
          for (const key of Object.keys(val)) {
            if (val[key]?.email?.toLowerCase() === duplicateEmail.toLowerCase()) {
              await remove(ref(db, `subscribers/${key}`));
            }
          }
        }
      } catch (e) {
        console.warn("Error purging from /subscribers:", e);
      }

      // 2. Purge from Firebase /portfolio/subscribers
      try {
        const portSnap = await get(ref(db, "portfolio/subscribers"));
        if (portSnap.exists()) {
          const val = portSnap.val();
          for (const key of Object.keys(val)) {
            if (val[key]?.email?.toLowerCase() === duplicateEmail.toLowerCase()) {
              await remove(ref(db, `portfolio/subscribers/${key}`));
            }
          }
        }
      } catch (e) {
        console.warn("Error purging from /portfolio/subscribers:", e);
      }

      // 3. Purge from localStorage
      try {
        const localSubsStr = localStorage.getItem("newsletter_subscribers");
        if (localSubsStr) {
          const localSubs: any[] = JSON.parse(localSubsStr);
          const filtered = localSubs.filter((s) => s.email?.toLowerCase() !== duplicateEmail.toLowerCase());
          localStorage.setItem("newsletter_subscribers", JSON.stringify(filtered));
        }
      } catch (localErr) {
        console.warn("Error purging from localStorage:", localErr);
      }

      setPurgeSuccess(true);
      setDuplicateEmail(null);
      setEmail("");
      setName("");
    } catch (err: any) {
      console.error("Error purging email:", err);
      setError("Failed to purge email from database. Please try again.");
    } finally {
      setPurging(false);
    }
  };

  return (
    <section id="newsletter-section" className="py-16 relative border-t border-slate-200/60 dark:border-white/5 scroll-mt-24">
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        
        <div className="bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-cyan-500/10 border border-amber-500/20 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {/* Subtle Background Glow Accent */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-xl mx-auto space-y-3">
            
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400">
              <Mail className="h-4 w-4" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase">
                Stay Updated & Informed
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Subscribe to Tech & Policy Dispatch
            </h2>

            <p className="text-slate-600 dark:text-gray-400 text-xs md:text-sm leading-relaxed">
              Receive curated articles, technical deep-dives, government digital updates, and software release alerts directly to your inbox.
            </p>

          </div>

          {/* Form / States Section */}
          <div className="mt-8 max-w-md mx-auto">
            
            {/* SUCCESS STATE */}
            {success && (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3 animate-in fade-in zoom-in-95">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Subscription Confirmed!
                </h3>
                <p className="text-xs text-slate-600 dark:text-gray-300">
                  Thank you for subscribing. You will receive official updates and editorial alerts.
                </p>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="mt-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Subscribe another email &rarr;
                </button>
              </div>
            )}

            {/* DUPLICATE DETECTED -> UNSUBSCRIBE / PURGE DIALOG */}
            {duplicateEmail && (
              <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Email Already Registered
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-gray-300">
                      The email <strong className="text-amber-600 dark:text-amber-400 font-mono">{duplicateEmail}</strong> is already in our subscription list.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handlePurgeEmail}
                    disabled={purging}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-400 border border-red-500/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {purging ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>Unsubscribe & Purge Email</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDuplicateEmail(null);
                      setEmail("");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                  >
                    Keep Subscribed
                  </button>
                </div>
              </div>
            )}

            {/* PURGE SUCCESS STATE */}
            {purgeSuccess && (
              <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-center space-y-3 animate-in fade-in">
                <UserX className="h-10 w-10 text-red-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Email Successfully Unsubscribed & Purged
                </h3>
                <p className="text-xs text-slate-600 dark:text-gray-300">
                  Your email has been completely removed from our newsletter database and active mailing records.
                </p>
                <button
                  type="button"
                  onClick={() => setPurgeSuccess(false)}
                  className="mt-2 text-xs font-mono font-bold text-slate-700 dark:text-gray-300 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Subscribe again</span>
                </button>
              </div>
            )}

            {/* STANDARD SUBSCRIPTION FORM */}
            {!success && !duplicateEmail && !purgeSuccess && (
              <form onSubmit={handleSubmit} className="space-y-3">
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name (Optional)"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 font-sans shadow-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 font-sans shadow-sm"
                  />
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold uppercase text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 shrink-0 font-sans"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Subscribe</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 dark:text-gray-400 font-mono pt-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>No spam. One-click unsubscribe supported at any time.</span>
                </div>

              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
