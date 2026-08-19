import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { initializeApp } from "firebase/app";
import { 
  getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, 
  signOut, onAuthStateChanged, setPersistence, browserLocalPersistence 
} from "firebase/auth";
import { getDatabase, ref, get, set, update, onValue } from "firebase/database";
import { app, auth, db } from "./firebase";
import { defaultPortfolioData, PortfolioData } from "./utils/defaultData";
import { 
  Lock, Mail, Eye, EyeOff, Layout, Globe, Plus, Trash2, Edit3, 
  Save, Eye as PreviewIcon, ArrowLeft, RefreshCw, CheckCircle2, XCircle, 
  Settings, Database, Calendar, Users, Sliders, GraduationCap, Heart, Landmark, MapPin, Send, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, BookOpen, MessageSquare, Inbox, Phone, FileText, ShieldCheck, AlertCircle, ExternalLink, DownloadCloud, Copy, Check, Filter, Search, Sparkles
} from "lucide-react";
import NetworkCanvas from "./components/NetworkCanvas";
import BlogContentRenderer from "./components/BlogContentRenderer";
import RichBlogEditor from "./components/RichBlogEditor";

import "./index.css";

// Persistent Session Setup - Prevents premature logout across tabs/reloads
setPersistence(auth, browserLocalPersistence).catch((err) => console.error("Auth persistence setup error:", err));

interface Toast {
  type: "success" | "error";
  message: string;
}

export default function Dashboard() {
  // Authentication states
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // CMS staging states
  const [stagingData, setStagingData] = useState<PortfolioData>(defaultPortfolioData);
  const [stats, setStats] = useState({
    visits: 0,
    previousLogin: "N/A",
    objectCount: 0
  });

  // Unique session token for Single-Session Currency Enforcement
  const [mySessionToken] = useState(() => Math.random().toString(36).substring(2) + Date.now().toString());
  const hasWrittenSessionRef = useRef(false);

  // Toast status notification state
  const [toast, setToast] = useState<Toast | null>(null);

  // Tabs for Unified Lang payload
  const [activeLangTab, setActiveLangTab] = useState<"en" | "np">("en");
  
  // Section Navigation inside CMS
  const [activeCmsSection, setActiveCmsSection] = useState<string>("header");

  // Rich Text Custom Style Generator state
  const [richTextConfig, setRichTextConfig] = useState({
    align: "left",
    bold: false,
    italic: false,
    underline: false,
    color: "#00f0ff", // Default cyan mixer
    letterSpacing: "normal",
    lineHeight: "normal"
  });

  // Dynamic Array Modals and Form Inputs
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form Inputs for Social Hub
  const [socialForm, setSocialForm] = useState({
    platform: "Facebook",
    url: "",
    icon: "Facebook",
    clickCount: 0,
    titleEn: "",
    titleNp: ""
  });

  // Form Inputs for Initiatives
  const [initiativeForm, setInitiativeForm] = useState({
    titleEn: "",
    titleNp: "",
    textEn: "",
    textNp: "",
    readMoreEn: "",
    readMoreNp: "",
    fbIframe: ""
  });

  // Form Inputs for Education
  const [educationForm, setEducationForm] = useState({
    institutionEn: "",
    institutionNp: "",
    degreeEn: "",
    degreeNp: "",
    yearsEn: "",
    yearsNp: "",
    descriptionEn: "",
    descriptionNp: "",
    detailsEn: "",
    detailsNp: "",
    portalUrl: ""
  });

  // Form Inputs for Utilities/Tools
  const [toolForm, setToolForm] = useState({
    nameEn: "",
    nameNp: "",
    categoryEn: "",
    categoryNp: "",
    descriptionEn: "",
    descriptionNp: "",
    icon: "Sliders",
    url: ""
  });

  // Form Inputs for Services
  const [serviceForm, setServiceForm] = useState({
    titleEn: "",
    titleNp: "",
    descriptionEn: "",
    descriptionNp: "",
    priceEn: "",
    priceNp: "",
    whatsappMessageEn: "",
    whatsappMessageNp: "",
    officialLink: "",
    icon: "Layout",
    photoReqsEn: "",
    photoReqsNp: "",
    docReqsEn: "",
    docReqsNp: "",
    specialNoticeEn: "",
    specialNoticeNp: "",
    customQuestionsEn: "",
    customQuestionsNp: "",
    pdfEnabled: false,
    pdfRequired: false,
    pdfLabelEn: "",
    pdfLabelNp: "",
    photo1Enabled: false,
    photo1Required: false,
    photo1LabelEn: "",
    photo1LabelNp: "",
    photo2Enabled: false,
    photo2Required: false,
    photo2LabelEn: "",
    photo2LabelNp: "",
    photo3Enabled: false,
    photo3Required: false,
    photo3LabelEn: "",
    photo3LabelNp: "",
    photo4Enabled: false,
    photo4Required: false,
    photo4LabelEn: "",
    photo4LabelNp: "",
    serverStatus: "active"
  });

  // Suggestion & Application Box states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [editingApp, setEditingApp] = useState<any>(null);
  const [editingSug, setEditingSug] = useState<any>(null);

  // Real-time loading
  const fetchSuggestions = async () => {
    try {
      const snapshot = await get(ref(db, "suggestions"));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const now = Date.now();
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        
        // Find and delete suggestions older than 2 days
        const validList: any[] = [];
        for (const item of list) {
          const timestampMs = new Date(item.timestamp || 0).getTime();
          if (now - timestampMs > twoDaysMs) {
            await set(ref(db, `suggestions/${item.id}`), null);
            console.log(`Auto-deleted expired suggestion: ${item.id}`);
          } else {
            validList.push(item);
          }
        }

        validList.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setSuggestions(validList);
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchApplications = async () => {
    try {
      const snapshot = await get(ref(db, "service_applications"));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const now = Date.now();
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        
        // Find and delete applications older than 2 days
        const validList: any[] = [];
        for (const item of list) {
          const timestampMs = new Date(item.timestamp || 0).getTime();
          if (now - timestampMs > twoDaysMs) {
            await set(ref(db, `service_applications/${item.id}`), null);
            console.log(`Auto-deleted expired service application: ${item.id}`);
          } else {
            validList.push(item);
          }
        }

        validList.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setApplications(validList);
      } else {
        setApplications([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSuggestion = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this suggestion?")) return;
    try {
      await set(ref(db, `suggestions/${id}`), null);
      showToast("success", "Suggestion deleted successfully.");
      fetchSuggestions();
    } catch (err) {
      showToast("error", "Failed to delete suggestion.");
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await set(ref(db, `service_applications/${id}`), null);
      showToast("success", "Application deleted successfully.");
      fetchApplications();
    } catch (err) {
      showToast("error", "Failed to delete application.");
    }
  };

  const handleUpdateApplicationStatus = async (appId: string, status: string, remarks: string) => {
    try {
      await update(ref(db, `service_applications/${appId}`), {
        status,
        remarks,
        updatedAt: new Date().toISOString()
      });
      showToast("success", `Remarks & status updated for application ${appId}`);
      fetchApplications();
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to update application remarks.");
    }
  };

  const handleUpdateSuggestionStatus = async (sugId: string, status: string, remarks: string) => {
    try {
      await update(ref(db, `suggestions/${sugId}`), {
        status,
        remarks,
        updatedAt: new Date().toISOString()
      });
      showToast("success", `Remarks & status updated for suggestion ${sugId}`);
      fetchSuggestions();
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to update suggestion remarks.");
    }
  };

  const handleToggleEditAccess = async (collectionName: "service_applications" | "suggestions", id: string, currentVal: boolean) => {
    try {
      await update(ref(db, `${collectionName}/${id}`), { allowEdit: !currentVal });
      showToast("success", !currentVal ? "User Edit Access ENABLED. The user can now edit data via Check Status." : "User Edit Access DISABLED.");
      if (collectionName === "service_applications") fetchApplications();
      else fetchSuggestions();
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to toggle edit access.");
    }
  };

  const handleUpdateApplicationData = async (appId: string, updatedData: any) => {
    try {
      await update(ref(db, `service_applications/${appId}`), { ...updatedData, updatedAt: new Date().toISOString() });
      showToast("success", "Application data modified successfully.");
      setEditingApp(null);
      fetchApplications();
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to modify application data.");
    }
  };

  const handleUpdateSuggestionData = async (sugId: string, updatedData: any) => {
    try {
      await update(ref(db, `suggestions/${sugId}`), { ...updatedData, updatedAt: new Date().toISOString() });
      showToast("success", "Suggestion data modified successfully.");
      setEditingSug(null);
      fetchSuggestions();
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to modify suggestion data.");
    }
  };

  const handleDeleteAttachment = async (appId: string, fileIdx: number, currentAttachments: any[]) => {
    if (!window.confirm("Are you sure you want to delete only this specific uploaded file?")) return;
    try {
      const updated = currentAttachments.filter((_, idx) => idx !== fileIdx);
      await update(ref(db, `service_applications/${appId}`), { attachments: updated });
      showToast("success", "File deleted from record.");
      fetchApplications();
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to delete file.");
    }
  };

  const handleMarkRead = async (collectionName: "service_applications" | "suggestions", id: string) => {
    try {
      await update(ref(db, `${collectionName}/${id}`), { read: true });
      if (collectionName === "service_applications") fetchApplications();
      else fetchSuggestions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async (collectionName: "service_applications" | "suggestions", items: any[]) => {
    try {
      const updates: any = {};
      items.forEach(item => {
        if (!item.read) {
          updates[`${collectionName}/${item.id}/read`] = true;
        }
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
        showToast("success", "All marked as read.");
        if (collectionName === "service_applications") fetchApplications();
        else fetchSuggestions();
      }
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to mark all read.");
    }
  };

  useEffect(() => {
    if (user) {
      fetchSuggestions();
      fetchApplications();
      fetchSubscribers();
    }
  }, [user, activeCmsSection]);

  // Form Inputs for Interests
  const [interestForm, setInterestForm] = useState({
    titleEn: "",
    titleNp: "",
    descriptionEn: "",
    descriptionNp: "",
    icon: "Heart"
  });

  // Form Inputs for Slides
  const [slideForm, setSlideForm] = useState({
    imageUrl: "",
    titleEn: "",
    titleNp: "",
    subtitleEn: "",
    subtitleNp: ""
  });

  // Form Inputs for Downloads
  const [downloadForm, setDownloadForm] = useState({
    titleEn: "",
    titleNp: "",
    fileUrl: "",
    fileType: "pdf" as "pdf" | "jpg" | "png" | "gif"
  });

  // Form Inputs for Useful Links
  const [usefulLinkForm, setUsefulLinkForm] = useState({
    titleEn: "",
    titleNp: "",
    url: ""
  });

  // Form Inputs for Native Blog Posts
  const [blogForm, setBlogForm] = useState({
    slug: "",
    titleEn: "",
    titleNp: "",
    mainPhoto: "",
    additionalPhotos: [] as string[],
    additionalPhotoInput: "",
    contentEn: "",
    contentNp: "",
    authorEn: "Amit Joshi",
    authorNp: "अमित जोशी",
    dateEn: new Date().toISOString().split("T")[0],
    dateNp: "",
    timeEn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timeNp: ""
  });

  // Form Inputs for Custom Permalinks / Slugs
  const [permalinkForm, setPermalinkForm] = useState({
    type: "page" as "page" | "tool" | "form" | "blog",
    slug: "",
    targetId: "",
    titleEn: "",
    titleNp: ""
  });

  // Form Inputs for Admin Services Users Credentials
  const [serviceUserForm, setServiceUserForm] = useState({
    username: "",
    pin: "",
    name: "",
    role: "services_admin",
    status: "active" as "active" | "restricted"
  });
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  // Newsletter Hub states
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [copiedAllSubs, setCopiedAllSubs] = useState(false);

  // VIBGYOR Preset list for rich text mixer
  const vibgyorColors = [
    { name: "Cyan", hex: "#00f0ff" },
    { name: "Violet", hex: "#8b5cf6" },
    { name: "Indigo", hex: "#3b82f6" },
    { name: "Blue", hex: "#00ffff" },
    { name: "Green", hex: "#10b981" },
    { name: "Yellow", hex: "#fbbf24" },
    { name: "Orange", hex: "#f97316" },
    { name: "Red", hex: "#ef4444" },
    { name: "White", hex: "#ffffff" }
  ];

  // 1. Monitor Authentication & Single-Session enforce
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        
        // Single session currency check
        const sessionRef = ref(db, "admin/current_session");
        onValue(sessionRef, (snapshot) => {
          const activeSession = snapshot.val();
          if (activeSession && activeSession !== mySessionToken && hasWrittenSessionRef.current) {
            // Another device logged in! Force instant client-side logout
            handleForceLogout();
          }
        }, (error) => {
          console.warn("Session check ignored due to rules or connectivity:", error);
        });

        // Load Staging Content & Telemetry data
        loadCmsStagingData();
        loadTelemetryData(authUser);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, [mySessionToken]);

  // Load Content from Firebase
  const loadCmsStagingData = async () => {
    try {
      const snapshot = await get(ref(db, "portfolio"));
      if (snapshot.exists()) {
        const val = snapshot.val();
        let blogsList = defaultPortfolioData.blogs.list;
        if (val.blogs?.list) {
          if (Array.isArray(val.blogs.list)) {
            blogsList = val.blogs.list;
          } else if (typeof val.blogs.list === "object" && val.blogs.list !== null) {
            blogsList = Object.values(val.blogs.list);
          }
        }
        setStagingData({
          ...defaultPortfolioData,
          ...val,
          blogs: {
            ...defaultPortfolioData.blogs,
            ...(val.blogs || {}),
            list: blogsList
          }
        });
      } else {
        // Fall back and seed initial values if empty
        await set(ref(db, "portfolio"), defaultPortfolioData);
        setStagingData(defaultPortfolioData);
      }
    } catch (e) {
      showToast("error", "Failed to fetch database configurations.");
    }
  };

  // Load Telemetry Metrics & Login History
  const loadTelemetryData = async (authUser: any) => {
    try {
      // Prior session login lookup
      const lastLoginRef = ref(db, "admin/last_login_history");
      const lastLoginSnap = await get(lastLoginRef);
      let previousLoginTime = "First Session Logged";
      if (lastLoginSnap.exists()) {
        const historyObj = lastLoginSnap.val();
        const datesArray = Object.values(historyObj).map((d: any) => new Date(d).getTime());
        if (datesArray.length > 0) {
          const maxDate = Math.max(...datesArray);
          previousLoginTime = new Date(maxDate).toLocaleString();
        }
      }

      // Record CURRENT login timestamp to history
      const uniqueHistoryKey = `login_${Date.now()}`;
      await set(ref(db, `admin/last_login_history/${uniqueHistoryKey}`), new Date().toISOString());

      // Write active session token and client signature
      await set(ref(db, "admin/current_session"), mySessionToken);
      hasWrittenSessionRef.current = true;

      // Total Visits analytics
      const visitsSnap = await get(ref(db, "site_stats/visits"));
      const totalVisits = visitsSnap.exists() ? visitsSnap.val() : 342; // Fallback seed count

      // Calculate database tally
      const portfolioSnap = await get(ref(db, "portfolio"));
      let totalObjects = 0;
      if (portfolioSnap.exists()) {
        const val = portfolioSnap.val();
        totalObjects += (val.socials?.length || 0);
        totalObjects += (val.initiatives?.length || 0);
        totalObjects += (val.education?.length || 0);
        totalObjects += (val.tools?.length || 0);
        totalObjects += (val.services?.length || 0);
        totalObjects += (val.interests?.length || 0);
      }

      setStats({
        visits: totalVisits,
        previousLogin: previousLoginTime,
        objectCount: totalObjects
      });

    } catch (e) {
      console.warn("Failed to load full telemetry HUD metadata.", e);
    }
  };

  const handleForceLogout = () => {
    hasWrittenSessionRef.current = false;
    signOut(auth);
    showToast("error", "Logged Out: Another session has been initiated from a different client.");
    setUser(null);
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle Log-in
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("success", "Authentication Successful. Admin HUD loaded.");
    } catch (err: any) {
      showToast("error", err.message || "Invalid credentials.");
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    if (!email) {
      showToast("error", "Please provide your email address to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("success", "Password recovery email dispatched. Check your inbox.");
    } catch (err: any) {
      showToast("error", err.message || "Failed to dispatch recovery email.");
    }
  };

  // Log-out trigger
  const handleLogout = async () => {
    try {
      hasWrittenSessionRef.current = false;
      await signOut(auth);
      showToast("success", "Admin session closed cleanly.");
    } catch (err) {
      showToast("error", "Logout sequence failed.");
    }
  };

  // Global Staged Save to staging path
  const handleSaveStaging = async () => {
    try {
      const updatedData = {
        ...stagingData,
        lastEdited: new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "medium" })
      };
      await set(ref(db, "portfolio"), updatedData);
      setStagingData(updatedData);
      showToast("success", "CMS Staging configuration saved successfully.");
      
      // Re-calculate statistics tallies
      let totalObjects = 0;
      totalObjects += (updatedData.socials?.length || 0);
      totalObjects += (updatedData.initiatives?.length || 0);
      totalObjects += (updatedData.education?.length || 0);
      totalObjects += (updatedData.tools?.length || 0);
      totalObjects += (updatedData.services?.length || 0);
      totalObjects += (updatedData.interests?.length || 0);
      totalObjects += (updatedData.blogs?.list?.length || 0);
      totalObjects += (updatedData.customLinks?.length || 0);
      setStats(prev => ({ ...prev, objectCount: totalObjects }));
    } catch (e: any) {
      showToast("error", e.message || "Failed to push staging state.");
    }
  };

  // Direct commit to Live nodes configuration
  const handleCommitLiveNow = async () => {
    try {
      const updatedData = {
        ...stagingData,
        lastEdited: new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "medium" })
      };
      await set(ref(db, "portfolio"), updatedData);
      setStagingData(updatedData);
      showToast("success", "Staged configurations pushed to Public Portfolio immediately.");
    } catch (e: any) {
      showToast("error", e.message || "Direct live commit failed.");
    }
  };

  // Header input updates
  const updateHeaderField = (field: string, value: string) => {
    setStagingData((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        [field]: value
      }
    }));
  };

  // Staging field helper
  const updateStagingField = (path: string, field: string, value: any) => {
    let finalValue = value;
    if (path === "maps" && (field === "permanentUrl" || field === "temporaryUrl") && typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.toLowerCase().includes("<iframe") || trimmed.toLowerCase().includes("src=")) {
        const srcRegex = /\bsrc\s*=\s*['"]([^'"]+)['"]/i;
        const match = trimmed.match(srcRegex);
        if (match && match[1]) {
          finalValue = match[1];
        } else {
          const backupMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
          if (backupMatch && backupMatch[1]) {
            finalValue = backupMatch[1];
          }
        }
      }
    }
    setStagingData((prev: any) => ({
      ...prev,
      [path]: {
        ...prev[path],
        [field]: finalValue
      }
    }));
  };

  // Base64 file converter stream
  const convertToBase64 = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Infinite Item Managers
  const handleSaveSocial = () => {
    if (!socialForm.url) {
      showToast("error", "URL path is a required field.");
      return;
    }
    const updatedSocials = [...(stagingData.socials || [])];
    if (editingItemId) {
      const idx = updatedSocials.findIndex(s => s.id === editingItemId);
      if (idx !== -1) {
        updatedSocials[idx] = { ...socialForm, id: editingItemId };
      }
    } else {
      updatedSocials.push({ ...socialForm, id: "soc-" + Date.now() });
    }
    setStagingData(prev => ({ ...prev, socials: updatedSocials }));
    setSocialForm({ platform: "Facebook", url: "", icon: "Facebook", clickCount: 0, titleEn: "", titleNp: "" });
    setEditingItemId(null);
    showToast("success", "Social Hub record staging saved.");
  };

  const handleDeleteSocial = (id: string) => {
    const updated = (stagingData.socials || []).filter(s => s.id !== id);
    setStagingData(prev => ({ ...prev, socials: updated }));
    showToast("success", "Social Hub record staging deleted.");
  };

  const handleSaveInitiative = () => {
    if (!initiativeForm.titleEn || !initiativeForm.textEn) {
      showToast("error", "English title and description are required validation fields.");
      return;
    }
    const updated = [...(stagingData.initiatives || [])];
    if (editingItemId) {
      const idx = updated.findIndex(item => item.id === editingItemId);
      if (idx !== -1) {
        updated[idx] = { ...initiativeForm, id: editingItemId };
      }
    } else {
      updated.push({ ...initiativeForm, id: "init-" + Date.now() });
    }
    setStagingData(prev => ({ ...prev, initiatives: updated }));
    setInitiativeForm({ titleEn: "", titleNp: "", textEn: "", textNp: "", readMoreEn: "", readMoreNp: "", fbIframe: "" });
    setEditingItemId(null);
    showToast("success", "Strategic Initiative staging saved.");
  };

  const handleDeleteInitiative = (id: string) => {
    const updated = (stagingData.initiatives || []).filter(item => item.id !== id);
    setStagingData(prev => ({ ...prev, initiatives: updated }));
    showToast("success", "Initiative deleted.");
  };

  const handleSaveEducation = () => {
    if (!educationForm.degreeEn || !educationForm.institutionEn) {
      showToast("error", "Degree and Institution are required fields.");
      return;
    }
    const updated = [...(stagingData.education || [])];
    if (editingItemId) {
      const idx = updated.findIndex(e => e.id === editingItemId);
      if (idx !== -1) {
        updated[idx] = { ...educationForm, id: editingItemId };
      }
    } else {
      updated.push({ ...educationForm, id: "edu-" + Date.now() });
    }
    setStagingData(prev => ({ ...prev, education: updated }));
    setEducationForm({ institutionEn: "", institutionNp: "", degreeEn: "", degreeNp: "", yearsEn: "", yearsNp: "", descriptionEn: "", descriptionNp: "", detailsEn: "", detailsNp: "", portalUrl: "" });
    setEditingItemId(null);
    showToast("success", "Education timeline milestone saved.");
  };

  const handleDeleteEducation = (id: string) => {
    const updated = (stagingData.education || []).filter(e => e.id !== id);
    setStagingData(prev => ({ ...prev, education: updated }));
    showToast("success", "Education milestone removed.");
  };

  const handleSaveTool = () => {
    if (!toolForm.nameEn || !toolForm.url) {
      showToast("error", "Tool Name and Official URL paths are required validation parameters.");
      return;
    }
    const updated = [...(stagingData.tools || [])];
    if (editingItemId) {
      const idx = updated.findIndex(t => t.id === editingItemId);
      if (idx !== -1) {
        updated[idx] = { ...toolForm, id: editingItemId };
      }
    } else {
      updated.push({ ...toolForm, id: "tool-" + Date.now() });
    }
    setStagingData(prev => ({ ...prev, tools: updated }));
    setToolForm({ nameEn: "", nameNp: "", categoryEn: "", categoryNp: "", descriptionEn: "", descriptionNp: "", icon: "Sliders", url: "" });
    setEditingItemId(null);
    showToast("success", "Utility tool record saved to staging deck.");
  };

  const handleDeleteTool = (id: string) => {
    const updated = (stagingData.tools || []).filter(t => t.id !== id);
    setStagingData(prev => ({ ...prev, tools: updated }));
    showToast("success", "Tool removed from deck.");
  };

  const handleSaveService = () => {
    if (!serviceForm.titleEn || !serviceForm.priceEn) {
      showToast("error", "Service title and Price are required configuration parameters.");
      return;
    }
    const updated = [...(stagingData.services || [])];
    if (editingItemId) {
      const idx = updated.findIndex(s => s.id === editingItemId);
      if (idx !== -1) {
        updated[idx] = { ...serviceForm, id: editingItemId };
      }
    } else {
      updated.push({ ...serviceForm, id: "serv-" + Date.now() });
    }
    setStagingData(prev => ({ ...prev, services: updated }));
    setServiceForm({
      titleEn: "",
      titleNp: "",
      descriptionEn: "",
      descriptionNp: "",
      priceEn: "",
      priceNp: "",
      whatsappMessageEn: "",
      whatsappMessageNp: "",
      officialLink: "",
      icon: "Layout",
      photoReqsEn: "",
      photoReqsNp: "",
      docReqsEn: "",
      docReqsNp: "",
      specialNoticeEn: "",
      specialNoticeNp: "",
      customQuestionsEn: "",
      customQuestionsNp: "",
      pdfEnabled: false,
      pdfRequired: false,
      pdfLabelEn: "",
      pdfLabelNp: "",
      photo1Enabled: false,
      photo1Required: false,
      photo1LabelEn: "",
      photo1LabelNp: "",
      photo2Enabled: false,
      photo2Required: false,
      photo2LabelEn: "",
      photo2LabelNp: "",
      photo3Enabled: false,
      photo3Required: false,
      photo3LabelEn: "",
      photo3LabelNp: "",
      photo4Enabled: false,
      photo4Required: false,
      photo4LabelEn: "",
      photo4LabelNp: "",
      serverStatus: "active"
    });
    setEditingItemId(null);
    showToast("success", "Premium service configuration saved.");
  };

  const handleDeleteService = (id: string) => {
    const updated = (stagingData.services || []).filter(s => s.id !== id);
    setStagingData(prev => ({ ...prev, services: updated }));
    showToast("success", "Service deleted.");
  };

  const handleSaveInterest = () => {
    if (!interestForm.titleEn) {
      showToast("error", "Interest title is required.");
      return;
    }
    const updated = [...(stagingData.interests || [])];
    if (editingItemId) {
      const idx = updated.findIndex(i => i.id === editingItemId);
      if (idx !== -1) {
        updated[idx] = { ...interestForm, id: editingItemId };
      }
    } else {
      updated.push({ ...interestForm, id: "int-" + Date.now() });
    }
    setStagingData(prev => ({ ...prev, interests: updated }));
    setInterestForm({ titleEn: "", titleNp: "", descriptionEn: "", descriptionNp: "", icon: "Heart" });
    setEditingItemId(null);
    showToast("success", "Passion/Interest record saved.");
  };

  const handleDeleteInterest = (id: string) => {
    const updated = (stagingData.interests || []).filter(i => i.id !== id);
    setStagingData(prev => ({ ...prev, interests: updated }));
    showToast("success", "Interest deleted.");
  };

  const handleSaveSlide = () => {
    if (!slideForm.imageUrl || !slideForm.titleEn) {
      showToast("error", "Image URL and Title are required.");
      return;
    }
    const slides = [...(stagingData.homepage?.slides || [])];
    if (editingItemId) {
      const idx = slides.findIndex(s => s.id === editingItemId);
      if (idx !== -1) {
        slides[idx] = { ...slideForm, id: editingItemId };
      }
    } else {
      slides.push({ ...slideForm, id: "slide-" + Date.now() });
    }
    setStagingData(prev => ({
      ...prev,
      homepage: {
        ...(prev.homepage || {}),
        slides
      }
    }));
    setSlideForm({ imageUrl: "", titleEn: "", titleNp: "", subtitleEn: "", subtitleNp: "" });
    setEditingItemId(null);
    showToast("success", "Cinematic Home Slide saved.");
  };

  const handleDeleteSlide = (id: string) => {
    const slides = (stagingData.homepage?.slides || []).filter(s => s.id !== id);
    setStagingData(prev => ({
      ...prev,
      homepage: {
        ...(prev.homepage || {}),
        slides
      }
    }));
    showToast("success", "Cinematic Home Slide deleted.");
  };

  const handleSaveDownload = () => {
    if (!downloadForm.titleEn || !downloadForm.fileUrl) {
      showToast("error", "Title and File URL are required.");
      return;
    }
    const downloads = [...(stagingData.downloads || [])];
    if (editingItemId) {
      const idx = downloads.findIndex(d => d.id === editingItemId);
      if (idx !== -1) {
        downloads[idx] = { ...downloadForm, id: editingItemId };
      }
    } else {
      downloads.push({ ...downloadForm, id: "dl-" + Date.now() });
    }
    setStagingData(prev => ({ ...prev, downloads }));
    setDownloadForm({ titleEn: "", titleNp: "", fileUrl: "", fileType: "pdf" });
    setEditingItemId(null);
    showToast("success", "Downloadable Asset saved.");
  };

  const handleDeleteDownload = (id: string) => {
    const downloads = (stagingData.downloads || []).filter(d => d.id !== id);
    setStagingData(prev => ({ ...prev, downloads }));
    showToast("success", "Downloadable Asset deleted.");
  };

  const handleSaveUsefulLink = () => {
    if (!usefulLinkForm.titleEn || !usefulLinkForm.url) {
      showToast("error", "Title and Destination URL are required.");
      return;
    }
    const usefulLinks = [...(stagingData.usefulLinks || [])];
    if (editingItemId) {
      const idx = usefulLinks.findIndex(l => l.id === editingItemId);
      if (idx !== -1) {
        usefulLinks[idx] = { ...usefulLinkForm, id: editingItemId };
      }
    } else {
      usefulLinks.push({ ...usefulLinkForm, id: "ul-" + Date.now() });
    }
    setStagingData(prev => ({ ...prev, usefulLinks }));
    setUsefulLinkForm({ titleEn: "", titleNp: "", url: "" });
    setEditingItemId(null);
    showToast("success", "Useful Link saved.");
  };

  const handleDeleteUsefulLink = (id: string) => {
    const usefulLinks = (stagingData.usefulLinks || []).filter(l => l.id !== id);
    setStagingData(prev => ({ ...prev, usefulLinks }));
    showToast("success", "Useful Link deleted.");
  };

  // Blog post manager handlers
  const handleSaveBlog = () => {
    if (!blogForm.titleEn || !blogForm.contentEn) {
      showToast("error", "English title and content are required fields.");
      return;
    }
    const slug = blogForm.slug || blogForm.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const blogList = [...(stagingData.blogs?.list || [])];
    
    if (editingItemId) {
      const idx = blogList.findIndex(b => b.id === editingItemId);
      if (idx !== -1) {
        blogList[idx] = { ...blogForm, id: editingItemId, slug };
      }
    } else {
      blogList.push({ ...blogForm, id: "blog-" + Date.now(), slug });
    }

    setStagingData(prev => ({
      ...prev,
      blogs: {
        active: true,
        iframeUrl: prev.blogs?.iframeUrl || "https://blog.amitjoshi.info.np",
        list: blogList
      }
    }));

    setBlogForm({
      slug: "",
      titleEn: "",
      titleNp: "",
      mainPhoto: "",
      additionalPhotos: [],
      additionalPhotoInput: "",
      contentEn: "",
      contentNp: "",
      authorEn: "Amit Joshi",
      authorNp: "अमित जोशी",
      dateEn: new Date().toISOString().split("T")[0],
      dateNp: "",
      timeEn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeNp: ""
    });
    setEditingItemId(null);
    showToast("success", "Native Blog Article saved.");
  };

  const handleEditBlog = (blog: any) => {
    setEditingItemId(blog.id);
    setBlogForm({
      slug: blog.slug || "",
      titleEn: blog.titleEn || "",
      titleNp: blog.titleNp || "",
      mainPhoto: blog.mainPhoto || "",
      additionalPhotos: blog.additionalPhotos || [],
      additionalPhotoInput: "",
      contentEn: blog.contentEn || "",
      contentNp: blog.contentNp || "",
      authorEn: blog.authorEn || "Amit Joshi",
      authorNp: blog.authorNp || "अमित जोशी",
      dateEn: blog.dateEn || new Date().toISOString().split("T")[0],
      dateNp: blog.dateNp || "",
      timeEn: blog.timeEn || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeNp: blog.timeNp || ""
    });
    showToast("success", `Loaded "${blog.titleEn || 'Article'}" into editor.`);
    const formElement = document.getElementById("blog-editor-form");
    if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancelBlogEdit = () => {
    setEditingItemId(null);
    setBlogForm({
      slug: "",
      titleEn: "",
      titleNp: "",
      mainPhoto: "",
      additionalPhotos: [],
      additionalPhotoInput: "",
      contentEn: "",
      contentNp: "",
      authorEn: "Amit Joshi",
      authorNp: "अमित जोशी",
      dateEn: new Date().toISOString().split("T")[0],
      dateNp: "",
      timeEn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeNp: ""
    });
  };

  const handleAddBlogGalleryPhoto = () => {
    if (!blogForm.additionalPhotoInput.trim()) return;
    setBlogForm(prev => ({
      ...prev,
      additionalPhotos: [...(prev.additionalPhotos || []), prev.additionalPhotoInput.trim()],
      additionalPhotoInput: ""
    }));
  };

  const handleRemoveBlogGalleryPhoto = (idx: number) => {
    setBlogForm(prev => ({
      ...prev,
      additionalPhotos: (prev.additionalPhotos || []).filter((_, i) => i !== idx)
    }));
  };

  const handleDeleteBlog = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this blog post?")) return;
    const blogList = (stagingData.blogs?.list || []).filter(b => b.id !== id);
    setStagingData(prev => ({
      ...prev,
      blogs: {
        active: true,
        iframeUrl: prev.blogs?.iframeUrl || "https://blog.amitjoshi.info.np",
        list: blogList
      }
    }));
    showToast("success", "Blog article deleted.");
  };

  // Custom permalink manager handlers
  const handleSavePermalink = () => {
    if (!permalinkForm.slug || !permalinkForm.targetId) {
      showToast("error", "Custom Slug link and Target ID are required.");
      return;
    }
    const cleanSlug = permalinkForm.slug.toLowerCase().replace(/^\/+/, '');
    const customLinks = [...(stagingData.customLinks || [])];

    if (editingItemId) {
      const idx = customLinks.findIndex(l => l.id === editingItemId);
      if (idx !== -1) {
        customLinks[idx] = { ...permalinkForm, id: editingItemId, slug: cleanSlug };
      }
    } else {
      customLinks.push({ ...permalinkForm, id: "link-" + Date.now(), slug: cleanSlug });
    }

    setStagingData(prev => ({ ...prev, customLinks }));
    setPermalinkForm({ type: "page", slug: "", targetId: "", titleEn: "", titleNp: "" });
    setEditingItemId(null);
    showToast("success", "Custom Permalink saved.");
  };

  const handleEditPermalink = (link: any) => {
    setEditingItemId(link.id);
    setPermalinkForm({
      type: link.type || "page",
      slug: link.slug || "",
      targetId: link.targetId || "",
      titleEn: link.titleEn || "",
      titleNp: link.titleNp || ""
    });
    const formElement = document.getElementById("permalink-editor-form");
    if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancelPermalinkEdit = () => {
    setEditingItemId(null);
    setPermalinkForm({ type: "page", slug: "", targetId: "", titleEn: "", titleNp: "" });
  };

  const handleDeletePermalink = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this custom permalink?")) return;
    const customLinks = (stagingData.customLinks || []).filter(l => l.id !== id);
    setStagingData(prev => ({ ...prev, customLinks }));
    showToast("success", "Custom Permalink deleted.");
  };

  // Dynamic Sitemap Generator handlers
  const generateSitemapXml = () => {
    const baseUrl = "https://amitjoshi.info.np";
    const today = new Date().toISOString().split("T")[0];
    
    const staticPages = [
      { loc: `${baseUrl}/`, priority: "1.0", changefreq: "weekly" },
      { loc: `${baseUrl}/blog`, priority: "0.9", changefreq: "daily" },
      { loc: `${baseUrl}/services`, priority: "0.8", changefreq: "weekly" },
      { loc: `${baseUrl}/tools`, priority: "0.8", changefreq: "weekly" },
      { loc: `${baseUrl}/education`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/social-media`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/contact`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/status`, priority: "0.6", changefreq: "monthly" }
    ];

    const blogPages = (stagingData.blogs?.list || []).map((blog: any) => ({
      loc: `${baseUrl}/blog/${blog.slug || blog.id}`,
      lastmod: blog.dateEn || today,
      priority: "0.8",
      changefreq: "weekly"
    }));

    const permalinkPages = (stagingData.customLinks || []).map((link: any) => {
      const cleanSlug = (link.slug || "").replace(/^\/+/, "");
      return {
        loc: `${baseUrl}/${cleanSlug}`,
        lastmod: today,
        priority: "0.7",
        changefreq: "weekly"
      };
    });

    const allUrls = [...staticPages, ...blogPages, ...permalinkPages];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    allUrls.forEach(u => {
      xml += `  <url>\n`;
      xml += `    <loc>${u.loc}</loc>\n`;
      xml += `    <lastmod>${(u as any).lastmod || today}</lastmod>\n`;
      xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
      xml += `    <priority>${u.priority}</priority>\n`;
      xml += `  </url>\n`;
    });
    xml += `</urlset>`;

    return xml;
  };

  const handleCopySitemap = () => {
    const xml = generateSitemapXml();
    navigator.clipboard.writeText(xml);
    showToast("success", "Sitemap XML copied to clipboard!");
  };

  const handleDownloadSitemap = () => {
    const xml = generateSitemapXml();
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sitemap.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("success", "sitemap.xml file downloaded!");
  };

  // Newsletter Subscribers handlers
  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      let list: any[] = [];
      const subSnap = await get(ref(db, "subscribers"));
      if (subSnap.exists()) {
        const data = subSnap.val();
        list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      }
      const portSnap = await get(ref(db, "portfolio/subscribers"));
      if (portSnap.exists()) {
        const data = portSnap.val();
        Object.keys(data).forEach(key => {
          if (!list.some(s => s.email?.toLowerCase() === data[key]?.email?.toLowerCase())) {
            list.push({ id: key, ...data[key] });
          }
        });
      }
      list.sort((a, b) => new Date(b.subscribedAt || b.timestamp || 0).getTime() - new Date(a.subscribedAt || a.timestamp || 0).getTime());
      setSubscribers(list);
    } catch (err) {
      console.error("Failed to fetch subscribers:", err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleDeleteSubscriber = async (id: string, subEmail: string) => {
    if (!window.confirm(`Are you sure you want to remove subscriber "${subEmail}"?`)) return;
    try {
      await set(ref(db, `subscribers/${id}`), null);
      await set(ref(db, `portfolio/subscribers/${id}`), null);
      showToast("success", `Subscriber "${subEmail}" deleted.`);
      fetchSubscribers();
    } catch (e: any) {
      showToast("error", "Failed to delete subscriber: " + e.message);
    }
  };

  const handleExportSubscribersCSV = () => {
    if (subscribers.length === 0) {
      showToast("error", "No subscribers available to export.");
      return;
    }
    const headers = ["ID", "Name", "Email", "Subscribed Date", "Status"];
    const rows = subscribers.map(s => [
      `"${s.id || ''}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${s.subscribedAt || s.timestamp || ''}"`,
      `"${s.status || 'Active'}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", "Newsletter subscribers exported as CSV.");
  };

  const handleCopyAllSubscriberEmails = () => {
    const emails = subscribers.map(s => s.email).filter(Boolean).join(", ");
    if (!emails) {
      showToast("error", "No emails to copy.");
      return;
    }
    navigator.clipboard.writeText(emails);
    setCopiedAllSubs(true);
    setTimeout(() => setCopiedAllSubs(false), 3000);
    showToast("success", `Copied ${subscribers.length} subscriber emails to clipboard!`);
  };

  // Service admin user credentials manager handlers
  const handleSaveServiceUser = async () => {
    if (!serviceUserForm.username.trim() || !serviceUserForm.pin.trim()) {
      showToast("error", "Username and 4-digit PIN are required.");
      return;
    }
    if (serviceUserForm.pin.trim().length !== 4 || !/^\d{4}$/.test(serviceUserForm.pin.trim())) {
      showToast("error", "PIN must be exactly 4 digits.");
      return;
    }

    const currentUsers = [...(stagingData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers || [])];
    const cleanUsername = serviceUserForm.username.trim().toLowerCase();
    const cleanPin = serviceUserForm.pin.trim();

    let updatedUsers: any[] = [];

    if (editingItemId) {
      updatedUsers = currentUsers.map(u => 
        u.id === editingItemId 
          ? { 
              ...u, 
              ...serviceUserForm, 
              username: cleanUsername, 
              pin: cleanPin,
              status: serviceUserForm.status || "active"
            } 
          : u
      );
    } else {
      if (currentUsers.some(u => u.username.toLowerCase() === cleanUsername)) {
        showToast("error", "A user with this username already exists! Choose another username.");
        return;
      }
      const newUser = {
        id: "usr-" + Date.now(),
        name: serviceUserForm.name.trim() || "Service Admin",
        username: cleanUsername,
        pin: cleanPin,
        role: serviceUserForm.role || "services_admin",
        status: serviceUserForm.status || "active",
        createdAt: new Date().toISOString().split("T")[0]
      };
      updatedUsers = [...currentUsers, newUser];
    }

    setStagingData(prev => ({ ...prev, serviceAdminUsers: updatedUsers }));
    try {
      await set(ref(db, "portfolio/serviceAdminUsers"), updatedUsers);
      showToast("success", editingItemId ? "Service Admin user updated and synced with Cloud." : "New Services Admin user created and synced with Cloud.");
    } catch (err: any) {
      showToast("error", "Saved to staging (Cloud sync failed: " + err.message + ")");
    }
    setServiceUserForm({ username: "", pin: "", name: "", role: "services_admin", status: "active" });
    setEditingItemId(null);
  };

  const handleDeleteServiceUser = async (id: string) => {
    const currentUsers = [...(stagingData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers || [])];
    if (currentUsers.length <= 1) {
      showToast("error", "Cannot delete the only remaining admin user. At least one user must exist.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this services admin user?")) return;
    const updated = currentUsers.filter(u => u.id !== id);
    setStagingData(prev => ({ ...prev, serviceAdminUsers: updated }));
    try {
      await set(ref(db, "portfolio/serviceAdminUsers"), updated);
      showToast("success", "Services Admin user deleted.");
    } catch (e: any) {
      showToast("error", "Deleted in staging: " + e.message);
    }
  };

  const handleToggleUserRestriction = async (id: string, currentStatus?: string) => {
    const newStatus = currentStatus === "restricted" ? "active" : "restricted";
    const currentUsers = [...(stagingData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers || [])];
    const updated = currentUsers.map(u => u.id === id ? { ...u, status: newStatus as any } : u);
    setStagingData(prev => ({ ...prev, serviceAdminUsers: updated }));
    try {
      await set(ref(db, "portfolio/serviceAdminUsers"), updated);
      showToast("success", `User ${newStatus === "restricted" ? "RESTRICTED 🛑" : "ACTIVATED ✅"} successfully.`);
    } catch (e: any) {
      showToast("error", "Status changed in staging.");
    }
  };

  // Helper formatting for dynamic preview window checks
  const getAnnouncementLineBreaksCount = () => {
    const activeText = activeLangTab === "en" ? stagingData.popup?.textEn : stagingData.popup?.textNp;
    if (!activeText) return 0;
    return activeText.split("\n").length;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-cyan-400 font-mono">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-10 w-10 animate-spin text-cyan-400" />
          <span className="text-xs uppercase tracking-widest">Initializing Secure Terminal...</span>
        </div>
      </div>
    );
  }

  // Render Login Form if NOT authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#030712] relative overflow-hidden flex items-center justify-center p-4">
        {/* Interactive background canvas effect */}
        <NetworkCanvas isDarkMode={true} />

        {/* Global Toast Status Notice */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center space-x-2 px-5 py-3 rounded-xl border shadow-xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300 ${
            toast.type === "success" 
              ? "bg-green-950/90 border-green-500/40 text-green-300" 
              : "bg-red-950/90 border-red-500/40 text-red-300"
          }`}>
            {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <span className="text-xs font-mono font-bold tracking-tight">{toast.message}</span>
          </div>
        )}

        {/* Login HUD Frame */}
        <div className="relative w-full max-w-md bg-white/[0.02] border border-cyan-500/25 rounded-2xl p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_25px_rgba(6,182,212,0.15)] text-white space-y-8 z-10">
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <Lock className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold tracking-wider font-mono bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent uppercase">
              Secure CMS Login
            </h2>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest leading-none">
              Amit Joshi Administrative Console
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email input field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block">
                Administrative Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@amitjoshi.info.np"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-10 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <Mail className="h-4 w-4 text-gray-500 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Password input field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                  Password Key
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[9px] font-mono text-purple-400 hover:text-cyan-300 uppercase tracking-wide focus:outline-none"
                >
                  Forgot Key?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-10 pr-10 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <Lock className="h-4 w-4 text-gray-500 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-white absolute right-3 top-3.5 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Login trigger button */}
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95 duration-150"
            >
              <span>Initialize Authorization</span>
            </button>
          </form>

          {/* Quick instructions indicator block */}
          <div className="pt-4 border-t border-white/5 flex justify-between text-[9px] font-mono text-gray-600 uppercase">
            <span>Single-Device Session active</span>
            <span>v1.0.4 - CJS Secure</span>
          </div>

        </div>
      </div>
    );
  }

  // Calculate unread submission badges
  const unreadAppsCount = applications.filter(a => !a.read).length;
  const unreadSugsCount = suggestions.filter(s => !s.read).length;
  const totalUnreadServices = unreadAppsCount + unreadSugsCount;

  // Render Full cms Admin HUD if authenticated
  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col justify-between">
      
      {/* Dynamic Background Network lines */}
      <NetworkCanvas isDarkMode={true} />

      {/* Global Toast Alerts */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center space-x-2 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300 ${
          toast.type === "success" 
            ? "bg-green-950/90 border-green-500/40 text-green-300" 
            : "bg-red-950/90 border-red-500/40 text-red-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          <span className="text-xs font-mono font-bold tracking-tight">{toast.message}</span>
        </div>
      )}

      {/* ================= TELEMETRY HEADER & HUD SYSTEM ================= */}
      <header className="sticky top-0 z-30 bg-[#030712]/90 border-b border-white/10 backdrop-blur-md p-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Settings className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <h1 className="text-base font-bold font-mono text-white tracking-widest uppercase">
                Administrative CMS HUD
              </h1>
              <p className="text-[10px] text-gray-400 font-mono tracking-wide">
                User Authenticated: <span className="text-cyan-400 font-bold">{user.email}</span>
              </p>
            </div>
          </div>

          {/* HUD Meta Analytics metrics */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono uppercase bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2 text-gray-400">
            <div className="flex items-center space-x-1.5 border-r border-white/5 pr-4">
              <Calendar className="h-3.5 w-3.5 text-purple-400" />
              <span>Prior Session: <span className="text-white">{stats.previousLogin}</span></span>
            </div>
            <div className="flex items-center space-x-1.5 border-r border-white/5 pr-4 pl-2">
              <Users className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>Visits: <span className="text-white font-bold">{stats.visits}</span></span>
            </div>
            <div className="flex items-center space-x-1.5 pl-2">
              <Database className="h-3.5 w-3.5 text-yellow-400" />
              <span>Objects Tally: <span className="text-white font-bold">{stats.objectCount}</span></span>
            </div>
          </div>

          {/* Quick HUD Navigation Trigger actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveStaging}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-all active:scale-95 duration-100"
              title="Saves configuration to database paths"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Data</span>
            </button>
            <button
              onClick={handleCommitLiveNow}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white shadow-lg active:scale-95 duration-100"
              title="Updates public client node instantly"
            >
              <PreviewIcon className="h-3.5 w-3.5 animate-pulse" />
              <span>Live Now</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all"
              title="Safely exit admin workspace"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      {/* ================= CMS BODY MATRIX ================= */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* LEFT COLUMN: Section switcher list (3 Cols) */}
        <div className="lg:col-span-3 space-y-2 bg-white/[0.02] border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <h3 className="text-[10px] font-mono font-bold tracking-widest text-gray-500 uppercase px-2 pb-2 border-b border-white/5 mb-3">
            Manage Sections
          </h3>
          {[
            { id: "blogs", label: "Dynamic Blog Manager 📝", icon: BookOpen },
            { id: "customLinks", label: "Custom Permalinks 🔗", icon: ExternalLink },
            { id: "serviceAdminUsers", label: "Services Admin Users 🛡️", icon: Users },
            { id: "header", label: "Favicons & Branding", icon: Layout },
            { id: "biography", label: "Homepage & Biographies", icon: Users },
            { id: "slides", label: "Cinematic Home Slides", icon: Sliders },
            { id: "socials", label: "Social Media Hub", icon: Landmark },
            { id: "initiatives", label: "Strategic Initiatives", icon: BookOpen },
            { id: "tools", label: "Utility Tool Deck", icon: Sliders },
            { id: "education", label: "Academic Milestones", icon: GraduationCap },
            { id: "services", label: "Premium Services", icon: Landmark },
            { id: "interests", label: "Personal Passions", icon: Heart },
            { id: "popup", label: "Announcement Popup", icon: Settings },
            { id: "maps", label: "Google Maps Embeds", icon: MapPin },
            { id: "footer", label: "Footer, Privacy & Links", icon: Layout }
          ].map((sec) => {
            const Icon = sec.icon;
            const isActive = activeCmsSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveCmsSection(sec.id as any);
                  setEditingItemId(null);
                }}
                className={`w-full text-left inline-flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                  isActive 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md" 
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400 animate-pulse" : "text-gray-500"}`} />
                <span className="flex-1 truncate">{sec.label}</span>
                {sec.id === "serviceAdminUsers" && totalUnreadServices > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-mono text-[10px] font-extrabold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    {totalUnreadServices}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Active Content Manager Block (9 Cols) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* MULTILINGUAL SYNC TABS */}
          <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-2xl p-3 backdrop-blur-md">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 pl-2">
              Multilingual payload synchronizer
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveLangTab("en")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                  activeLangTab === "en" 
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" 
                    : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                }`}
              >
                [English Data] <span className="text-[9px] text-cyan-500">*Required</span>
              </button>
              <button
                onClick={() => setActiveLangTab("np")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                  activeLangTab === "np" 
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                    : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                }`}
              >
                [Nepali Data] <span className="text-[9px] text-purple-500">Optional</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC FORM SHELL CONTENT */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-6 text-xs">
            
            {/* ---------------- SECTION: DYNAMIC BLOG MANAGER ---------------- */}
            {activeCmsSection === "blogs" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-cyan-400" />
                      <span>Dynamic Blog & Publications Manager</span>
                    </h3>
                    <p className="text-gray-400 mt-1 text-xs">
                      Create, edit, format, and publish responsive blog articles. Posts are stored dynamically in Firebase and generate unique clean URL permalinks.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href="./blog"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold uppercase tracking-wider transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Public Blog Archive</span>
                    </a>
                    {editingItemId && (
                      <button
                        type="button"
                        onClick={handleCancelBlogEdit}
                        className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-white/10 text-xs font-mono font-bold uppercase"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Card: Create / Edit Blog Article */}
                <div id="blog-editor-form" className="p-5 bg-black/40 border border-cyan-500/30 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h4 className="font-bold text-white uppercase tracking-wider flex items-center space-x-2 text-xs font-mono">
                      <BookOpen className="h-4 w-4 text-cyan-400" />
                      <span>{editingItemId ? `✏️ Editing Post (ID: ${editingItemId})` : "➕ Create New Blog Post"}</span>
                    </h4>
                    {editingItemId && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold">
                        MODIFICATION MODE
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                        Article Title ({activeLangTab.toUpperCase()}) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={activeLangTab === "en" ? blogForm.titleEn : blogForm.titleNp}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (activeLangTab === "en") {
                            setBlogForm(prev => ({
                              ...prev,
                              titleEn: val,
                              slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
                            }));
                          } else {
                            setBlogForm(prev => ({ ...prev, titleNp: val }));
                          }
                        }}
                        placeholder={activeLangTab === "en" ? "e.g. Modern Web Architecture & AI Engineering" : "लेखको शीर्षक प्रविष्ट गर्नुहोस्..."}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 font-sans text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                        URL Slug / Permalink <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 font-mono text-xs">/blog/</span>
                        <input
                          type="text"
                          value={blogForm.slug}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") }))}
                          placeholder="article-slug-url"
                          className="w-full bg-black/50 border border-white/10 rounded-xl pl-16 pr-3 py-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Preview: https://amitjoshi.info.np/blog/{blogForm.slug || "slug"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                        Author Name ({activeLangTab.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={activeLangTab === "en" ? blogForm.authorEn : blogForm.authorNp}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (activeLangTab === "en") setBlogForm(prev => ({ ...prev, authorEn: val }));
                          else setBlogForm(prev => ({ ...prev, authorNp: val }));
                        }}
                        placeholder={activeLangTab === "en" ? "Amit Joshi" : "अमित जोशी"}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                        Publish Date ({activeLangTab.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={activeLangTab === "en" ? blogForm.dateEn : blogForm.dateNp}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (activeLangTab === "en") setBlogForm(prev => ({ ...prev, dateEn: val }));
                          else setBlogForm(prev => ({ ...prev, dateNp: val }));
                        }}
                        placeholder={activeLangTab === "en" ? "YYYY-MM-DD (e.g. 2026-03-29)" : "२०८२-१२-१५"}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                        Publish Time ({activeLangTab.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={activeLangTab === "en" ? blogForm.timeEn : blogForm.timeNp}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (activeLangTab === "en") setBlogForm(prev => ({ ...prev, timeEn: val }));
                          else setBlogForm(prev => ({ ...prev, timeNp: val }));
                        }}
                        placeholder={activeLangTab === "en" ? "e.g. 10:30 AM" : "बिहान १०:३०"}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Featured Main Photo */}
                    <div className="space-y-2 md:col-span-2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <label className="text-gray-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Featured Main Image</span>
                        <span className="text-gray-500 font-mono text-[10px]">URL or direct upload</span>
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="text"
                          value={blogForm.mainPhoto}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, mainPhoto: e.target.value }))}
                          placeholder="https://images.unsplash.com/... or Base64 Data URL"
                          className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                        <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold shrink-0 transition-all">
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setBlogForm(prev => ({ ...prev, mainPhoto: reader.result as string }));
                                  showToast("success", "Featured photo loaded.");
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {blogForm.mainPhoto && (
                        <div className="relative inline-block mt-2">
                          <img
                            src={blogForm.mainPhoto}
                            alt="Featured Preview"
                            className="h-20 w-32 object-cover rounded-lg border border-cyan-500/40 shadow"
                          />
                          <button
                            type="button"
                            onClick={() => setBlogForm(prev => ({ ...prev, mainPhoto: "" }))}
                            className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shadow hover:bg-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Additional Photo Gallery */}
                    <div className="space-y-2 md:col-span-2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <label className="text-gray-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Multi-Image Gallery Attachments ({blogForm.additionalPhotos?.length || 0})</span>
                        <span className="text-gray-500 font-mono text-[10px]">Add supplementary photos for article viewer</span>
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="text"
                          value={blogForm.additionalPhotoInput}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, additionalPhotoInput: e.target.value }))}
                          placeholder="Additional Photo URL..."
                          className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddBlogGalleryPhoto}
                          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add to Gallery</span>
                        </button>
                        <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold shrink-0 transition-all">
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setBlogForm(prev => ({
                                    ...prev,
                                    additionalPhotos: [...(prev.additionalPhotos || []), reader.result as string]
                                  }));
                                  showToast("success", "Gallery photo added.");
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {blogForm.additionalPhotos && blogForm.additionalPhotos.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {blogForm.additionalPhotos.map((photoUrl, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={photoUrl}
                                alt={`Gallery ${idx + 1}`}
                                className="h-16 w-24 object-cover rounded-lg border border-white/10 shadow group-hover:border-cyan-400 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveBlogGalleryPhoto(idx)}
                                className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full h-4 w-4 flex items-center justify-center text-[9px] font-bold shadow"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rich Text Body Content with Advanced Editor */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-gray-400 text-[11px] font-bold uppercase tracking-wider block">
                        Article Body Content ({activeLangTab.toUpperCase()}) <span className="text-red-400">*</span>
                      </label>
                      <RichBlogEditor
                        value={activeLangTab === "en" ? blogForm.contentEn : blogForm.contentNp}
                        onChange={(val) => {
                          if (activeLangTab === "en") setBlogForm(prev => ({ ...prev, contentEn: val }));
                          else setBlogForm(prev => ({ ...prev, contentNp: val }));
                        }}
                        placeholder={activeLangTab === "en" ? "Write or paste article paragraphs, exact newlines, blank lines, lists, markdown formatting, insights, code snippets..." : "लेखको विस्तृत विवरण लेख्नुहोस्..."}
                        lang={activeLangTab}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/5">
                    {editingItemId && (
                      <button
                        type="button"
                        onClick={handleCancelBlogEdit}
                        className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-xs font-bold uppercase transition-all"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveBlog}
                      className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/25 transition-all"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingItemId ? "Update Blog Article" : "Save & Publish Article"}</span>
                    </button>
                  </div>
                </div>

                {/* Table / List of Existing Blog Articles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white uppercase tracking-wider text-xs font-mono flex items-center space-x-2">
                      <span>Published Blog Articles</span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                        {(stagingData.blogs?.list || []).length} Posts
                      </span>
                    </h4>
                  </div>

                  {(stagingData.blogs?.list || []).length === 0 ? (
                    <div className="text-center py-10 bg-black/20 rounded-2xl border border-white/5 text-gray-500">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40 text-cyan-400" />
                      <p className="text-xs font-mono">No blog articles published yet. Fill out the form above to add your first article.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(stagingData.blogs?.list || []).map((blog: any) => (
                        <div
                          key={blog.id}
                          className="bg-black/40 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-4 space-y-3 transition-all group relative overflow-hidden"
                        >
                          <div className="flex items-start gap-3">
                            {blog.mainPhoto ? (
                              <img
                                src={blog.mainPhoto}
                                alt={blog.titleEn}
                                className="h-16 w-24 object-cover rounded-xl border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="h-16 w-24 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                                <BookOpen className="h-6 w-6 opacity-60" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/20">
                                  /blog/{blog.slug || blog.id}
                                </span>
                                {blog.additionalPhotos && blog.additionalPhotos.length > 0 && (
                                  <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                    +{blog.additionalPhotos.length} photos
                                  </span>
                                )}
                              </div>
                              <h5 className="font-bold text-white text-sm line-clamp-1 mt-1 font-sans group-hover:text-cyan-300 transition-colors">
                                {blog.titleEn || blog.titleNp}
                              </h5>
                              <p className="text-gray-400 text-[10px] font-mono mt-0.5">
                                By {blog.authorEn || blog.authorNp || "Amit Joshi"} • {blog.dateEn || "Recent"} {blog.timeEn ? `(${blog.timeEn})` : ""}
                              </p>
                            </div>
                          </div>

                          <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                            {blog.contentEn || blog.contentNp}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <a
                              href={`./blog?blog=${blog.slug || blog.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 font-mono text-[10px] font-bold inline-flex items-center space-x-1"
                            >
                              <span>Preview</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>

                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditBlog(blog)}
                                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold transition-all"
                              >
                                <Edit3 className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBlog(blog.id)}
                                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold transition-all"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- SECTION: CUSTOM PERMALINKS & SLUGS ---------------- */}
            {activeCmsSection === "customLinks" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                      <ExternalLink className="h-5 w-5 text-cyan-400" />
                      <span>Custom Permalinks & Clean Routing Engine</span>
                    </h3>
                    <p className="text-gray-400 mt-1 text-xs">
                      Define custom vanity slugs (e.g., <span className="text-cyan-300 font-mono">/bio</span>, <span className="text-cyan-300 font-mono">/contact</span>, <span className="text-cyan-300 font-mono">/tools</span>) to route directly to page sections, utilities, dynamic forms, or articles.
                    </p>
                  </div>
                  {editingItemId && (
                    <button
                      type="button"
                      onClick={handleCancelPermalinkEdit}
                      className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-xs font-bold uppercase"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Form Card: Create / Edit Permalink */}
                <div id="permalink-editor-form" className="p-5 bg-black/40 border border-cyan-500/30 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h4 className="font-bold text-white uppercase tracking-wider flex items-center space-x-2 text-xs font-mono">
                      <ExternalLink className="h-4 w-4 text-cyan-400" />
                      <span>{editingItemId ? `✏️ Edit Custom Permalink (ID: ${editingItemId})` : "➕ Register New Custom Permalink"}</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                        Link Type
                      </label>
                      <select
                        value={permalinkForm.type}
                        onChange={(e) => setPermalinkForm(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                      >
                        <option value="page">Page Section Anchor (e.g. #tools, #contact)</option>
                        <option value="tool">Utility Tool (e.g. nepali-date, calendar)</option>
                        <option value="form">Dynamic Form Modal</option>
                        <option value="blog">Blog Article Slug</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                        Custom Slug (URL Path) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 font-mono text-xs">/</span>
                        <input
                          type="text"
                          value={permalinkForm.slug}
                          onChange={(e) => setPermalinkForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") }))}
                          placeholder="my-custom-slug"
                          className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Direct URL: https://amitjoshi.info.np/{permalinkForm.slug || "slug"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                        Target Section or Item ID <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={permalinkForm.targetId}
                        onChange={(e) => setPermalinkForm(prev => ({ ...prev, targetId: e.target.value }))}
                        placeholder="e.g. tools-section, initiatives-section, contact-section"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                        Display Label / Title ({activeLangTab.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={activeLangTab === "en" ? permalinkForm.titleEn : permalinkForm.titleNp}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (activeLangTab === "en") setPermalinkForm(prev => ({ ...prev, titleEn: val }));
                          else setPermalinkForm(prev => ({ ...prev, titleNp: val }));
                        }}
                        placeholder={activeLangTab === "en" ? "e.g. Direct Tool Deck Access" : "सिधा लिंक"}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-sans text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/5">
                    {editingItemId && (
                      <button
                        type="button"
                        onClick={handleCancelPermalinkEdit}
                        className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-xs font-bold uppercase"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSavePermalink}
                      className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/25"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingItemId ? "Update Permalink" : "Save Custom Permalink"}</span>
                    </button>
                  </div>
                </div>

                {/* Table of Existing Permalinks */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white uppercase tracking-wider text-xs font-mono flex items-center space-x-2">
                      <span>Configured Permalinks</span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                        {(stagingData.customLinks || []).length} Mappings
                      </span>
                    </h4>
                  </div>

                  {(stagingData.customLinks || []).length === 0 ? (
                    <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/5 text-gray-500">
                      <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-40 text-cyan-400" />
                      <p className="text-xs font-mono">No custom permalinks created yet. Register one in the form above.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase tracking-wider">
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Public Vanity URL</th>
                            <th className="py-2.5 px-3">Target ID</th>
                            <th className="py-2.5 px-3">Label</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(stagingData.customLinks || []).map((link: any) => (
                            <tr key={link.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase">
                                  {link.type || "page"}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <a
                                  href={`./${link.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-300 hover:text-cyan-200 underline font-bold"
                                >
                                  /{link.slug}
                                </a>
                              </td>
                              <td className="py-3 px-3 text-gray-400">
                                {link.targetId}
                              </td>
                              <td className="py-3 px-3 text-white font-sans">
                                {link.titleEn || link.titleNp || "-"}
                              </td>
                              <td className="py-3 px-3 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditPermalink(link)}
                                  className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePermalink(link.id)}
                                  className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- SECTION: SERVICES ADMIN USERS & CREDENTIALS ---------------- */}
            {activeCmsSection === "serviceAdminUsers" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-cyan-400" />
                      <span>Services Admin Users & Access Controls</span>
                    </h3>
                    <p className="text-gray-400 mt-1 text-xs">
                      Manage authorized login credentials (username and 4-digit PIN) for the dedicated <span className="text-cyan-300 font-mono font-bold">/adminservices</span> Services & Submissions Portal.
                    </p>
                  </div>
                  <a
                    href="./adminservices"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold uppercase tracking-wider transition-all"
                  >
                    <span>Open Services Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Form Card: Create / Edit User */}
                <div className="p-5 bg-black/40 border border-cyan-500/30 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h4 className="font-bold text-white uppercase tracking-wider flex items-center space-x-2 text-xs font-mono">
                      <Users className="h-4 w-4 text-cyan-400" />
                      <span>{editingItemId ? "✏️ Edit Services Admin Credentials" : "➕ Create New Services Admin User"}</span>
                    </h4>
                    {editingItemId && (
                      <button
                        onClick={() => {
                          setEditingItemId(null);
                          setServiceUserForm({ username: "", pin: "", name: "", role: "services_admin", status: "active" });
                        }}
                        className="text-[10px] font-mono text-gray-400 hover:text-white uppercase"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-mono font-bold text-gray-400 uppercase text-[10px]">User Display Name / Label</label>
                      <input
                        type="text"
                        value={serviceUserForm.name}
                        onChange={(e) => setServiceUserForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Primary Services Admin / Support"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono font-bold text-cyan-400 uppercase text-[10px]">Username (Login ID) *</label>
                      <input
                        type="text"
                        required
                        value={serviceUserForm.username}
                        onChange={(e) => setServiceUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                        placeholder="e.g. loginadmin or amit2026"
                        className="w-full bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono font-bold text-cyan-400 uppercase text-[10px]">4-Digit PIN Code (Password) *</label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        value={serviceUserForm.pin}
                        onChange={(e) => setServiceUserForm(prev => ({ ...prev, pin: e.target.value.replace(/[^0-9]/g, '') }))}
                        placeholder="4 digits e.g. 1860"
                        className="w-full bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 font-mono tracking-widest"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono font-bold text-gray-400 uppercase text-[10px]">Administrative Role</label>
                      <input
                        type="text"
                        value={serviceUserForm.role}
                        onChange={(e) => setServiceUserForm(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="e.g. services_admin / support / manager"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono font-bold text-gray-400 uppercase text-[10px]">Account Access Status</label>
                      <select
                        value={serviceUserForm.status || "active"}
                        onChange={(e) => setServiceUserForm(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="active">Active (Access Allowed)</option>
                        <option value="restricted">Restricted (Login Blocked)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleSaveServiceUser}
                        className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold font-mono uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>{editingItemId ? "Update Credentials" : "Create Services User"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Directory List of Current Authorized Users */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-mono font-bold text-gray-400 uppercase text-xs tracking-wider">
                      Current Authorized Services Users ({(stagingData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers || []).length})
                    </h4>
                    <span className="text-[10px] text-gray-500 font-mono">
                      Credentials are encrypted and synced in real-time
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 shadow-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-gray-400 font-mono uppercase tracking-wider text-[10px] border-b border-white/10">
                        <tr>
                          <th className="py-3 px-4">User Label & Role</th>
                          <th className="py-3 px-4">Username (Login ID)</th>
                          <th className="py-3 px-4">4-Digit PIN Code</th>
                          <th className="py-3 px-4">Login Access Status</th>
                          <th className="py-3 px-4">Created Date</th>
                          <th className="py-3 px-4 text-right">Actions & Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(stagingData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers || []).map((u) => {
                          const isRestricted = u.status === "restricted";
                          const isPinRevealed = !!showPins[u.id];

                          return (
                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-white">{u.name || "Services Administrator"}</div>
                                <div className="text-[10px] font-mono text-gray-500 mt-0.5">{u.role || "services_admin"}</div>
                              </td>

                              <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 select-all">
                                {u.username}
                              </td>

                              <td className="py-3.5 px-4 font-mono">
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2.5 py-1 rounded-md font-bold tracking-widest text-xs ${isPinRevealed ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "bg-black/60 text-gray-400 border border-white/10"}`}>
                                    {isPinRevealed ? u.pin : "••••"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setShowPins(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                                    className="p-1 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    title={isPinRevealed ? "Hide 4-Digit PIN" : "Reveal 4-Digit PIN"}
                                  >
                                    {isPinRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                  isRestricted 
                                    ? "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse" 
                                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                }`}>
                                  {isRestricted ? "🛑 Restricted" : "✅ Active"}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                                {u.createdAt || "2026-01-01"}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  {/* Toggle restriction */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserRestriction(u.id, u.status)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                                      isRestricted
                                        ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                                        : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    }`}
                                    title={isRestricted ? "Enable user login access" : "Block/restrict this user from logging in"}
                                  >
                                    {isRestricted ? "Activate" : "Restrict"}
                                  </button>

                                  {/* Edit user */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingItemId(u.id);
                                      setServiceUserForm({
                                        name: u.name || "",
                                        username: u.username,
                                        pin: u.pin,
                                        role: u.role || "services_admin",
                                        status: u.status || "active"
                                      });
                                    }}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/5 border border-white/5 transition-colors cursor-pointer"
                                    title="Edit credentials"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>

                                  {/* Delete user */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteServiceUser(u.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-white/5 transition-colors cursor-pointer"
                                    title="Delete user"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- SERVICE APPLICATIONS SECTION ---------------- */}
            {activeCmsSection === "applications" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Service Applications Portal</h3>
                    <p className="text-gray-500 mt-1">Review official service inquiries, permanent Nepalese address nodes, and uploaded document packages.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {unreadAppsCount > 0 && (
                      <button
                        onClick={() => handleMarkAllRead("service_applications", applications)}
                        className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-xl hover:bg-red-500/30 transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-mono font-bold uppercase animate-pulse"
                      >
                        <span>Mark All Read ({unreadAppsCount})</span>
                      </button>
                    )}
                    <button 
                      onClick={fetchApplications}
                      className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer flex items-center space-x-1.5"
                      title="Refresh applications"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="text-[10px] font-mono font-bold uppercase">Refresh</span>
                    </button>
                  </div>
                </div>

                {applications.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 font-mono">
                    No service applications submitted yet.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {applications.map((app) => (
                      <div key={app.id} className={`p-6 bg-black/40 border rounded-2xl space-y-4 relative group transition-all ${!app.read ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "border-white/10"}`}>
                        
                        {/* Header card info */}
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400 font-mono font-bold uppercase tracking-wider">
                                {app.serviceTitle}
                              </span>
                              {!app.read && (
                                <span className="px-2 py-0.5 rounded bg-red-500 text-white font-mono text-[9px] font-extrabold uppercase animate-pulse">
                                  UNREAD
                                </span>
                              )}
                            </div>
                            <h4 className="text-base font-extrabold text-white mt-1">{app.name}</h4>
                            <span className="text-[10px] font-mono text-gray-500 block mt-0.5">
                              Applied At: {new Date(app.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-wrap gap-1">
                            {!app.read && (
                              <button
                                type="button"
                                onClick={() => handleMarkRead("service_applications", app.id)}
                                className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                Mark Read
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleEditAccess("service_applications", app.id, app.allowEdit || false)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase transition-all flex items-center space-x-1 ${app.allowEdit ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"}`}
                              title="Toggle whether user can edit their submitted data via Check Status"
                            >
                              <span>{app.allowEdit ? "🔓 User Edit: ON" : "🔒 User Edit: OFF"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingApp(editingApp && editingApp.id === app.id ? null : { ...app })}
                              className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 text-[10px] font-mono font-bold uppercase transition-all flex items-center space-x-1"
                              title="Modify uploaded application data"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>{editingApp && editingApp.id === app.id ? "Cancel Edit" : "Modify Data"}</span>
                            </button>
                            <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                              app.contactMethod === "WhatsApp" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            }`}>
                              Contact via: {app.contactMethod || "Email"}
                            </span>
                            <button
                              onClick={() => handleDeleteApplication(app.id)}
                              className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-black transition-colors cursor-pointer"
                              title="Delete application record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {editingApp && editingApp.id === app.id ? (
                          <div className="p-4 bg-cyan-950/40 border border-cyan-500/50 rounded-xl space-y-3 font-mono text-xs">
                            <h5 className="font-bold text-cyan-300 uppercase tracking-wider">✏️ Admin Modify Application Data</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase block mb-1">Applicant Name</label>
                                <input type="text" value={editingApp.name || ""} onChange={e => setEditingApp({...editingApp, name: e.target.value})} className="w-full bg-black/60 border border-cyan-500/30 rounded p-2 text-white" />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase block mb-1">Phone Contact</label>
                                <input type="text" value={editingApp.contact || ""} onChange={e => setEditingApp({...editingApp, contact: e.target.value})} className="w-full bg-black/60 border border-cyan-500/30 rounded p-2 text-white" />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase block mb-1">Email</label>
                                <input type="text" value={editingApp.email || ""} onChange={e => setEditingApp({...editingApp, email: e.target.value})} className="w-full bg-black/60 border border-cyan-500/30 rounded p-2 text-white" />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase block mb-1">Temporary Address</label>
                                <input type="text" value={editingApp.temporaryAddress || ""} onChange={e => setEditingApp({...editingApp, temporaryAddress: e.target.value})} className="w-full bg-black/60 border border-cyan-500/30 rounded p-2 text-white" />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase block mb-1">Permanent District</label>
                                <input type="text" value={editingApp.permanentAddress?.district || ""} onChange={e => setEditingApp({...editingApp, permanentAddress: {...(editingApp.permanentAddress || {}), district: e.target.value}})} className="w-full bg-black/60 border border-cyan-500/30 rounded p-2 text-white" />
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                              <button type="button" onClick={() => setEditingApp(null)} className="px-3 py-1.5 rounded bg-gray-700 text-white text-xs">Cancel</button>
                              <button type="button" onClick={() => handleUpdateApplicationData(app.id, editingApp)} className="px-4 py-1.5 rounded bg-cyan-500 text-black font-bold text-xs uppercase flex items-center space-x-1">
                                <Save className="h-3 w-3" />
                                <span>Save Modified Data</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Contacts and Addresses Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left contact info */}
                          <div className="space-y-3 p-4 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
                            <h5 className="font-mono font-bold text-cyan-400 text-[10px] uppercase tracking-wider">Contact Coordinates</h5>
                            <div className="space-y-2 font-mono">
                              <div className="flex items-center space-x-2">
                                <Phone className="h-3.5 w-3.5 text-gray-500" />
                                <span className="text-gray-400">Phone:</span>
                                <span className="text-white select-all">{app.contact}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-3.5 w-3.5 text-gray-500" />
                                <span className="text-gray-400">Email:</span>
                                <span className="text-white select-all">{app.email}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right permanent addresses */}
                          <div className="space-y-3 p-4 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
                            <h5 className="font-mono font-bold text-cyan-400 text-[10px] uppercase tracking-wider">Address Nodes</h5>
                            <div className="space-y-1.5 leading-relaxed">
                              <div>
                                <span className="text-gray-500 font-mono text-[9px] uppercase block">Permanent Address:</span>
                                <span className="text-white font-sans font-medium">
                                  {app.permanentAddress?.province || "N/A"} Province, {app.permanentAddress?.district || "N/A"} District, {app.permanentAddress?.localLevel || "N/A"}, Ward {app.permanentAddress?.ward || "N/A"}, {app.permanentAddress?.tole || "N/A"} Tole
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-mono text-[9px] uppercase block mt-1">Temporary Address:</span>
                                <span className="text-gray-300 font-sans">
                                  {app.temporaryAddress || "Not Provided"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Custom CMS Answers if any */}
                        {app.customAnswers && Object.keys(app.customAnswers).length > 0 && (
                          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl space-y-3 text-xs">
                            <h5 className="font-mono font-bold text-cyan-400 text-[10px] uppercase tracking-wider">Additional Answers</h5>
                            <div className="space-y-2.5">
                              {Object.keys(app.customAnswers).map((q, qidx) => (
                                <div key={qidx} className="border-l-2 border-cyan-500/30 pl-3">
                                  <span className="text-gray-500 font-mono text-[10px] block">{q}</span>
                                  <p className="text-white mt-1 font-sans">{app.customAnswers[q]}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Uploaded Attachments */}
                        {app.attachments && app.attachments.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="font-mono font-bold text-cyan-400 text-[10px] uppercase tracking-wider px-1">Submitted Document Packages</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {app.attachments.map((file: any, fidx: number) => {
                                const isImage = file.data && file.data.startsWith("data:image/");
                                return (
                                  <div key={fidx} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-4">
                                    <div className="flex items-center space-x-2.5 min-w-0">
                                      <div className="p-2 rounded-lg bg-white/5 text-cyan-400 flex-shrink-0">
                                        <FileText className="h-4 w-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-[9px] font-mono font-bold text-cyan-400 block uppercase tracking-wider truncate">
                                          {file.name}
                                        </span>
                                        <span className="text-[10px] text-gray-300 truncate block font-mono" title={file.fileName}>
                                          {file.fileName || file.name}
                                        </span>
                                      </div>
                                    </div>
                                    {isImage && (
                                      <img src={file.data} alt="thumb" className="w-8 h-8 rounded object-cover border border-white/20 flex-shrink-0" referrerPolicy="no-referrer" />
                                    )}
                                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                                      <a
                                        href={file.data}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1.5 rounded bg-cyan-500 text-black hover:bg-cyan-400 text-[9px] font-bold font-mono uppercase tracking-wide"
                                      >
                                        View
                                      </a>
                                      <a
                                        href={file.data}
                                        download={file.fileName || file.name}
                                        className="p-1.5 rounded bg-purple-500 text-white hover:bg-purple-400 text-[9px] font-bold font-mono uppercase tracking-wide"
                                      >
                                        Download
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAttachment(app.id, fidx, app.attachments)}
                                        className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-black text-[9px] font-bold font-mono uppercase tracking-wide cursor-pointer flex items-center space-x-0.5"
                                        title="Delete only this specific uploaded file"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                        <span>Del File</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Admin Remarks & Status Control Block */}
                        <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-xl space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">Request ID:</span>
                              <span className="px-2 py-0.5 rounded font-mono font-extrabold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 select-all">
                                {app.id}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <label className="text-[10px] font-mono text-gray-400 uppercase">Application Status:</label>
                              <select 
                                defaultValue={app.status || "Pending"} 
                                onChange={(e) => {
                                  const textarea = document.getElementById(`remarks-app-${app.id}`) as HTMLTextAreaElement;
                                  handleUpdateApplicationStatus(app.id, e.target.value, textarea ? textarea.value : (app.remarks || ""));
                                }}
                                className="bg-black/60 border border-cyan-500/40 text-cyan-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:outline-none"
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Approved">Approved</option>
                                <option value="Completed">Completed</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono text-gray-400 uppercase block">Admin Remarks / Notes for Applicant (Visible to user via Status Check):</label>
                            <div className="flex gap-2">
                              <textarea
                                rows={2}
                                defaultValue={app.remarks || ""}
                                id={`remarks-app-${app.id}`}
                                placeholder="Enter official remarks for this application ID..."
                                className="flex-1 bg-black/60 border border-white/15 rounded-xl p-2 text-xs text-white placeholder-gray-500 focus:border-cyan-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const textarea = document.getElementById(`remarks-app-${app.id}`) as HTMLTextAreaElement;
                                  handleUpdateApplicationStatus(app.id, app.status || "Pending", textarea ? textarea.value : "");
                                }}
                                className="px-4 py-2 bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-colors flex items-center space-x-1 cursor-pointer self-end"
                              >
                                <Save className="h-3 w-3" />
                                <span>Save Remarks</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        </>
                      )}

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- 1. SECTION: HEADER CONTROLS ---------------- */}
            {activeCmsSection === "header" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Branding & Nav System Assets</h3>
                  <p className="text-gray-500 mt-1">Live asset uploading and custom brand text definitions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Brand Text input mapping */}
                  {activeLangTab === "en" ? (
                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Brand Name (En) *</label>
                      <input 
                        type="text" 
                        value={stagingData.header?.brandTextEn || ""}
                        onChange={(e) => updateHeaderField("brandTextEn", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Brand Name (Np)</label>
                      <input 
                        type="text" 
                        value={stagingData.header?.brandTextNp || ""}
                        onChange={(e) => updateHeaderField("brandTextNp", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  )}

                  {/* Logo Image */}
                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Official Brand Logo (Image/Base64)</label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="text" 
                        value={stagingData.header?.logoUrl || ""}
                        onChange={(e) => updateHeaderField("logoUrl", e.target.value)}
                        placeholder="Direct asset URL"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                      <label className="cursor-pointer px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl font-bold uppercase tracking-wide hover:bg-white/10 text-cyan-400 text-center">
                        Upload Image
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => convertToBase64(e, (b) => updateHeaderField("logoUrl", b))}
                          className="hidden" 
                        />
                      </label>
                    </div>
                    {stagingData.header?.logoUrl && (
                      <div className="mt-2">
                        <img src={stagingData.header.logoUrl} alt="Logo Preview" className="h-10 w-10 rounded-full object-cover border border-white/20" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>

                  {/* Favicon Image */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Official Site Favicon (URL/Base64)</label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="text" 
                        value={stagingData.header?.faviconUrl || ""}
                        onChange={(e) => updateHeaderField("faviconUrl", e.target.value)}
                        placeholder="Direct asset URL"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                      <label className="cursor-pointer px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl font-bold uppercase tracking-wide hover:bg-white/10 text-cyan-400 text-center">
                        Upload Icon
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => convertToBase64(e, (b) => updateHeaderField("faviconUrl", b))}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 2. SECTION: BIOGRAPHIES ---------------- */}
            {activeCmsSection === "biography" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Homepage Texts, Headings & Biographies</h3>
                  <p className="text-gray-500 mt-1">Staging biography summary records, full expandables, main heading banners, and action buttons.</p>
                </div>

                {/* ADVANCED RICH-TEXT COMPONENT GENERATOR (VIBGYOR Custom Colors) */}
                <div className="p-4 bg-white/[0.01] border border-cyan-500/10 rounded-2xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <span className="font-mono font-bold tracking-wide uppercase text-cyan-400">Advanced Style Mixer Controls</span>
                    <div className="flex items-center space-x-1 bg-black/40 p-1.5 rounded-lg border border-white/10">
                      <button 
                        type="button" 
                        onClick={() => setRichTextConfig(prev => ({ ...prev, bold: !prev.bold }))}
                        className={`p-1 rounded hover:bg-white/5 ${richTextConfig.bold ? "text-cyan-400 bg-white/5" : "text-gray-500"}`}
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setRichTextConfig(prev => ({ ...prev, italic: !prev.italic }))}
                        className={`p-1 rounded hover:bg-white/5 ${richTextConfig.italic ? "text-cyan-400 bg-white/5" : "text-gray-500"}`}
                      >
                        <Italic className="h-4 w-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setRichTextConfig(prev => ({ ...prev, underline: !prev.underline }))}
                        className={`p-1 rounded hover:bg-white/5 ${richTextConfig.underline ? "text-cyan-400 bg-white/5" : "text-gray-500"}`}
                      >
                        <Underline className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* VIBGYOR Mixer */}
                  <div className="space-y-2">
                    <span className="font-mono font-bold text-gray-500 uppercase text-[10px]">Color Palette Mixer (VIBGYOR Array)</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {vibgyorColors.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setRichTextConfig(prev => ({ ...prev, color: color.hex }))}
                          className="px-2 py-1.5 rounded-lg border border-white/15 hover:border-white/30 text-[10px] font-bold font-mono transition-all uppercase flex items-center space-x-1 text-white"
                          style={{ borderLeft: `4px solid ${color.hex}` }}
                        >
                          <span>{color.name}</span>
                        </button>
                      ))}
                      <input 
                        type="color" 
                        value={richTextConfig.color}
                        onChange={(e) => setRichTextConfig(prev => ({ ...prev, color: e.target.value }))}
                        className="h-7 w-7 rounded cursor-pointer bg-transparent border-0" 
                      />
                      <input 
                        type="text" 
                        value={richTextConfig.color}
                        onChange={(e) => setRichTextConfig(prev => ({ ...prev, color: e.target.value }))}
                        className="bg-black/30 border border-white/10 rounded-md text-[10px] font-mono px-2 py-1 w-20 text-white" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Biography Summary */}
                  {activeLangTab === "en" ? (
                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Biography Executive Summary (En) *</label>
                      <textarea
                        rows={3}
                        value={stagingData.homepage?.biographySummaryEn || ""}
                        onChange={(e) => updateStagingField("homepage", "biographySummaryEn", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                        style={{
                          fontWeight: richTextConfig.bold ? "bold" : "normal",
                          fontStyle: richTextConfig.italic ? "italic" : "normal",
                          textDecoration: richTextConfig.underline ? "underline" : "none",
                          color: richTextConfig.color
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Biography Executive Summary (Np)</label>
                      <textarea
                        rows={3}
                        value={stagingData.homepage?.biographySummaryNp || ""}
                        onChange={(e) => updateStagingField("homepage", "biographySummaryNp", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                        style={{
                          fontWeight: richTextConfig.bold ? "bold" : "normal",
                          fontStyle: richTextConfig.italic ? "italic" : "normal",
                          textDecoration: richTextConfig.underline ? "underline" : "none",
                          color: richTextConfig.color
                        }}
                      />
                    </div>
                  )}

                  {/* Biography Full */}
                  {activeLangTab === "en" ? (
                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Biography Full Story (En) *</label>
                      <textarea
                        rows={8}
                        value={stagingData.homepage?.biographyFullEn || ""}
                        onChange={(e) => updateStagingField("homepage", "biographyFullEn", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white leading-relaxed font-sans"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Biography Full Story (Np)</label>
                      <textarea
                        rows={8}
                        value={stagingData.homepage?.biographyFullNp || ""}
                        onChange={(e) => updateStagingField("homepage", "biographyFullNp", e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white leading-relaxed font-sans"
                      />
                    </div>
                  )}

                  {/* Homepage Headings & Action Buttons Customizable Sub-section */}
                  <div className="border-t border-white/5 pt-4 mt-4">
                    <h4 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-wider mb-3">Homepage Personalization & Call-to-Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeLangTab === "en" ? (
                        <>
                          <div className="space-y-1.5">
                            <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Portal Pill Badge (En)</label>
                            <input
                              type="text"
                              value={stagingData.homepage?.portalPillEn || ""}
                              onChange={(e) => updateStagingField("homepage", "portalPillEn", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                              placeholder="Amit Joshi Official Portal"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Executive Summary Header (En)</label>
                            <input
                              type="text"
                              value={stagingData.homepage?.executiveSummaryTitleEn || ""}
                              onChange={(e) => updateStagingField("homepage", "executiveSummaryTitleEn", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                              placeholder="Core Executive Summary"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Biography Button Text (En)</label>
                            <input
                              type="text"
                              value={stagingData.homepage?.bioBtnEn || ""}
                              onChange={(e) => updateStagingField("homepage", "bioBtnEn", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                              placeholder="Read Full Biography"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Connect Button Text (En)</label>
                            <input
                              type="text"
                              value={stagingData.homepage?.connectBtnEn || ""}
                              onChange={(e) => updateStagingField("homepage", "connectBtnEn", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                              placeholder="Connect to Me Portal"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Biography Modal Header (En)</label>
                            <input
                              type="text"
                              value={stagingData.homepage?.biographyTitleEn || ""}
                              onChange={(e) => updateStagingField("homepage", "biographyTitleEn", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                              placeholder="Biography of Amit Joshi"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Biography Modal Tagline (En)</label>
                            <input
                              type="text"
                              value={stagingData.homepage?.biographyTaglineEn || ""}
                              onChange={(e) => updateStagingField("homepage", "biographyTaglineEn", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                              placeholder="Senior Full-Stack Architect & Digital Localizer"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Portal Pill Badge (Np)</label>
                            <input
                              type="text"
                              value={stagingData.homepage?.portalPillNp || ""}
                              onChange={(e) => updateStagingField("homepage", "portalPillNp", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                              placeholder="अमित जोशीको आधिकारिक पोर्टल"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Executive Summary Header (Np)</label>
                            <input
                              type="text"
                              value={stagingData.homepage?.executiveSummaryTitleNp || ""}
                              onChange={(e) => updateStagingField("homepage", "executiveSummaryTitleNp", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                              placeholder="मुख्य कार्यकारी संक्षेप"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Biography Button Text (Np)</label>
                            <input
                              type="text"
                              value={stagingData.homepage?.bioBtnNp || ""}
                              onChange={(e) => updateStagingField("homepage", "bioBtnNp", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                              placeholder="पूर्ण जीवनी पढ्नुहोस्"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Connect Button Text (Np)</label>
                            <input
                              type="text"
                              value={stagingData.homepage?.connectBtnNp || ""}
                              onChange={(e) => updateStagingField("homepage", "connectBtnNp", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                              placeholder="मेरो पोर्टलमा जोडिनुहोस्"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Biography Modal Header (Np)</label>
                            <input
                              type="text"
                              value={stagingData.homepage?.biographyTitleNp || ""}
                              onChange={(e) => updateStagingField("homepage", "biographyTitleNp", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                              placeholder="अमित जोशीको जीवनी"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Biography Modal Tagline (Np)</label>
                            <input
                              type="text"
                              value={stagingData.homepage?.biographyTaglineNp || ""}
                              onChange={(e) => updateStagingField("homepage", "biographyTaglineNp", e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                              placeholder="वरिष्ठ फुल-स्ट्याक आर्किटेक्ट र डिजिटल लोकलाइजर"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 3. SECTION: SOCIAL HUB CARDS ---------------- */}
            {activeCmsSection === "socials" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Social Media Hub Node Setup</h3>
                  <p className="text-gray-500 mt-1">Manage infinite list arrays of external profile configurations.</p>
                </div>

                {/* Node Builder Form */}
                <div className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Platform Type</label>
                    <select
                      value={socialForm.platform}
                      onChange={(e) => setSocialForm(prev => ({ ...prev, platform: e.target.value, icon: e.target.value === "TikTok" ? "Music" : e.target.value === "WhatsApp" ? "MessageSquare" : e.target.value === "Email" ? "Mail" : e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                    >
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Redirect URL Path *</label>
                    <input 
                      type="text" 
                      value={socialForm.url}
                      onChange={(e) => setSocialForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="e.g., https://facebook.com/username"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                    />
                  </div>

                  {activeLangTab === "en" ? (
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Title / Description Brief (En) *</label>
                      <input 
                        type="text" 
                        value={socialForm.titleEn}
                        onChange={(e) => setSocialForm(prev => ({ ...prev, titleEn: e.target.value }))}
                        placeholder="e.g., Follow Amit on Facebook for technical postings"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Title / Description Brief (Np)</label>
                      <input 
                        type="text" 
                        value={socialForm.titleNp}
                        onChange={(e) => setSocialForm(prev => ({ ...prev, titleNp: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2 flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveSocial}
                      className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold uppercase hover:bg-cyan-400"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{editingItemId ? "Save Updates" : "Add Node"}</span>
                    </button>
                  </div>
                </div>

                {/* Staged Items Listing */}
                <div className="space-y-3">
                  <h4 className="font-mono font-bold text-gray-500 uppercase text-[10px]">Staging Items Array</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(stagingData.socials || []).map((soc) => (
                      <div key={soc.id} className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 uppercase font-mono font-bold">{soc.platform}</span>
                          <h5 className="text-[11px] font-bold text-white mt-1.5 line-clamp-1">{activeLangTab === "en" ? soc.titleEn : soc.titleNp}</h5>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { setEditingItemId(soc.id); setSocialForm({ ...soc }); }} className="p-1.5 hover:text-cyan-400"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteSocial(soc.id)} className="p-1.5 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 4. SECTION: STRATEGIC INITIATIVES ---------------- */}
            {activeCmsSection === "initiatives" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Key Strategic Initiatives</h3>
                  <p className="text-gray-500 mt-1">Staging causes, split panels, and native Facebook iframe insertions.</p>
                </div>

                <div className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl space-y-4">
                  {activeLangTab === "en" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-gray-400 uppercase">Initiative Title (En) *</label>
                        <input type="text" value={initiativeForm.titleEn} onChange={(e) => setInitiativeForm(prev => ({ ...prev, titleEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-gray-400 uppercase">Description text (En) *</label>
                        <textarea rows={3} value={initiativeForm.textEn} onChange={(e) => setInitiativeForm(prev => ({ ...prev, textEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-gray-400 uppercase">Full Expandable Impact story (En)</label>
                        <textarea rows={5} value={initiativeForm.readMoreEn} onChange={(e) => setInitiativeForm(prev => ({ ...prev, readMoreEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-purple-400 uppercase">Initiative Title (Np)</label>
                        <input type="text" value={initiativeForm.titleNp} onChange={(e) => setInitiativeForm(prev => ({ ...prev, titleNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-purple-400 uppercase">Description text (Np)</label>
                        <textarea rows={3} value={initiativeForm.textNp} onChange={(e) => setInitiativeForm(prev => ({ ...prev, textNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-purple-400 uppercase">Full Expandable Impact story (Np)</label>
                        <textarea rows={5} value={initiativeForm.readMoreNp} onChange={(e) => setInitiativeForm(prev => ({ ...prev, readMoreNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-gray-400 uppercase">Facebook Iframe Embed Element Payload</label>
                    <textarea rows={3} value={initiativeForm.fbIframe} onChange={(e) => setInitiativeForm(prev => ({ ...prev, fbIframe: e.target.value }))} placeholder="Paste <iframe> from Facebook developer plugin here" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono" />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="button" onClick={handleSaveInitiative} className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold uppercase hover:bg-cyan-400">
                      <Plus className="h-4 w-4" />
                      <span>Save Strategic Initiative</span>
                    </button>
                  </div>
                </div>

                {/* Initiatives listings */}
                <div className="space-y-3">
                  <h4 className="font-mono font-bold text-gray-500 uppercase text-[10px]">Current initiatives</h4>
                  <div className="space-y-2">
                    {(stagingData.initiatives || []).map((item) => (
                      <div key={item.id} className="p-4 bg-black/40 border border-white/10 rounded-xl flex justify-between items-center">
                        <div>
                          <h5 className="font-bold text-sm text-white">{activeLangTab === "en" ? item.titleEn : item.titleNp}</h5>
                          <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{activeLangTab === "en" ? item.textEn : item.textNp}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { setEditingItemId(item.id); setInitiativeForm({ ...item }); }} className="p-2 text-gray-400 hover:text-cyan-400"><Edit3 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteInitiative(item.id)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 5. SECTION: UTILITY TOOL DECK ---------------- */}
            {activeCmsSection === "tools" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Utility Tool & Script Deck</h3>
                  <p className="text-gray-500 mt-1">Manage digital toolkit arrays. Built to support truncation past 15 items automatically.</p>
                </div>

                <div className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeLangTab === "en" ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase">Tool Name (En) *</label>
                        <input type="text" value={toolForm.nameEn} onChange={(e) => setToolForm(prev => ({ ...prev, nameEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase">Category Title (En) *</label>
                        <input type="text" value={toolForm.categoryEn} onChange={(e) => setToolForm(prev => ({ ...prev, categoryEn: e.target.value }))} placeholder="e.g., Date Utilities" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-gray-400 uppercase">Short description (En) *</label>
                        <input type="text" value={toolForm.descriptionEn} onChange={(e) => setToolForm(prev => ({ ...prev, descriptionEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-purple-400 uppercase">Tool Name (Np)</label>
                        <input type="text" value={toolForm.nameNp} onChange={(e) => setToolForm(prev => ({ ...prev, nameNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-purple-400 uppercase">Category Title (Np)</label>
                        <input type="text" value={toolForm.categoryNp} onChange={(e) => setToolForm(prev => ({ ...prev, categoryNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-purple-400 uppercase">Short description (Np)</label>
                        <input type="text" value={toolForm.descriptionNp} onChange={(e) => setToolForm(prev => ({ ...prev, descriptionNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-gray-400 uppercase">Lucide Icon identifier string</label>
                    <select value={toolForm.icon} onChange={(e) => setToolForm(prev => ({ ...prev, icon: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white">
                      <option value="Calendar">Calendar</option>
                      <option value="Type">Type</option>
                      <option value="Coins">Coins</option>
                      <option value="MapPin">MapPin</option>
                      <option value="Keyboard">Keyboard</option>
                      <option value="Calculator">Calculator</option>
                      <option value="Mic">Mic</option>
                      <option value="Volume2">Volume2</option>
                      <option value="Image">Image</option>
                      <option value="Lock">Lock</option>
                      <option value="QrCode">QrCode</option>
                      <option value="Code">Code</option>
                      <option value="FileText">FileText</option>
                      <option value="Cpu">Cpu</option>
                      <option value="Timer">Timer</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-gray-400 uppercase">Official tool Redirect URL *</label>
                    <input type="text" value={toolForm.url} onChange={(e) => setToolForm(prev => ({ ...prev, url: e.target.value }))} placeholder="e.g., https://amitjoshi.info.np/tools/calendar" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button type="button" onClick={handleSaveTool} className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold uppercase hover:bg-cyan-400">
                      <Plus className="h-4 w-4" />
                      <span>Save Tool</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-mono font-bold text-gray-500 uppercase text-[10px]">Staged tool cards ({stagingData.tools?.length || 0})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(stagingData.tools || []).map((t) => (
                      <div key={t.id} className="p-3 bg-black/40 border border-white/10 rounded-xl flex justify-between items-center">
                        <div>
                          <span className="text-[9px] font-mono font-bold text-purple-400 block">{activeLangTab === "en" ? t.categoryEn : t.categoryNp}</span>
                          <h5 className="font-bold text-white mt-1">{activeLangTab === "en" ? t.nameEn : t.nameNp}</h5>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { setEditingItemId(t.id); setToolForm({ ...t }); }} className="p-1.5 text-gray-400 hover:text-cyan-400"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteTool(t.id)} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 6. SECTION: ACADEMIC MILESTONES ---------------- */}
            {activeCmsSection === "education" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Academic & Institutional History</h3>
                  <p className="text-gray-500 mt-1">Manage chronological milestones and deep descriptive pop-up portfolios.</p>
                </div>

                <div className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl space-y-4">
                  {activeLangTab === "en" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase">Institution (En) *</label>
                        <input type="text" value={educationForm.institutionEn} onChange={(e) => setEducationForm(prev => ({ ...prev, institutionEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase">Degree (En) *</label>
                        <input type="text" value={educationForm.degreeEn} onChange={(e) => setEducationForm(prev => ({ ...prev, degreeEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase">Attendance Years (En) *</label>
                        <input type="text" value={educationForm.yearsEn} onChange={(e) => setEducationForm(prev => ({ ...prev, yearsEn: e.target.value }))} placeholder="e.g., 2014 - 2018" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-gray-400 uppercase">Summary brief (En) *</label>
                        <input type="text" value={educationForm.descriptionEn} onChange={(e) => setEducationForm(prev => ({ ...prev, descriptionEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-gray-400 uppercase">Full details popup payload (En)</label>
                        <textarea rows={4} value={educationForm.detailsEn} onChange={(e) => setEducationForm(prev => ({ ...prev, detailsEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white leading-relaxed" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-purple-400 uppercase">Institution (Np)</label>
                        <input type="text" value={educationForm.institutionNp} onChange={(e) => setEducationForm(prev => ({ ...prev, institutionNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-purple-400 uppercase">Degree (Np)</label>
                        <input type="text" value={educationForm.degreeNp} onChange={(e) => setEducationForm(prev => ({ ...prev, degreeNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-purple-400 uppercase">Attendance Years (Np)</label>
                        <input type="text" value={educationForm.yearsNp} onChange={(e) => setEducationForm(prev => ({ ...prev, yearsNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-purple-400 uppercase">Summary brief (Np)</label>
                        <input type="text" value={educationForm.descriptionNp} onChange={(e) => setEducationForm(prev => ({ ...prev, descriptionNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-purple-400 uppercase">Full details popup payload (Np)</label>
                        <textarea rows={4} value={educationForm.detailsNp} onChange={(e) => setEducationForm(prev => ({ ...prev, detailsNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white leading-relaxed" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-gray-400 uppercase">Student portal Navigation URL</label>
                    <input type="text" value={educationForm.portalUrl} onChange={(e) => setEducationForm(prev => ({ ...prev, portalUrl: e.target.value }))} placeholder="https://portal.university.edu" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="button" onClick={handleSaveEducation} className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold uppercase hover:bg-cyan-400">
                      <Plus className="h-4 w-4" />
                      <span>Save Education Card</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-mono font-bold text-gray-500 uppercase text-[10px]">Academic Staging items</h4>
                  <div className="space-y-2">
                    {(stagingData.education || []).map((e) => (
                      <div key={e.id} className="p-3 bg-black/40 border border-white/10 rounded-xl flex justify-between items-center">
                        <div>
                          <span className="text-[9px] font-mono font-bold text-cyan-400 block">{activeLangTab === "en" ? e.yearsEn : e.yearsNp}</span>
                          <h5 className="font-bold text-white mt-1">{activeLangTab === "en" ? e.degreeEn : e.degreeNp}</h5>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { setEditingItemId(e.id); setEducationForm({ ...e }); }} className="p-2 text-gray-400 hover:text-cyan-400"><Edit3 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteEducation(e.id)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 7. SECTION: PREMIUM SERVICES ---------------- */}
            {activeCmsSection === "services" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Professional Services Array</h3>
                  <p className="text-gray-500 mt-1">Configure premium pricing cards complete with WhatsApp pre-filled automated responses.</p>
                </div>

                {totalUnreadServices > 0 && (
                  <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-500/20 text-red-400 rounded-xl">
                        <AlertCircle className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold font-mono text-white">
                          You have <span className="text-red-400 font-extrabold">{totalUnreadServices} Unread Submissions</span> ({unreadAppsCount} applications, {unreadSugsCount} suggestions)
                        </h4>
                        <p className="text-xs text-gray-300">
                          New service forms or feedback suggestions have been filled by users.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setActiveCmsSection("applications" as any)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
                      >
                        Applications ({unreadAppsCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCmsSection("suggestions" as any)}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 font-mono text-xs font-bold uppercase transition-colors cursor-pointer"
                      >
                        Suggestions ({unreadSugsCount})
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl space-y-4">
                  {activeLangTab === "en" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-gray-400 uppercase">Service Title (En) *</label>
                        <input type="text" value={serviceForm.titleEn} onChange={(e) => setServiceForm(prev => ({ ...prev, titleEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-gray-400 uppercase">Description Brief (En) *</label>
                        <textarea rows={3} value={serviceForm.descriptionEn} onChange={(e) => setServiceForm(prev => ({ ...prev, descriptionEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase">Service Price Tag (En) *</label>
                        <input type="text" value={serviceForm.priceEn} onChange={(e) => setServiceForm(prev => ({ ...prev, priceEn: e.target.value }))} placeholder="e.g., NPR 150,000 onwards" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-gray-400 uppercase">WhatsApp Pre-filled message (En) *</label>
                        <textarea rows={2} value={serviceForm.whatsappMessageEn} onChange={(e) => setServiceForm(prev => ({ ...prev, whatsappMessageEn: e.target.value }))} placeholder="Auto-fills client WhatsApp window when clicked" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-purple-400 uppercase">Service Title (Np)</label>
                        <input type="text" value={serviceForm.titleNp} onChange={(e) => setServiceForm(prev => ({ ...prev, titleNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-purple-400 uppercase">Description Brief (Np)</label>
                        <textarea rows={3} value={serviceForm.descriptionNp} onChange={(e) => setServiceForm(prev => ({ ...prev, descriptionNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-purple-400 uppercase">Service Price Tag (Np)</label>
                        <input type="text" value={serviceForm.priceNp} onChange={(e) => setServiceForm(prev => ({ ...prev, priceNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-purple-400 uppercase">WhatsApp Pre-filled message (Np)</label>
                        <textarea rows={2} value={serviceForm.whatsappMessageNp} onChange={(e) => setServiceForm(prev => ({ ...prev, whatsappMessageNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-gray-400 uppercase">Lucide Icon name</label>
                      <select value={serviceForm.icon} onChange={(e) => setServiceForm(prev => ({ ...prev, icon: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white">
                        <option value="Layout">Layout</option>
                        <option value="ShieldAlert">ShieldAlert</option>
                        <option value="Gauge">Gauge</option>
                        <option value="Sliders">Sliders</option>
                        <option value="Cpu">Cpu</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-gray-400 uppercase">Official Info Link</label>
                      <input type="text" value={serviceForm.officialLink} onChange={(e) => setServiceForm(prev => ({ ...prev, officialLink: e.target.value }))} placeholder="https://amitjoshi.info.np/services/enterprise" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-yellow-400 uppercase">Gov Server Availability Status</label>
                      <select value={(serviceForm as any).serverStatus || "active"} onChange={(e) => setServiceForm(prev => ({ ...prev, serverStatus: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-bold">
                        <option value="active">🟢 Active / Online (Normal)</option>
                        <option value="down">🔴 Red / Offline (Gov Down)</option>
                      </select>
                    </div>
                  </div>

                  {/* Apply Now Dynamic Form Configurations */}
                  <div className="border-t border-white/5 pt-4 space-y-4">
                    <h4 className="font-mono font-bold text-cyan-400 uppercase text-[10px] tracking-wider">Apply Now Custom Form CMS Controls</h4>
                    
                    {/* Special Notice and Custom Questions (Split by Lang tab) */}
                    {activeLangTab === "en" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="font-mono font-bold text-gray-400 uppercase text-[11px]">Special Notice / Instructions (En)</label>
                          <textarea rows={2} value={serviceForm.specialNoticeEn || ""} onChange={(e) => setServiceForm(prev => ({ ...prev, specialNoticeEn: e.target.value }))} placeholder="Notice shown at top of the application modal" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="font-mono font-bold text-gray-400 uppercase text-[11px]">Custom Dynamic Questions (En, comma-separated)</label>
                          <input type="text" value={serviceForm.customQuestionsEn || ""} onChange={(e) => setServiceForm(prev => ({ ...prev, customQuestionsEn: e.target.value }))} placeholder="e.g., Previous Tech Stack?, Expected Completion?" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                        </div>
                        {/* Legacy Inputs for compatibility */}
                        <div className="space-y-1.5">
                          <label className="font-mono font-bold text-gray-500 uppercase text-[10px]">Legacy Photo Reqs (En, comma-separated)</label>
                          <input type="text" value={serviceForm.photoReqsEn || ""} onChange={(e) => setServiceForm(prev => ({ ...prev, photoReqsEn: e.target.value }))} placeholder="Legacy style comma-separated list" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-1.5 text-[11px] text-gray-400" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono font-bold text-gray-500 uppercase text-[10px]">Legacy PDF Reqs (En, comma-separated)</label>
                          <input type="text" value={serviceForm.docReqsEn || ""} onChange={(e) => setServiceForm(prev => ({ ...prev, docReqsEn: e.target.value }))} placeholder="Legacy style comma-separated list" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-1.5 text-[11px] text-gray-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="font-mono font-bold text-purple-400 uppercase text-[11px]">Special Notice / Instructions (Np)</label>
                          <textarea rows={2} value={serviceForm.specialNoticeNp || ""} onChange={(e) => setServiceForm(prev => ({ ...prev, specialNoticeNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="font-mono font-bold text-purple-400 uppercase text-[11px]">Custom Dynamic Questions (Np, comma-separated)</label>
                          <input type="text" value={serviceForm.customQuestionsNp || ""} onChange={(e) => setServiceForm(prev => ({ ...prev, customQuestionsNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                        </div>
                        {/* Legacy Inputs for compatibility */}
                        <div className="space-y-1.5">
                          <label className="font-mono font-bold text-gray-500 uppercase text-[10px]">Legacy Photo Reqs (Np, comma-separated)</label>
                          <input type="text" value={serviceForm.photoReqsNp || ""} onChange={(e) => setServiceForm(prev => ({ ...prev, photoReqsNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-1.5 text-[11px] text-gray-400" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono font-bold text-gray-500 uppercase text-[10px]">Legacy PDF Reqs (Np, comma-separated)</label>
                          <input type="text" value={serviceForm.docReqsNp || ""} onChange={(e) => setServiceForm(prev => ({ ...prev, docReqsNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-1.5 text-[11px] text-gray-400" />
                        </div>
                      </div>
                    )}

                    {/* Unified Dynamic PDF Form Controls */}
                    <div className="bg-cyan-950/20 border border-cyan-500/20 p-4 rounded-xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="pdfEnabled" checked={serviceForm.pdfEnabled || false} onChange={(e) => setServiceForm(prev => ({ ...prev, pdfEnabled: e.target.checked }))} className="text-cyan-500 rounded bg-black border-white/10 focus:ring-0" />
                          <label htmlFor="pdfEnabled" className="text-xs font-bold font-mono uppercase text-cyan-400 cursor-pointer">Enable PDF Upload Option (Max 100KB)</label>
                        </div>
                        {serviceForm.pdfEnabled && (
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="pdfRequired" checked={serviceForm.pdfRequired || false} onChange={(e) => setServiceForm(prev => ({ ...prev, pdfRequired: e.target.checked }))} className="text-cyan-500 rounded bg-black border-white/10 focus:ring-0" />
                            <label htmlFor="pdfRequired" className="text-xs font-bold font-mono uppercase text-red-400 cursor-pointer">Compulsory / Required</label>
                          </div>
                        )}
                      </div>
                      
                      {serviceForm.pdfEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-gray-400 uppercase">PDF Custom Label (English)</label>
                            <input type="text" value={serviceForm.pdfLabelEn || ""} onChange={(e) => setServiceForm(prev => ({ ...prev, pdfLabelEn: e.target.value }))} placeholder="e.g. Project Proposal, CV" className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-gray-400 uppercase">PDF Custom Label (Nepali)</label>
                            <input type="text" value={serviceForm.pdfLabelNp || ""} onChange={(e) => setServiceForm(prev => ({ ...prev, pdfLabelNp: e.target.value }))} placeholder="e.g. परियोजना प्रस्ताव" className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Unified Dynamic 4 Photo Slots Controls */}
                    <div className="bg-purple-950/20 border border-purple-500/20 p-4 rounded-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                        <span className="text-xs font-extrabold font-mono uppercase text-purple-400">Photo Slots Configuration (Maximum 4 Photos, JPG accepted)</span>
                      </div>
                      
                      <div className="space-y-3 divide-y divide-white/5">
                        {[1, 2, 3, 4].map((slotNum) => {
                          const isEnabledKey = `photo${slotNum}Enabled` as any;
                          const isRequiredKey = `photo${slotNum}Required` as any;
                          const labelEnKey = `photo${slotNum}LabelEn` as any;
                          const labelNpKey = `photo${slotNum}LabelNp` as any;

                          const isEnabled = (serviceForm as any)[isEnabledKey] || false;
                          const isRequired = (serviceForm as any)[isRequiredKey] || false;
                          const labelEn = (serviceForm as any)[labelEnKey] || "";
                          const labelNp = (serviceForm as any)[labelNpKey] || "";

                          return (
                            <div key={slotNum} className="pt-3 first:pt-0 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center space-x-2">
                                  <input 
                                    type="checkbox" 
                                    id={`photo${slotNum}Enabled`} 
                                    checked={isEnabled} 
                                    onChange={(e) => setServiceForm(prev => ({ ...prev, [isEnabledKey]: e.target.checked }))} 
                                    className="text-purple-500 rounded bg-black border-white/10 focus:ring-0" 
                                  />
                                  <label htmlFor={`photo${slotNum}Enabled`} className="text-xs font-bold font-mono uppercase text-purple-300 cursor-pointer">Enable Photo Slot {slotNum}</label>
                                </div>
                                {isEnabled && (
                                  <div className="flex items-center space-x-2">
                                    <input 
                                      type="checkbox" 
                                      id={`photo${slotNum}Required`} 
                                      checked={isRequired} 
                                      onChange={(e) => setServiceForm(prev => ({ ...prev, [isRequiredKey]: e.target.checked }))} 
                                      className="text-purple-500 rounded bg-black border-white/10 focus:ring-0" 
                                    />
                                    <label htmlFor={`photo${slotNum}Required`} className="text-xs font-bold font-mono uppercase text-red-400 cursor-pointer">Compulsory / Required</label>
                                  </div>
                                )}
                              </div>
                              
                              {isEnabled && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-gray-400 uppercase">Photo {slotNum} Custom Name (English) *</label>
                                    <input 
                                      type="text" 
                                      required 
                                      value={labelEn} 
                                      onChange={(e) => setServiceForm(prev => ({ ...prev, [labelEnKey]: e.target.value }))} 
                                      placeholder="e.g. Citizenship Front, Portrait Photo" 
                                      className="w-full bg-[#0b0f19] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-gray-400 uppercase">Photo {slotNum} Custom Name (Nepali) *</label>
                                    <input 
                                      type="text" 
                                      required 
                                      value={labelNp} 
                                      onChange={(e) => setServiceForm(prev => ({ ...prev, [labelNpKey]: e.target.value }))} 
                                      placeholder="e.g. नागरिकताको अगाडि" 
                                      className="w-full bg-[#0b0f19] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white" 
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="button" onClick={handleSaveService} className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold uppercase hover:bg-cyan-400">
                      <Plus className="h-4 w-4" />
                      <span>Save Service</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-mono font-bold text-gray-500 uppercase text-[10px]">Staged services</h4>
                  <div className="space-y-2">
                    {(stagingData.services || []).map((s) => (
                      <div key={s.id} className="p-3 bg-black/40 border border-white/10 rounded-xl flex justify-between items-center">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400 font-mono font-bold uppercase">{activeLangTab === "en" ? s.priceEn : s.priceNp}</span>
                          <h5 className="font-bold text-white mt-1.5">{activeLangTab === "en" ? s.titleEn : s.titleNp}</h5>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { 
                            setEditingItemId(s.id); 
                            setServiceForm({ 
                              titleEn: s.titleEn || "",
                              titleNp: s.titleNp || "",
                              descriptionEn: s.descriptionEn || "",
                              descriptionNp: s.descriptionNp || "",
                              priceEn: s.priceEn || "",
                              priceNp: s.priceNp || "",
                              whatsappMessageEn: s.whatsappMessageEn || "",
                              whatsappMessageNp: s.whatsappMessageNp || "",
                              officialLink: s.officialLink || "",
                              icon: s.icon || "Layout",
                              photoReqsEn: s.photoReqsEn || "",
                              photoReqsNp: s.photoReqsNp || "",
                              docReqsEn: s.docReqsEn || "",
                              docReqsNp: s.docReqsNp || "",
                              specialNoticeEn: s.specialNoticeEn || "",
                              specialNoticeNp: s.specialNoticeNp || "",
                              customQuestionsEn: s.customQuestionsEn || "",
                              customQuestionsNp: s.customQuestionsNp || "",
                              pdfEnabled: s.pdfEnabled ?? false,
                              pdfRequired: s.pdfRequired ?? false,
                              pdfLabelEn: s.pdfLabelEn || "",
                              pdfLabelNp: s.pdfLabelNp || "",
                              photo1Enabled: s.photo1Enabled ?? false,
                              photo1Required: s.photo1Required ?? false,
                              photo1LabelEn: s.photo1LabelEn || "",
                              photo1LabelNp: s.photo1LabelNp || "",
                              photo2Enabled: s.photo2Enabled ?? false,
                              photo2Required: s.photo2Required ?? false,
                              photo2LabelEn: s.photo2LabelEn || "",
                              photo2LabelNp: s.photo2LabelNp || "",
                              photo3Enabled: s.photo3Enabled ?? false,
                              photo3Required: s.photo3Required ?? false,
                              photo3LabelEn: s.photo3LabelEn || "",
                              photo3LabelNp: s.photo3LabelNp || "",
                              photo4Enabled: s.photo4Enabled ?? false,
                              photo4Required: s.photo4Required ?? false,
                              photo4LabelEn: s.photo4LabelEn || "",
                              photo4LabelNp: s.photo4LabelNp || "",
                              serverStatus: s.serverStatus || "active"
                            }); 
                          }} className="p-2 text-gray-400 hover:text-cyan-400"><Edit3 className="h-4 w-4" /></button>
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = (s.serverStatus === "down" || s.serverStatus === "offline") ? "active" : "down";
                              const updated = (stagingData.services || []).map(item => item.id === s.id ? { ...item, serverStatus: newStatus } : item);
                              setStagingData(prev => ({ ...prev, services: updated }));
                              showToast("success", `Server status changed to ${newStatus === "down" ? "OFFLINE (RED)" : "ONLINE (GREEN)"}`);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${s.serverStatus === "down" || s.serverStatus === "offline" ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"}`}
                            title="Click to toggle Gov Server Availability Status"
                          >
                            {s.serverStatus === "down" || s.serverStatus === "offline" ? "🔴 Gov Down" : "🟢 Gov Active"}
                          </button>
                          <button onClick={() => handleDeleteService(s.id)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 8. SECTION: ANNOUNCEMENT POPUP ---------------- */}
            {activeCmsSection === "popup" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Administrative Global Announcement Popup</h3>
                  <p className="text-gray-500 mt-1">Configure active status, banners, line-break separators, and visual previews.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Controls Column */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/5 border border-white/15 p-4 rounded-xl">
                      <span className="font-mono font-bold text-gray-300 uppercase">Popup State Status</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={stagingData.popup?.active || false}
                          onChange={(e) => updateStagingField("popup", "active", e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-gray-400 uppercase">Banner Image Link (URL/Base64)</label>
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          value={stagingData.popup?.imageUrl || ""}
                          onChange={(e) => updateStagingField("popup", "imageUrl", e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                        />
                        <label className="cursor-pointer px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-bold uppercase text-cyan-400 text-center">
                          Upload
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => convertToBase64(e, (b) => updateStagingField("popup", "imageUrl", b))}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>

                    {activeLangTab === "en" ? (
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase">Announcement Description Text (En) *</label>
                        <textarea rows={5} value={stagingData.popup?.textEn || ""} onChange={(e) => updateStagingField("popup", "textEn", e.target.value)} placeholder="Exceeding 8 lines automatically generates a 'Show More' separator node." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-purple-400 uppercase">Announcement Description Text (Np)</label>
                        <textarea rows={5} value={stagingData.popup?.textNp || ""} onChange={(e) => updateStagingField("popup", "textNp", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeLangTab === "en" ? (
                        <div className="space-y-1.5">
                          <label className="font-mono font-bold text-gray-400 uppercase">Button Label (En)</label>
                          <input type="text" value={stagingData.popup?.buttonEn || ""} onChange={(e) => updateStagingField("popup", "buttonEn", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="font-mono font-bold text-purple-400 uppercase">Button Label (Np)</label>
                          <input type="text" value={stagingData.popup?.buttonNp || ""} onChange={(e) => updateStagingField("popup", "buttonNp", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase">Button Redirect URL</label>
                        <input type="text" value={stagingData.popup?.buttonUrl || ""} onChange={(e) => updateStagingField("popup", "buttonUrl", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Desktop Real-Time Preview Module */}
                  <div className="bg-black/50 border border-cyan-500/20 rounded-2xl p-4 space-y-4">
                    <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-cyan-400 flex items-center space-x-1.5">
                      <PreviewIcon className="h-3.5 w-3.5" />
                      <span>Real-time Live Desktop Preview</span>
                    </span>

                    <div className="border border-white/10 rounded-xl bg-gray-950 p-4 relative overflow-hidden shadow-inner space-y-3 text-white">
                      {stagingData.popup?.imageUrl && (
                        <div className="h-28 w-full rounded-lg overflow-hidden bg-white/5 relative border border-white/5">
                          <img src={stagingData.popup.imageUrl} alt="Banner Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <span className="px-2 py-0.5 rounded text-[8px] bg-cyan-500 text-black font-bold uppercase tracking-wider">Announcement</span>
                        <p className="text-[11px] leading-relaxed text-gray-300 max-h-24 overflow-y-auto whitespace-pre-line">
                          {activeLangTab === "en" ? stagingData.popup?.textEn : stagingData.popup?.textNp}
                        </p>
                        {getAnnouncementLineBreaksCount() > 8 && (
                          <div className="text-[9px] text-cyan-400 font-mono text-center border-t border-dashed border-white/10 pt-1">* Show More separator generated *</div>
                        )}
                        {stagingData.popup?.buttonUrl && (
                          <div className="text-center bg-cyan-500 text-black font-bold uppercase tracking-wide text-[9px] py-1.5 rounded-lg font-mono">
                            {activeLangTab === "en" ? stagingData.popup?.buttonEn : stagingData.popup?.buttonNp}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- SECTION: CINEMATIC HOME SLIDES ---------------- */}
            {activeCmsSection === "slides" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Cinematic Home Slider Setup</h3>
                  <p className="text-gray-500 mt-1">Manage background slides, imagery, and overlay text sliding in the homepage.</p>
                </div>

                {/* Slide Builder Form */}
                <div className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Slide Background Image (URL/Base64) *</label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="text" 
                        value={slideForm.imageUrl}
                        onChange={(e) => setSlideForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="Direct image URL or upload file"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                      <label className="cursor-pointer px-4 py-2 bg-white/5 border border-white/10 rounded-xl font-bold uppercase tracking-wide hover:bg-white/10 text-cyan-400 text-center">
                        Upload Image
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => convertToBase64(e, (b) => setSlideForm(prev => ({ ...prev, imageUrl: b })))}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>

                  {activeLangTab === "en" ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Slide Main Title (En) *</label>
                        <input 
                          type="text" 
                          value={slideForm.titleEn}
                          onChange={(e) => setSlideForm(prev => ({ ...prev, titleEn: e.target.value }))}
                          placeholder="e.g., Architect of Modern Web Experiences"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Slide Subtitle (En)</label>
                        <textarea 
                          rows={2}
                          value={slideForm.subtitleEn}
                          onChange={(e) => setSlideForm(prev => ({ ...prev, subtitleEn: e.target.value }))}
                          placeholder="e.g., Engineering robust, scalable applications with clean, interactive designs."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Slide Main Title (Np)</label>
                        <input 
                          type="text" 
                          value={slideForm.titleNp}
                          onChange={(e) => setSlideForm(prev => ({ ...prev, titleNp: e.target.value }))}
                          placeholder="e.g., आधुनिक वेब अनुभवका निर्माता"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Slide Subtitle (Np)</label>
                        <textarea 
                          rows={2}
                          value={slideForm.subtitleNp}
                          onChange={(e) => setSlideForm(prev => ({ ...prev, subtitleNp: e.target.value }))}
                          placeholder="e.g., स्वच्छ, अन्तरक्रियात्मक डिजाइनहरूको साथ बलियो, मापनयोग्य अनुप्रयोगहरू निर्माण गर्दै।"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-2">
                    <button type="button" onClick={handleSaveSlide} className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold uppercase hover:bg-cyan-400">
                      <Plus className="h-4 w-4" />
                      <span>{editingItemId ? "Update Slide" : "Add Slide"}</span>
                    </button>
                  </div>
                </div>

                {/* Slides list */}
                <div className="space-y-3">
                  <h4 className="font-mono font-bold text-gray-500 uppercase text-[10px]">Staged Home Slides</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(stagingData.homepage?.slides || []).map((slide, idx) => (
                      <div key={slide.id || idx} className="p-3 bg-black/40 border border-white/10 rounded-xl flex flex-col justify-between space-y-3">
                        <div className="flex items-center space-x-3">
                          {slide.imageUrl && (
                            <img src={slide.imageUrl} alt="thumbnail" className="h-12 w-20 object-cover rounded border border-white/10" referrerPolicy="no-referrer" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-white truncate">{activeLangTab === "en" ? slide.titleEn : slide.titleNp}</h5>
                            <p className="text-gray-400 text-[10px] truncate">{activeLangTab === "en" ? slide.subtitleEn : slide.subtitleNp}</p>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 border-t border-white/5 pt-2">
                          <button onClick={() => { setEditingItemId(slide.id); setSlideForm({ ...slide }); }} className="p-1.5 text-gray-400 hover:text-cyan-400 inline-flex items-center space-x-1"><Edit3 className="h-3.5 w-3.5" /><span className="text-[10px] uppercase font-mono">Edit</span></button>
                          <button onClick={() => handleDeleteSlide(slide.id)} className="p-1.5 text-gray-400 hover:text-red-400 inline-flex items-center space-x-1"><Trash2 className="h-3.5 w-3.5" /><span className="text-[10px] uppercase font-mono">Delete</span></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- SECTION: FOOTER, PRIVACY & LINKS ---------------- */}
            {activeCmsSection === "footer" && (
              <div className="space-y-8">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Footer, Legal Privacy Policy & Resource Downloads</h3>
                  <p className="text-gray-500 mt-1">Manage footer layout options, legal clauses (Privacy Policy, Terms), downloadable PDF/image sheets, and customizable link tabs.</p>
                </div>

                {/* 1. Privacy Policy & Terms of Agreement text fields */}
                <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-4">
                  <h4 className="font-mono font-bold text-cyan-400 uppercase text-[10px] tracking-widest">1. Legal Content Clauses (Privacy & Terms)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeLangTab === "en" ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="font-mono font-bold text-gray-400 uppercase">Privacy Policy (English)</label>
                          <textarea 
                            rows={4}
                            value={stagingData.privacyPolicyEn || ""}
                            onChange={(e) => setStagingData(prev => ({ ...prev, privacyPolicyEn: e.target.value }))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono font-bold text-gray-400 uppercase">Terms & Conditions (English)</label>
                          <textarea 
                            rows={4}
                            value={stagingData.termsConditionsEn || ""}
                            onChange={(e) => setStagingData(prev => ({ ...prev, termsConditionsEn: e.target.value }))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <label className="font-mono font-bold text-purple-400 uppercase">Privacy Policy (Nepali)</label>
                          <textarea 
                            rows={4}
                            value={stagingData.privacyPolicyNp || ""}
                            onChange={(e) => setStagingData(prev => ({ ...prev, privacyPolicyNp: e.target.value }))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-sans"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono font-bold text-purple-400 uppercase">Terms & Conditions (Nepali)</label>
                          <textarea 
                            rows={4}
                            value={stagingData.termsConditionsNp || ""}
                            onChange={(e) => setStagingData(prev => ({ ...prev, termsConditionsNp: e.target.value }))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-sans"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Downloadable Resources Setup */}
                <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-4">
                  <h4 className="font-mono font-bold text-cyan-400 uppercase text-[10px] tracking-widest">2. Resource Downloads Hub (PDF/JPG/PNG/GIF Supportable)</h4>
                  
                  {/* Download Form */}
                  <div className="p-4 bg-black/40 border border-white/10 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeLangTab === "en" ? (
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-gray-400 uppercase">Asset Title (En) *</label>
                        <input type="text" value={downloadForm.titleEn} onChange={(e) => setDownloadForm(prev => ({ ...prev, titleEn: e.target.value }))} placeholder="e.g., Official Professional CV" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    ) : (
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-purple-400 uppercase">Asset Title (Np)</label>
                        <input type="text" value={downloadForm.titleNp} onChange={(e) => setDownloadForm(prev => ({ ...prev, titleNp: e.target.value }))} placeholder="e.g., आधिकारिक व्यावसायिक सीभी" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-gray-400 uppercase">File/Asset Type</label>
                      <select value={downloadForm.fileType} onChange={(e) => setDownloadForm(prev => ({ ...prev, fileType: e.target.value as any }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white">
                        <option value="pdf">PDF Document (*.pdf)</option>
                        <option value="jpg">JPG Image (*.jpg)</option>
                        <option value="png">PNG Image (*.png)</option>
                        <option value="gif">GIF Animation (*.gif)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-gray-400 uppercase">File URL or Upload asset *</label>
                      <div className="flex space-x-2">
                        <input type="text" value={downloadForm.fileUrl} onChange={(e) => setDownloadForm(prev => ({ ...prev, fileUrl: e.target.value }))} placeholder="Direct file URL path" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono" />
                        <label className="cursor-pointer px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-bold uppercase text-cyan-400 text-center flex items-center">
                          Upload
                          <input type="file" accept=".pdf,image/*" onChange={(e) => convertToBase64(e, (b) => setDownloadForm(prev => ({ ...prev, fileUrl: b })))} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <button type="button" onClick={handleSaveDownload} className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold uppercase hover:bg-cyan-400">
                        <Plus className="h-4 w-4" />
                        <span>Save Download Item</span>
                      </button>
                    </div>
                  </div>

                  {/* Downloads list */}
                  <div className="space-y-2">
                    <h5 className="font-mono text-gray-500 uppercase text-[9px]">Staged Download Assets</h5>
                    <div className="space-y-2">
                      {(stagingData.downloads || []).map((d) => (
                        <div key={d.id} className="p-3 bg-black/40 border border-white/10 rounded-xl flex justify-between items-center">
                          <div className="flex items-center space-x-2.5">
                            <span className="px-2 py-0.5 rounded text-[8px] bg-cyan-500/15 text-cyan-400 font-mono font-bold uppercase">{d.fileType}</span>
                            <span className="font-bold text-white">{activeLangTab === "en" ? d.titleEn : d.titleNp}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => { setEditingItemId(d.id); setDownloadForm({ ...d }); }} className="p-1.5 text-gray-400 hover:text-cyan-400"><Edit3 className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteDownload(d.id)} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Useful Links Setup */}
                <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-4">
                  <h4 className="font-mono font-bold text-cyan-400 uppercase text-[10px] tracking-widest">3. Useful Links Tab (CMS customizable)</h4>

                  {/* Useful Links Form */}
                  <div className="p-4 bg-black/40 border border-white/10 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeLangTab === "en" ? (
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase">Link Title (En) *</label>
                        <input type="text" value={usefulLinkForm.titleEn} onChange={(e) => setUsefulLinkForm(prev => ({ ...prev, titleEn: e.target.value }))} placeholder="e.g., Government of Nepal Official Portal" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-purple-400 uppercase">Link Title (Np)</label>
                        <input type="text" value={usefulLinkForm.titleNp} onChange={(e) => setUsefulLinkForm(prev => ({ ...prev, titleNp: e.target.value }))} placeholder="e.g., नेपाल सरकारको आधिकारिक पोर्टल" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="font-mono font-bold text-gray-400 uppercase">Destination Redirect URL *</label>
                      <input type="text" value={usefulLinkForm.url} onChange={(e) => setUsefulLinkForm(prev => ({ ...prev, url: e.target.value }))} placeholder="e.g., https://nepal.gov.np" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono" />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <button type="button" onClick={handleSaveUsefulLink} className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold uppercase hover:bg-cyan-400">
                        <Plus className="h-4 w-4" />
                        <span>Save Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Links list */}
                  <div className="space-y-2">
                    <h5 className="font-mono text-gray-500 uppercase text-[9px]">Staged Useful Links</h5>
                    <div className="space-y-2">
                      {(stagingData.usefulLinks || []).map((l) => (
                        <div key={l.id} className="p-3 bg-black/40 border border-white/10 rounded-xl flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{activeLangTab === "en" ? l.titleEn : l.titleNp}</span>
                            <span className="text-[10px] text-gray-500 font-mono truncate max-w-md">{l.url}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => { setEditingItemId(l.id); setUsefulLinkForm({ ...l }); }} className="p-1.5 text-gray-400 hover:text-cyan-400"><Edit3 className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteUsefulLink(l.id)} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ---------------- 9. SECTION: MAPS EMBEDS ---------------- */}
            {activeCmsSection === "maps" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Google Maps Embeds & Physical Addresses</h3>
                  <p className="text-gray-500 mt-1">Configure physical addresses and Google Map iframe src parameters for Permanent and Current address cards.</p>
                </div>

                <div className="space-y-4">
                  {activeLangTab === "en" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Current Address (En)</label>
                        <input
                          type="text"
                          value={stagingData.maps?.temporaryAddressEn || ""}
                          onChange={(e) => updateStagingField("maps", "temporaryAddressEn", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                          placeholder="Current Address: New Baneshwor, Kathmandu"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-gray-400 uppercase tracking-wide">Permanent Address (En)</label>
                        <input
                          type="text"
                          value={stagingData.maps?.permanentAddressEn || ""}
                          onChange={(e) => updateStagingField("maps", "permanentAddressEn", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                          placeholder="Permanent Address: Duhu 3, Darchula"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Current Address (Np)</label>
                        <input
                          type="text"
                          value={stagingData.maps?.temporaryAddressNp || ""}
                          onChange={(e) => updateStagingField("maps", "temporaryAddressNp", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                          placeholder="हालको ठेगाना: नयाँ बानेश्वर, काठमाडौं"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-mono font-bold text-purple-400 uppercase tracking-wide">Permanent Address (Np)</label>
                        <input
                          type="text"
                          value={stagingData.maps?.permanentAddressNp || ""}
                          onChange={(e) => updateStagingField("maps", "permanentAddressNp", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                          placeholder="स्थायी ठेगाना: दुहु ३, दार्चुला"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-gray-400 uppercase">Permanent Address Map link (src="..." url or complete iframe element)</label>
                    <textarea rows={3} value={stagingData.maps?.permanentUrl || ""} onChange={(e) => updateStagingField("maps", "permanentUrl", e.target.value)} placeholder="Paste the exact Google Map iframe 'src' URL or full iframe element here" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono leading-normal" />
                    {stagingData.maps?.permanentUrl && !(stagingData.maps.permanentUrl.includes("/maps/embed") || stagingData.maps.permanentUrl.includes("google.com/maps/embed")) && (
                      <p className="text-[11px] text-amber-400 font-mono mt-1 bg-amber-500/10 p-2 border border-amber-500/20 rounded-lg">
                        ⚠️ Warning: This doesn't look like a Google Maps Embed URL. Please copy the HTML iframe code from Google Maps (Share &gt; Embed a map) and paste it here, which will automatically embed the interactive map.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-gray-400 uppercase">Temporary/Current Address Map link (src="..." url or complete iframe element)</label>
                    <textarea rows={3} value={stagingData.maps?.temporaryUrl || ""} onChange={(e) => updateStagingField("maps", "temporaryUrl", e.target.value)} placeholder="Paste the exact Google Map iframe 'src' URL or full iframe element here" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono leading-normal" />
                    {stagingData.maps?.temporaryUrl && !(stagingData.maps.temporaryUrl.includes("/maps/embed") || stagingData.maps.temporaryUrl.includes("google.com/maps/embed")) && (
                      <p className="text-[11px] text-amber-400 font-mono mt-1 bg-amber-500/10 p-2 border border-amber-500/20 rounded-lg">
                        ⚠️ Warning: This doesn't look like a Google Maps Embed URL. Please copy the HTML iframe code from Google Maps (Share &gt; Embed a map) and paste it here, which will automatically embed the interactive map.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 10. SECTION: PERSONAL INTERESTS ---------------- */}
            {activeCmsSection === "interests" && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold font-sans text-cyan-400 uppercase tracking-wide">Personal Passions Portal</h3>
                  <p className="text-gray-500 mt-1">Manage interactive interest cards displayed on the portfolio.</p>
                </div>

                <div className="p-4 bg-white/[0.01] border border-white/10 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeLangTab === "en" ? (
                    <>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-gray-400 uppercase">Interest Title (En) *</label>
                        <input type="text" value={interestForm.titleEn} onChange={(e) => setInterestForm(prev => ({ ...prev, titleEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-gray-400 uppercase">Short description (En) *</label>
                        <textarea rows={2} value={interestForm.descriptionEn} onChange={(e) => setInterestForm(prev => ({ ...prev, descriptionEn: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-purple-400 uppercase">Interest Title (Np)</label>
                        <input type="text" value={interestForm.titleNp} onChange={(e) => setInterestForm(prev => ({ ...prev, titleNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-mono font-bold text-purple-400 uppercase">Short description (Np)</label>
                        <textarea rows={2} value={interestForm.descriptionNp} onChange={(e) => setInterestForm(prev => ({ ...prev, descriptionNp: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-mono font-bold text-gray-400 uppercase">Lucide Icon name</label>
                    <select value={interestForm.icon} onChange={(e) => setInterestForm(prev => ({ ...prev, icon: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white">
                      <option value="Heart">Heart</option>
                      <option value="Server">Server</option>
                      <option value="PenTool">PenTool</option>
                      <option value="BookOpen">BookOpen</option>
                      <option value="Cpu">Cpu</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button type="button" onClick={handleSaveInterest} className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold uppercase hover:bg-cyan-400">
                      <Plus className="h-4 w-4" />
                      <span>Save Interest</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-mono font-bold text-gray-500 uppercase text-[10px]">Staged passions</h4>
                  <div className="space-y-2">
                    {(stagingData.interests || []).map((i) => (
                      <div key={i.id} className="p-3 bg-black/40 border border-white/10 rounded-xl flex justify-between items-center">
                        <div>
                          <h5 className="font-bold text-white">{activeLangTab === "en" ? i.titleEn : i.titleNp}</h5>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { setEditingItemId(i.id); setInterestForm({ ...i }); }} className="p-2 text-gray-400 hover:text-cyan-400"><Edit3 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteInterest(i.id)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* ================= CMS FOOTER ================= */}
      <footer className="py-6 border-t border-white/10 bg-black/30 text-center text-[10px] font-mono text-gray-500 uppercase tracking-widest relative z-10">
        Amit Joshi CMS Dashboard HUD &bull; Security Guard Active &bull; 2026 Edition
      </footer>

    </div>
  );
}

// Render root element
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Dashboard />);
}
