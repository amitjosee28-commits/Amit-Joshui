import React, { useState, useEffect } from "react";
import { ref, get, set, onValue } from "firebase/database";
import { db } from "../firebase";
import { defaultPortfolioData, PortfolioData, ServiceAdminUser, ServiceInvoice } from "../utils/defaultData";
import { 
  Lock, User, Key, MessageSquare, Inbox, Phone, Mail, 
  Trash2, CheckCircle2, Clock, FileText, Image as ImageIcon, 
  Search, ShieldCheck, LogOut, RefreshCw, AlertCircle, Sparkles, 
  Filter, Users, Copy, Check, DownloadCloud, ArrowUpDown, Send,
  Receipt, DollarSign, Calendar, Plus, Edit2, Shield, UserPlus, Eye
} from "lucide-react";
import InvoiceView from "./InvoiceView";

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
  const [invoices, setInvoices] = useState<ServiceInvoice[]>([]);
  const [activeTab, setActiveTab] = useState<"applications" | "invoices" | "suggestions" | "subscribers" | "rbac">("applications");
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewingInvoice, setViewingInvoice] = useState<ServiceInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [bulkCopySuccess, setBulkCopySuccess] = useState(false);

  // RBAC User Form state
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userForm, setUserForm] = useState<ServiceAdminUser>({
    id: "",
    username: "",
    pin: "",
    name: "",
    role: "services_admin",
    status: "active",
    permissions: {
      canManageServices: true,
      canManageApplications: true,
      canManageInvoices: true,
      canManageSuggestions: true,
      canManageSubscribers: true,
      canManageUsers: false
    }
  });

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

  // Fetch Suggestions, Applications, Invoices, and Subscribers
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

      // 3. Invoices
      let invList: ServiceInvoice[] = [];
      const invSnap = await get(ref(db, "invoices"));
      if (invSnap.exists()) {
        const data = invSnap.val();
        invList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        invList.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
      }
      setInvoices(invList);

      // 4. Newsletter Subscribers
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

      const unsubSubs = onValue(ref(db, "subscribers"), () => fetchData());
      const unsubPortSubs = onValue(ref(db, "portfolio/subscribers"), () => fetchData());
      const unsubApps = onValue(ref(db, "service_applications"), () => fetchData());
      const unsubInvs = onValue(ref(db, "invoices"), () => fetchData());
      const unsubSugs = onValue(ref(db, "suggestions"), () => fetchData());

      const interval = setInterval(fetchData, 10000);

      return () => {
        unsubSubs();
        unsubPortSubs();
        unsubApps();
        unsubInvs();
        unsubSugs();
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

    const allowedUsers = portfolioData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers || [];
    
    const matchedUser = allowedUsers.find(
      (u: ServiceAdminUser) => u.username.toLowerCase() === inputUser && u.pin === inputPin
    );

    const isDefaultMatch = allowedUsers.length === 0 && inputUser === "loginadmin" && inputPin === "1860";

    if (matchedUser || isDefaultMatch) {
      const userPayload = matchedUser || { 
        id: "admin-default-1",
        username: "loginadmin", 
        name: "Primary Services Admin", 
        role: "super_admin",
        status: "active",
        permissions: {
          canManageServices: true,
          canManageApplications: true,
          canManageInvoices: true,
          canManageSuggestions: true,
          canManageSubscribers: true,
          canManageUsers: true
        }
      };

      if (userPayload.status === "restricted") {
        setAuthError("Access Restricted: This account has been disabled by the Administrator.");
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

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("admin_services_auth_2026");
    sessionStorage.removeItem("admin_services_user");
  };

  // Update Invoice Status
  const handleUpdateInvoiceStatus = async (invoiceId: string, status: ServiceInvoice["paymentStatus"]) => {
    try {
      await set(ref(db, `invoices/${invoiceId}/paymentStatus`), status);
      fetchData();
      if (viewingInvoice && viewingInvoice.invoiceId === invoiceId) {
        setViewingInvoice(prev => prev ? { ...prev, paymentStatus: status } : null);
      }
    } catch (e) {
      alert("Failed to update invoice status: " + e);
    }
  };

  // Save / Update Admin User (RBAC)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim() || !userForm.pin.trim() || !userForm.name.trim()) {
      alert("Please fill in username, full name, and 4-digit PIN.");
      return;
    }

    const currentUsers = [...(portfolioData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers)];
    const existingIndex = currentUsers.findIndex(u => u.id === userForm.id);

    const userToSave: ServiceAdminUser = {
      ...userForm,
      id: userForm.id || `user-${Date.now()}`
    };

    if (existingIndex >= 0) {
      currentUsers[existingIndex] = userToSave;
    } else {
      currentUsers.push(userToSave);
    }

    try {
      await set(ref(db, "portfolio/serviceAdminUsers"), currentUsers);
      setIsEditingUser(false);
      alert("Admin user saved successfully!");
    } catch (e) {
      alert("Failed to save user: " + e);
    }
  };

  // Delete Admin User (RBAC)
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this admin account?")) return;
    const currentUsers = (portfolioData.serviceAdminUsers || []).filter(u => u.id !== userId);
    try {
      await set(ref(db, "portfolio/serviceAdminUsers"), currentUsers);
      alert("User removed.");
    } catch (e) {
      alert("Failed to delete user: " + e);
    }
  };

  // Delete Item
  const handleDeleteItem = async (type: "applications" | "suggestions" | "subscribers" | "invoices", id: string) => {
    if (!window.confirm(`Are you sure you want to delete this item?`)) return;
    try {
      if (type === "subscribers") {
        await set(ref(db, `subscribers/${id}`), null);
        await set(ref(db, `portfolio/subscribers/${id}`), null);
      } else if (type === "applications") {
        await set(ref(db, `service_applications/${id}`), null);
        await set(ref(db, `applications/${id}`), null);
      } else if (type === "invoices") {
        await set(ref(db, `invoices/${id}`), null);
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

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleCopyAllSubscriberEmails = () => {
    const emails = subscribers.map(s => s.email).filter(Boolean).join(", ");
    if (!emails) return;
    navigator.clipboard.writeText(emails);
    setBulkCopySuccess(true);
    setTimeout(() => setBulkCopySuccess(false), 3000);
  };

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
      app.name?.toLowerCase().includes(q) ||
      app.fullName?.toLowerCase().includes(q) ||
      app.contact?.toLowerCase().includes(q) ||
      app.phone?.toLowerCase().includes(q) ||
      app.serviceTitle?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q)
    );
  });

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    return (
      inv.invoiceId?.toLowerCase().includes(q) ||
      inv.clientName?.toLowerCase().includes(q) ||
      inv.clientEmail?.toLowerCase().includes(q) ||
      inv.serviceTitle?.toLowerCase().includes(q) ||
      inv.paymentStatus?.toLowerCase().includes(q)
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
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 mb-3 shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-white tracking-wide">
              Services & Billing Portal
            </h1>
            <p className="text-xs text-amber-300/80 mt-1 uppercase tracking-widest font-mono">
              Restricted Executive Management Panel
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
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none transition-all text-center text-lg font-mono"
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
              href="/"
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors font-mono"
            >
              &larr; Return to Main Portal Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Full-screen invoice viewer modal
  if (viewingInvoice) {
    return (
      <div className="min-h-screen bg-slate-950">
        <InvoiceView
          invoice={viewingInvoice}
          onBack={() => setViewingInvoice(null)}
          onUpdateStatus={(newStatus) => handleUpdateInvoiceStatus(viewingInvoice.invoiceId, newStatus)}
          isAdmin={true}
        />
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
              <span className="ml-2 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] uppercase font-bold border border-amber-500/30">
                {currentUserInfo?.role || "Services Admin"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-mono transition-all"
          >
            Visit Website
          </a>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Refresh
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
        <div className="flex flex-wrap p-1.5 bg-slate-900 border border-slate-800 rounded-2xl gap-1 shadow-lg overflow-x-auto">
          
          <button
            onClick={() => { setActiveTab("applications"); setSelectedItem(null); }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "applications"
                ? "bg-amber-500 text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Applications ({applications.length})</span>
            {unreadAppsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-bold">
                {unreadAppsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab("invoices"); setSelectedItem(null); }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "invoices"
                ? "bg-amber-500 text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Invoices & Billing ({invoices.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab("suggestions"); setSelectedItem(null); }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "suggestions"
                ? "bg-amber-500 text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Suggestions ({suggestions.length})</span>
            {unreadSugsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-bold">
                {unreadSugsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab("subscribers"); setSelectedItem(null); }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "subscribers"
                ? "bg-amber-500 text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Newsletter ({subscribers.length})</span>
          </button>

          {/* RBAC Tab (Visible to super_admin or user with canManageUsers) */}
          {(currentUserInfo?.role === "super_admin" || currentUserInfo?.permissions?.canManageUsers) && (
            <button
              onClick={() => { setActiveTab("rbac"); setSelectedItem(null); }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "rbac"
                  ? "bg-amber-500 text-slate-950 shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>RBAC User Roles</span>
            </button>
          )}

        </div>

        {/* ================= INVOICES & BILLING TAB ================= */}
        {activeTab === "invoices" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <span>Official Invoices & 12-Hour Payment Trackers</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  All dynamically generated client invoices with strict 12-hour payment window monitoring.
                </p>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by invoice ID, client, status..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Invoice ID</th>
                    <th className="py-3.5 px-4">Client Details</th>
                    <th className="py-3.5 px-4">Service Ordered</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">12h Deadline & Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                        {searchTerm ? "No invoices match search criteria." : "No invoices recorded yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const isExpired = new Date(inv.paymentDueAt).getTime() < Date.now();
                      const status = inv.paymentStatus === "Paid" ? "Paid" : isExpired ? "Expired" : inv.paymentStatus;

                      return (
                        <tr key={inv.invoiceId} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                            {inv.invoiceId}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white">{inv.clientName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{inv.clientPhone} &bull; {inv.clientEmail}</p>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-300">
                            {inv.serviceTitle}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-white">
                            {inv.amountFormatted || `NPR ${inv.amount?.toLocaleString()}`}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                status === "Paid"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : status === "Expired"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              }`}>
                                {status}
                              </span>
                              <p className="text-[10px] font-mono text-slate-400">
                                Due: {new Date(inv.paymentDueAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setViewingInvoice(inv)}
                                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center space-x-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View & Print</span>
                              </button>

                              <select
                                value={inv.paymentStatus}
                                onChange={(e) => handleUpdateInvoiceStatus(inv.invoiceId, e.target.value as any)}
                                className="bg-black/60 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-slate-200 outline-none"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                                <option value="Expired">Expired</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>

                              <button
                                onClick={() => handleDeleteItem("invoices", inv.invoiceId)}
                                className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors cursor-pointer"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= RBAC USER ROLES TAB ================= */}
        {activeTab === "rbac" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span>Role-Based Access Control (RBAC) & Service Admins</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Manage authorized users, 4-digit PIN credentials, roles, and administrative capabilities.
                </p>
              </div>

              <button
                onClick={() => {
                  setUserForm({
                    id: "",
                    username: "",
                    pin: "",
                    name: "",
                    role: "services_admin",
                    status: "active",
                    permissions: {
                      canManageServices: true,
                      canManageApplications: true,
                      canManageInvoices: true,
                      canManageSuggestions: true,
                      canManageSubscribers: true,
                      canManageUsers: false
                    }
                  });
                  setIsEditingUser(true);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center gap-2 font-mono shadow cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Service Admin User</span>
              </button>
            </div>

            {/* Admin User Edit / Create Modal */}
            {isEditingUser && (
              <div className="p-6 bg-slate-950 border border-amber-500/40 rounded-2xl space-y-4 animate-in fade-in">
                <h3 className="text-sm font-bold text-amber-400 font-mono uppercase tracking-wider">
                  {userForm.id ? "Edit Service Admin User" : "Create New Service Admin Account"}
                </h3>

                <form onSubmit={handleSaveUser} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Username *</label>
                      <input
                        type="text"
                        required
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toLowerCase().trim() })}
                        placeholder="e.g. johnadmin"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        placeholder="e.g. John Doe"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">4-Digit Access PIN *</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={userForm.pin}
                        onChange={(e) => setUserForm({ ...userForm, pin: e.target.value.replace(/\D/g, "") })}
                        placeholder="••••"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Role Type</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      >
                        <option value="super_admin">Super Admin (Unrestricted Full Control)</option>
                        <option value="services_admin">Services Admin (Standard Operations)</option>
                        <option value="restricted">Restricted (View-Only / Disabled)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Account Status</label>
                      <select
                        value={userForm.status}
                        onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      >
                        <option value="active">Active (Access Allowed)</option>
                        <option value="restricted">Restricted (Access Denied)</option>
                      </select>
                    </div>
                  </div>

                  {/* Permissions Checkboxes */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-mono uppercase text-slate-400 block font-bold">Module Permissions</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={userForm.permissions?.canManageApplications ?? true}
                          onChange={(e) => setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, canManageApplications: e.target.checked }
                          })}
                        />
                        <span>Applications</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={userForm.permissions?.canManageInvoices ?? true}
                          onChange={(e) => setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, canManageInvoices: e.target.checked }
                          })}
                        />
                        <span>Invoices & Billing</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={userForm.permissions?.canManageSuggestions ?? true}
                          onChange={(e) => setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, canManageSuggestions: e.target.checked }
                          })}
                        />
                        <span>Suggestions</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={userForm.permissions?.canManageSubscribers ?? true}
                          onChange={(e) => setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, canManageSubscribers: e.target.checked }
                          })}
                        />
                        <span>Newsletter</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={userForm.permissions?.canManageUsers ?? false}
                          onChange={(e) => setUserForm({
                            ...userForm,
                            permissions: { ...userForm.permissions, canManageUsers: e.target.checked }
                          })}
                        />
                        <span>Manage Admin Users</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingUser(false)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-mono font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase"
                    >
                      Save Admin Account
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Admin Users Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Username</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Permissions</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(portfolioData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers).map((u) => (
                    <tr key={u.id || u.username} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-400">
                        {u.username}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === "super_admin" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          u.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                        {u.role === "super_admin" ? "All Permissions" : Object.keys(u.permissions || {}).filter(k => (u.permissions as any)[k]).join(", ")}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setUserForm(u);
                              setIsEditingUser(true);
                            }}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= SUBSCRIBERS TAB ================= */}
        {activeTab === "subscribers" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
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
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

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
          </div>
        )}

        {/* ================= APPLICATIONS & SUGGESTIONS 2-COLUMN VIEW ================= */}
        {(activeTab === "applications" || activeTab === "suggestions") && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: List */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${activeTab === "applications" ? "applications..." : "messages..."}`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

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

                        <p className="text-sm font-semibold text-white">{app.name || app.fullName || "Anonymous"}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                          <span>📞 {app.contact || app.phone || "N/A"}</span>
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

                    {activeTab === "applications" ? (
                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div>
                            <span className="text-slate-400 font-mono block">Applicant Full Name</span>
                            <span className="text-sm font-bold text-white block mt-0.5">{selectedItem.name || selectedItem.fullName || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-mono block">Contact Number</span>
                            <a href={`https://wa.me/${(selectedItem.contact || selectedItem.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-amber-400 hover:underline block mt-0.5">
                              {selectedItem.contact || selectedItem.phone || "N/A"}
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

                        {selectedItem.customAnswers && Object.keys(selectedItem.customAnswers).length > 0 && (
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                            <span className="text-amber-400 font-bold uppercase tracking-wider block font-mono">
                              Custom Application Answers
                            </span>
                            <div className="space-y-2">
                              {Object.entries(selectedItem.customAnswers).map(([qKey, aVal]: [string, any]) => (
                                <div key={qKey} className="border-b border-slate-900 pb-1">
                                  <p className="text-[11px] font-bold text-slate-300">{qKey}</p>
                                  <p className="text-xs text-amber-200 font-mono mt-0.5">{String(aVal)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                            <span className="text-amber-400 font-bold uppercase tracking-wider block font-mono">
                              Attached Documents & Photos ({selectedItem.attachments.length})
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {selectedItem.attachments.map((att: any, idx: number) => {
                                const isPdf = att.data?.includes("application/pdf") || att.fileName?.endsWith(".pdf");
                                return isPdf ? (
                                  <a key={idx} href={att.data} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-lg flex flex-col items-center justify-center gap-1 text-center transition-all">
                                    <FileText className="w-6 h-6 text-red-400" />
                                    <span className="text-[10px] text-slate-300 truncate w-full font-mono">{att.name || att.fileName}</span>
                                  </a>
                                ) : (
                                  <div key={idx} className="relative group overflow-hidden rounded-lg border border-slate-800 h-24 bg-slate-900">
                                    <img src={att.data} alt={att.name || `Attachment ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  </div>
                                );
                              })}
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

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-lg flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      Print Receipt
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
