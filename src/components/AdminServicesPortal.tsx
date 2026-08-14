import React, { useState, useEffect } from "react";
import { ref, get, set, onValue } from "firebase/database";
import { db } from "../firebase";
import { defaultPortfolioData, PortfolioData, ServiceAdminUser } from "../utils/defaultData";
import { 
  Lock, User, Key, MessageSquare, Inbox, Phone, Mail, 
  Trash2, CheckCircle2, Clock, FileText, Image as ImageIcon, 
  Search, ShieldCheck, LogOut, RefreshCw, AlertCircle, Sparkles, 
  Filter, Users, Copy, Check, DownloadCloud, ArrowUpDown, Send
} from "lucide-react";

export default function AdminServicesPortal() {
  // Authentication states for Services Admin
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("admin_services_auth_2026") === "true";
  });
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState("");
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(() => {
    try {
      const saved = sessionStorage.getItem("admin_services_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Data states
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(defaultPortfolioData);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"applications" | "suggestions" | "subscribers">("applications");
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [bulkCopySuccess, setBulkCopySuccess] = useState(false);

  // Fetch portfolio data and allowed service admin users
  useEffect(() => {
    const portfolioRef = ref(db, "portfolio");
    const unsubscribe = onValue(portfolioRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setPortfolioData({
          ...defaultPortfolioData,
          ...val,
          serviceAdminUsers: val.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Suggestions, Applications, and Subscribers
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Suggestions
      const sugSnap = await get(ref(db, "suggestions"));
      if (sugSnap.exists()) {
        const data = sugSnap.val();
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setSuggestions(list);
      } else {
        setSuggestions([]);
      }

      // 2. Applications (checks service_applications and fallback applications)
      let appList: any[] = [];
      const serviceAppSnap = await get(ref(db, "service_applications"));
      if (serviceAppSnap.exists()) {
        const data = serviceAppSnap.val();
        appList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      }
      const legacyAppSnap = await get(ref(db, "applications"));
      if (legacyAppSnap.exists()) {
        const data = legacyAppSnap.val();
        Object.keys(data).forEach(key => {
          if (!appList.some(a => a.id === key)) {
            appList.push({ id: key, ...data[key] });
          }
        });
      }
      appList.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setApplications(appList);

      // 3. Newsletter Subscribers (from Firebase /subscribers, /portfolio/subscribers, and localStorage)
      let subsList: any[] = [];
      const subSnap = await get(ref(db, "subscribers"));
      if (subSnap.exists()) {
        const data = subSnap.val();
        subsList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      }
      const portSubSnap = await get(ref(db, "portfolio/subscribers"));
      if (portSubSnap.exists()) {
        const data = portSubSnap.val();
        Object.keys(data).forEach(key => {
          if (!subsList.some(s => s.id === key || (s.email && s.email.toLowerCase() === data[key].email?.toLowerCase()))) {
            subsList.push({ id: key, ...data[key] });
          }
        });
      }
      // Merge localStorage subscribers
      const localSubsStr = localStorage.getItem("newsletter_subscribers");
      if (localSubsStr) {
        try {
          const localSubs: any[] = JSON.parse(localSubsStr);
          localSubs.forEach(ls => {
            if (!subsList.some(s => (s.email && ls.email && s.email.toLowerCase() === ls.email.toLowerCase()) || s.id === ls.id)) {
              subsList.push(ls);
            }
          });
        } catch (e) {}
      }
      subsList.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setSubscribers(subsList);
    } catch (err) {
      console.error("Error loading services data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();

      // Realtime listener for subscribers
      const unsubSubs = onValue(ref(db, "subscribers"), () => {
        fetchData();
      });
      const unsubPortSubs = onValue(ref(db, "portfolio/subscribers"), () => {
        fetchData();
      });
      const unsubApps = onValue(ref(db, "service_applications"), () => {
        fetchData();
      });
      const unsubSugs = onValue(ref(db, "suggestions"), () => {
        fetchData();
      });

      const handleCustomSubEvent = () => {
        fetchData();
      };
      window.addEventListener("newsletter_subscribers_updated", handleCustomSubEvent);
      window.addEventListener("storage", handleCustomSubEvent);

      const interval = setInterval(fetchData, 8000); // Polling safeguard

      return () => {
        unsubSubs();
        unsubPortSubs();
        unsubApps();
        unsubSugs();
        window.removeEventListener("newsletter_subscribers_updated", handleCustomSubEvent);
        window.removeEventListener("storage", handleCustomSubEvent);
        clearInterval(interval);
      };
    }
  }, [isLoggedIn]);

  // Handle Services Admin Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const inputUser = username.trim().toLowerCase();
    const inputPin = pin.trim();

    // Check custom users defined in portfolioData.serviceAdminUsers or default
    const allowedUsers = portfolioData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers || [];
    
    // Find matching user
    const matchedUser = allowedUsers.find(
      (u: ServiceAdminUser) => u.username.toLowerCase() === inputUser && u.pin === inputPin
    );

    // Fallback default match if no custom users
    const isDefaultMatch = allowedUsers.length === 0 && inputUser === "loginadmin" && inputPin === "1860";

    if (matchedUser || isDefaultMatch) {
      const userPayload = matchedUser || { 
        id: "admin-default-1",
        username: "loginadmin", 
        name: "Primary Services Admin", 
        role: "services_admin",
        status: "active"
      };

      // Check if user is restricted
      if (userPayload.status === "restricted") {
        setAuthError("Access Restricted: This account has been disabled by the Administrator. Please contact the Master Admin.");
        return;
      }

      setIsLoggedIn(true);
      setCurrentUserInfo(userPayload);
      sessionStorage.setItem("admin_services_auth_2026", "true");
      sessionStorage.setItem("admin_services_user", JSON.stringify(userPayload));
    } else {
      setAuthError("Invalid Username or 4-Digit PIN. Please try again.");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("admin_services_auth_2026");
    sessionStorage.removeItem("admin_services_user");
  };

  // Delete Item (Application, Suggestion, or Subscriber)
  const handleDeleteItem = async (type: "applications" | "suggestions" | "subscribers", id: string) => {
    const itemLabel = type === "applications" ? "application" : type === "suggestions" ? "message" : "subscriber";
    if (!window.confirm(`Are you sure you want to delete this ${itemLabel}?`)) return;
    try {
      if (type === "subscribers") {
        const subItem = subscribers.find((s) => s.id === id);
        const targetEmail = subItem?.email?.toLowerCase();

        await set(ref(db, `subscribers/${id}`), null);
        await set(ref(db, `portfolio/subscribers/${id}`), null);

        // If email is known, purge any duplicate nodes across database
        if (targetEmail) {
          try {
            const snap1 = await get(ref(db, "subscribers"));
            if (snap1.exists()) {
              const val = snap1.val();
              for (const k of Object.keys(val)) {
                if (val[k]?.email?.toLowerCase() === targetEmail) {
                  await set(ref(db, `subscribers/${k}`), null);
                }
              }
            }
          } catch (e) {}

          try {
            const snap2 = await get(ref(db, "portfolio/subscribers"));
            if (snap2.exists()) {
              const val = snap2.val();
              for (const k of Object.keys(val)) {
                if (val[k]?.email?.toLowerCase() === targetEmail) {
                  await set(ref(db, `portfolio/subscribers/${k}`), null);
                }
              }
            }
          } catch (e) {}
        }

        // Remove from local storage
        const localSubsStr = localStorage.getItem("newsletter_subscribers");
        if (localSubsStr) {
          try {
            const localSubs: any[] = JSON.parse(localSubsStr);
            const filtered = localSubs.filter((s) => s.id !== id && (!targetEmail || s.email?.toLowerCase() !== targetEmail));
            localStorage.setItem("newsletter_subscribers", JSON.stringify(filtered));
          } catch (e) {}
        }

        window.dispatchEvent(new CustomEvent("newsletter_subscribers_updated", { detail: { id, targetEmail } }));
      } else if (type === "applications") {
        await set(ref(db, `service_applications/${id}`), null);
        await set(ref(db, `applications/${id}`), null);
      } else {
        await set(ref(db, `suggestions/${id}`), null);
      }
      
      if (selectedItem?.id === id) setSelectedItem(null);
      fetchData();
    } catch (e) {
      alert("Failed to delete item: " + e);
    }
  };

  // Toggle Read Status
  const handleToggleRead = async (type: "applications" | "suggestions", id: string, currentRead: boolean) => {
    try {
      if (type === "applications") {
        await set(ref(db, `service_applications/${id}/isRead`), !currentRead);
        await set(ref(db, `applications/${id}/isRead`), !currentRead);
      } else {
        await set(ref(db, `suggestions/${id}/isRead`), !currentRead);
      }
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Copy single email to clipboard
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  // Copy all subscriber emails
  const handleCopyAllSubscriberEmails = () => {
    const emails = subscribers.map(s => s.email).filter(Boolean).join(", ");
    if (!emails) return;
    navigator.clipboard.writeText(emails);
    setBulkCopySuccess(true);
    setTimeout(() => setBulkCopySuccess(false), 3000);
  };

  // Export Subscribers to CSV
  const handleExportSubscribersCSV = () => {
    if (subscribers.length === 0) {
      alert("No subscribers to export.");
      return;
    }
    const headers = ["ID", "Name", "Email", "Subscribed Date & Time", "Status"];
    const rows = subscribers.map(s => [
      `"${s.id || ""}"`,
      `"${(s.name || "").replace(/"/g, '""')}"`,
      `"${(s.email || "").replace(/"/g, '""')}"`,
      `"${(s.subscribedAt || "").replace(/"/g, '""')}"`,
      `"${(s.status || "active").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `newsletter_subscribers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered lists
  const filteredApplications = applications.filter((app) => {
    const q = searchTerm.toLowerCase();
    return (
      app.fullName?.toLowerCase().includes(q) ||
      app.phone?.toLowerCase().includes(q) ||
      app.serviceTitle?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q)
    );
  });

  const filteredSuggestions = suggestions.filter((sug) => {
    const q = searchTerm.toLowerCase();
    return (
      sug.name?.toLowerCase().includes(q) ||
      sug.contact?.toLowerCase().includes(q) ||
      sug.message?.toLowerCase().includes(q)
    );
  });

  const filteredSubscribers = subscribers.filter((sub) => {
    const q = searchTerm.toLowerCase();
    return (
      sub.name?.toLowerCase().includes(q) ||
      sub.email?.toLowerCase().includes(q) ||
      sub.subscribedAt?.toLowerCase().includes(q)
    );
  });

  const unreadAppsCount = applications.filter(a => !a.isRead).length;
  const unreadSugsCount = suggestions.filter(s => !s.isRead).length;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-amber-50 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 mb-3 shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-white tracking-wide">
              Services & Messages Portal
            </h1>
            <p className="text-xs text-amber-300/80 mt-1 uppercase tracking-widest font-mono">
              Restricted Executive Service Panel
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-amber-200/80 mb-1">
                Admin Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. loginadmin"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-amber-200/80 mb-1">
                4-Digit PIN Code
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none transition-all letter-spacing-widest text-center text-lg font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer font-mono"
            >
              Authenticate Service Portal
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <a 
              href="./"
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              ← Return to Main Portal Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Header Bar */}
      <header className="bg-slate-900 border-b border-amber-500/30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-serif text-white">
              Admin Services & Submissions Portal
            </h1>
            <p className="text-xs text-amber-400/80 font-mono">
              Logged in as: <span className="font-bold text-white">{currentUserInfo?.name || currentUserInfo?.username || "loginadmin"}</span>
              <span className="ml-2 text-slate-400 font-normal">({currentUserInfo?.role || "Services Admin"})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Refresh Data
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl gap-1 shadow-lg">
          <button
            onClick={() => { setActiveTab("applications"); setSelectedItem(null); }}
            className={`py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "applications"
                ? "bg-amber-500 text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Service Applications</span>
            {unreadAppsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-bold">
                {unreadAppsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab("suggestions"); setSelectedItem(null); }}
            className={`py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "suggestions"
                ? "bg-amber-500 text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Suggestions & Messages</span>
            {unreadSugsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-bold">
                {unreadSugsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab("subscribers"); setSelectedItem(null); }}
            className={`py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "subscribers"
                ? "bg-amber-500 text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Newsletter Subscribers</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              {subscribers.length}
            </span>
          </button>
        </div>

        {/* ================= SUBSCRIBERS TAB: TABLE VIEW ================= */}
        {activeTab === "subscribers" ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-cyan-400" />
                  <span>Newsletter Subscribers Directory</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  All users who registered through the footer newsletter form are stored securely here.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyAllSubscriberEmails}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow"
                  title="Copy all emails to clipboard"
                >
                  {bulkCopySuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300 font-bold">Emails Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-cyan-400" />
                      <span>Copy All Emails ({subscribers.length})</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleExportSubscribersCSV}
                  className="px-3.5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow"
                  title="Export to CSV file"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Search filter for subscribers */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subscribers by name, email, or date..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Table Format for Subscribers */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Subscriber Name</th>
                    <th className="py-3.5 px-4">Email Address</th>
                    <th className="py-3.5 px-4">Subscribed Date & Time</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                        {searchTerm ? "No subscribers match your search query." : "No newsletter subscribers registered yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub, index) => (
                      <tr key={sub.id || index} className="hover:bg-slate-900/50 transition-colors group">
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {sub.name || "Subscriber"}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center space-x-2">
                            <a 
                              href={`mailto:${sub.email}`} 
                              className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors select-all"
                            >
                              {sub.email}
                            </a>
                            <button
                              onClick={() => handleCopyEmail(sub.email)}
                              className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Copy email to clipboard"
                            >
                              {copiedEmail === sub.email ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400/80" />
                            <span>{sub.subscribedAt || (sub.timestamp ? new Date(sub.timestamp).toLocaleString() : "N/A")}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteItem("subscribers", sub.id)}
                            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 hover:text-white border border-red-900/50 transition-colors cursor-pointer"
                            title="Delete Subscriber Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs font-mono text-slate-400">
              <span>Showing {filteredSubscribers.length} of {subscribers.length} total active subscribers</span>
              <span>Subscribers data synchronizes in realtime with Firebase Cloud</span>
            </div>

          </div>
        ) : (
          /* ================= APPLICATIONS & SUGGESTIONS 2-COLUMN VIEW ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: List */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${activeTab === "applications" ? "applications by name/phone..." : "messages..."}`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Items List */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden max-h-[600px] overflow-y-auto space-y-2 p-2">
                {activeTab === "applications" ? (
                  filteredApplications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs font-mono">
                      No service applications found.
                    </div>
                  ) : (
                    filteredApplications.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => setSelectedItem(app)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                          selectedItem?.id === app.id
                            ? "bg-amber-500/15 border-amber-500/60 text-white shadow-lg"
                            : app.isRead
                            ? "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                            : "bg-amber-950/20 border-amber-500/30 text-white font-medium"
                        }`}
                      >
                        {!app.isRead && (
                          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-amber-300 truncate max-w-[200px]">
                            {app.serviceTitle || "Service Application"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {app.timestamp ? new Date(app.timestamp).toLocaleDateString() : ""}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-white">{app.fullName || "Anonymous"}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                          <span>📞 {app.phone || "N/A"}</span>
                          {app.email && <span>📧 {app.email}</span>}
                        </p>
                      </div>
                    ))
                  )
                ) : (
                  filteredSuggestions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs font-mono">
                      No messages or suggestions found.
                    </div>
                  ) : (
                    filteredSuggestions.map((sug) => (
                      <div
                        key={sug.id}
                        onClick={() => setSelectedItem(sug)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                          selectedItem?.id === sug.id
                            ? "bg-amber-500/15 border-amber-500/60 text-white shadow-lg"
                            : sug.isRead
                            ? "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                            : "bg-amber-950/20 border-amber-500/30 text-white font-medium"
                        }`}
                      >
                        {!sug.isRead && (
                          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-white">
                            {sug.name || "Customer Feedback"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sug.timestamp ? new Date(sug.timestamp).toLocaleDateString() : ""}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                          {sug.message || "No content message."}
                        </p>
                        {sug.contact && (
                          <p className="text-[11px] text-amber-400 mt-1 font-mono">
                            Contact: {sug.contact}
                          </p>
                        )}
                      </div>
                    ))
                  )
                )}
              </div>
            </div>

            {/* Right Column: Detailed View */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col min-h-[500px]">
              {selectedItem ? (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header Actions */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                      <div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {activeTab === "applications" ? "Service Form Submission" : "Customer Message"}
                        </span>
                        <h2 className="text-xl font-bold font-serif text-white mt-2">
                          {activeTab === "applications" 
                            ? selectedItem.serviceTitle || "Application Details"
                            : selectedItem.name || "Feedback Message"}
                        </h2>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Submitted: {selectedItem.timestamp ? new Date(selectedItem.timestamp).toLocaleString() : "N/A"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleRead(activeTab as any, selectedItem.id, !!selectedItem.isRead)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                          {selectedItem.isRead ? "Mark Unread" : "Mark Read"}
                        </button>

                        <button
                          onClick={() => handleDeleteItem(activeTab as any, selectedItem.id)}
                          className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 rounded-lg text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Details Body */}
                    {activeTab === "applications" ? (
                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div>
                            <span className="text-slate-400 font-mono block">Applicant Full Name</span>
                            <span className="text-sm font-bold text-white block mt-0.5">{selectedItem.fullName || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-mono block">Phone / WhatsApp</span>
                            <a href={`https://wa.me/${selectedItem.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-amber-400 hover:underline block mt-0.5">
                              {selectedItem.phone || "N/A"}
                            </a>
                          </div>
                          <div>
                            <span className="text-slate-400 font-mono block">Email Address</span>
                            <span className="text-sm font-bold text-white block mt-0.5">{selectedItem.email || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-mono block">Service Selected</span>
                            <span className="text-sm font-bold text-amber-300 block mt-0.5">{selectedItem.serviceTitle || "N/A"}</span>
                          </div>
                        </div>

                        {selectedItem.customResponses && (
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <span className="text-amber-400 font-bold uppercase tracking-wider block mb-2 font-mono">
                              Applicant Answers & Requirements
                            </span>
                            <p className="whitespace-pre-line text-slate-200 leading-relaxed font-sans">
                              {selectedItem.customResponses}
                            </p>
                          </div>
                        )}

                        {/* Attached Files & Photos */}
                        {(selectedItem.pdfUrl || selectedItem.photo1Url || selectedItem.photo2Url || selectedItem.photo3Url || selectedItem.photo4Url) && (
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                            <span className="text-amber-400 font-bold uppercase tracking-wider block font-mono">
                              Attached Documents & Photos
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {selectedItem.pdfUrl && (
                                <a href={selectedItem.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-lg flex flex-col items-center justify-center gap-1 text-center transition-all">
                                  <FileText className="w-6 h-6 text-red-400" />
                                  <span className="text-[10px] text-slate-300 truncate w-full font-mono">View Attached PDF</span>
                                </a>
                              )}
                              {[selectedItem.photo1Url, selectedItem.photo2Url, selectedItem.photo3Url, selectedItem.photo4Url].filter(Boolean).map((img, idx) => (
                                <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="relative group overflow-hidden rounded-lg border border-slate-800 h-24">
                                  <img src={img} alt={`Attached ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 text-xs">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                          <div>
                            <span className="text-slate-400 font-mono block">Sender Name</span>
                            <span className="text-sm font-bold text-white block">{selectedItem.name || "Anonymous"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-mono block">Contact Details</span>
                            <span className="text-sm font-bold text-amber-400 block">{selectedItem.contact || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-mono block">Message Content</span>
                            <p className="mt-2 text-slate-200 text-sm whitespace-pre-line leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
                              {selectedItem.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Print Receipt Action */}
                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-lg flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      Print Details Receipt
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                  <Inbox className="w-12 h-12 text-slate-700" />
                  <p className="text-sm font-mono">Select an application or message from the left to view full details.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
