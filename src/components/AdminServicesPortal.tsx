import React, { useState, useEffect } from "react";
import { ref, get, set, onValue } from "firebase/database";
import { db } from "../firebase";
import { defaultPortfolioData, PortfolioData, ServiceAdminUser } from "../utils/defaultData";
import { 
  Lock, User, Key, MessageSquare, Inbox, Phone, Mail, 
  Trash2, CheckCircle2, Clock, FileText, Image as ImageIcon, 
  Search, ShieldCheck, LogOut, RefreshCw, AlertCircle, Sparkles, Filter
} from "lucide-react";

export default function AdminServicesPortal() {
  // Authentication states for Services Admin
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("admin_services_auth_2026") === "true";
  });
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState("");
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);

  // Data states
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(defaultPortfolioData);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"applications" | "suggestions">("applications");
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch portfolio data and allowed service admin users
  useEffect(() => {
    const portfolioRef = ref(db, "portfolio");
    onValue(portfolioRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setPortfolioData({
          ...defaultPortfolioData,
          ...val,
          serviceAdminUsers: val.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers
        });
      }
    });
  }, []);

  // Fetch Suggestions and Applications
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

      // 2. Applications
      const appSnap = await get(ref(db, "applications"));
      if (appSnap.exists()) {
        const data = appSnap.val();
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setApplications(list);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error("Error loading services data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Handle Services Admin Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const inputUser = username.trim().toLowerCase();
    const inputPin = pin.trim();

    // Check default credentials (loginadmin / 1860) or any custom users defined in portfolioData.serviceAdminUsers
    const allowedUsers = portfolioData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers || [];
    
    // Default fallback check
    const isDefaultMatch = inputUser === "loginadmin" && inputPin === "1860";
    const customUserMatch = allowedUsers.find(
      (u: ServiceAdminUser) => u.username.toLowerCase() === inputUser && u.pin === inputPin
    );

    if (isDefaultMatch || customUserMatch) {
      setIsLoggedIn(true);
      const userPayload = customUserMatch || { username: "loginadmin", name: "Default Service Admin", role: "services_admin" };
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

  // Delete Item (Application or Suggestion)
  const handleDeleteItem = async (type: "applications" | "suggestions", id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type === "applications" ? "application" : "message"}?`)) return;
    try {
      await set(ref(db, `${type}/${id}`), null);
      if (selectedItem?.id === id) setSelectedItem(null);
      fetchData();
    } catch (e) {
      alert("Failed to delete item: " + e);
    }
  };

  // Toggle Read Status
  const handleToggleRead = async (type: "applications" | "suggestions", id: string, currentRead: boolean) => {
    try {
      await set(ref(db, `${type}/${id}/isRead`), !currentRead);
      fetchData();
    } catch (e) {
      console.error(e);
    }
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
                  placeholder="e.g. 1860"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none transition-all letter-spacing-widest text-center text-lg font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-95"
            >
              Authenticate Service Portal
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <a 
              href="/"
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
              Admin Services & Form Fillups Portal
            </h1>
            <p className="text-xs text-amber-400/80 font-mono">
              Logged in as: <span className="font-bold text-white">{currentUserInfo?.username || "loginadmin"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Refresh Data
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Navigation Tabs & Listing */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Tab Selection Controls */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => { setActiveTab("applications"); setSelectedItem(null); }}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 ${
                activeTab === "applications"
                  ? "bg-amber-500 text-slate-950 shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              Service Applications
              {unreadAppsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-bold">
                  {unreadAppsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("suggestions"); setSelectedItem(null); }}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 ${
                activeTab === "suggestions"
                  ? "bg-amber-500 text-slate-950 shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Suggestions & Messages
              {unreadSugsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-bold">
                  {unreadSugsCount}
                </span>
              )}
            </button>
          </div>

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
                <div className="p-8 text-center text-slate-500 text-xs">
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
                <div className="p-8 text-center text-slate-500 text-xs">
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
                      onClick={() => handleToggleRead(activeTab, selectedItem.id, !!selectedItem.isRead)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      {selectedItem.isRead ? "Mark Unread" : "Mark Read"}
                    </button>

                    <button
                      onClick={() => handleDeleteItem(activeTab, selectedItem.id)}
                      className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 rounded-lg text-xs font-mono flex items-center gap-1 transition-all"
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
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-lg flex items-center gap-2 transition-all shadow-lg"
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
      </main>
    </div>
  );
}
