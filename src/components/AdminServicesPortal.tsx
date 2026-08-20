import React, { useState, useEffect } from "react";
import { ref, get, set, update, onValue } from "firebase/database";
import { db } from "../firebase";
import { defaultPortfolioData, PortfolioData, ServiceAdminUser, ServiceInvoice, ServiceItem, ServiceQuestion, ServiceFieldType, checkUserPermission } from "../utils/defaultData";
import { 
  Lock, User, Key, MessageSquare, Inbox, Phone, Mail, 
  Trash2, CheckCircle2, Clock, FileText, Image as ImageIcon, 
  Search, ShieldCheck, LogOut, RefreshCw, AlertCircle, Sparkles, 
  Filter, Users, Copy, Check, DownloadCloud, ArrowUpDown, Send,
  Receipt, DollarSign, Calendar, Plus, Edit2, Shield, UserPlus, Eye,
  Sliders, Settings, ArrowUp, ArrowDown, ExternalLink, HelpCircle,
  X, CheckSquare, ListPlus, Printer, AlertTriangle, Edit3
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
  const [activeTab, setActiveTab] = useState<"services" | "applications" | "invoices" | "suggestions" | "subscribers" | "rbac">("services");
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewingInvoice, setViewingInvoice] = useState<ServiceInvoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<ServiceInvoice | null>(null);
  const [isEditingInvoiceModalOpen, setIsEditingInvoiceModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [bulkCopySuccess, setBulkCopySuccess] = useState(false);

  // Service Builder State
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<ServiceQuestion | null>(null);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);

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
      viewServicesAdmin: true,
      viewServiceForms: true,
      createServiceForms: true,
      editServiceForms: true,
      deleteServiceForms: false,
      viewServiceSubmissions: true,
      editServiceSubmissions: true,
      deleteServiceSubmissions: false,
      changeStatusServices: true,
      addRemarksServices: true,
      viewBills: true,
      editBills: true,
      createBills: true,
      deleteBills: false,
      modifyServiceBill: true,
      downloadServiceSubmissions: true,
      viewSuggestions: true,
      deleteSuggestions: false,
      changeStatusSuggestions: true,
      addRemarksSuggestions: true,
      viewNewsletter: true,
      deleteNewsletter: false,
      exportNewsletter: true,
      manageUsers: false
    }
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch portfolio data from Firebase
  useEffect(() => {
    const portfolioRef = ref(db, "portfolio");
    const unsubscribe = onValue(portfolioRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setPortfolioData({
          ...defaultPortfolioData,
          ...val,
          services: val.services || defaultPortfolioData.services,
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
      appList.sort((a, b) => new Date(b.submittedAt || b.timestamp || 0).getTime() - new Date(a.submittedAt || a.timestamp || 0).getTime());
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
      subsList.sort((a, b) => new Date(b.subscribedAt || b.timestamp || 0).getTime() - new Date(a.subscribedAt || a.timestamp || 0).getTime());
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

      return () => {
        unsubSubs();
        unsubPortSubs();
        unsubApps();
        unsubInvs();
        unsubSugs();
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
          serviceRequests: true,
          suggestions: true,
          newsletter: true,
          serviceConfiguration: true,
          billing: true
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

  // ----------------------------------------------------
  // SERVICE & DYNAMIC QUESTIONS BUILDER HANDLERS
  // ----------------------------------------------------
  const handleSaveAllServices = async (updatedServices: ServiceItem[]) => {
    if (!checkUserPermission(currentUserInfo, "editServiceForms")) {
      showToast("Access Denied: You lack permission to modify service forms.", "error");
      return;
    }
    try {
      await set(ref(db, "portfolio/services"), updatedServices);
      setPortfolioData(prev => ({ ...prev, services: updatedServices }));
      showToast("Services & Questions updated successfully!");
    } catch (e: any) {
      console.error(e);
      showToast("Failed to save services: " + e.message, "error");
    }
  };

  const handleCreateNewService = () => {
    if (!checkUserPermission(currentUserInfo, "createServiceForms")) {
      showToast("Access Denied: You lack permission to create new service forms.", "error");
      return;
    }
    const newService: ServiceItem = {
      id: `serv-${Date.now().toString(36)}`,
      titleEn: "New Professional Service",
      titleNp: "नयाँ व्यावसायिक सेवा",
      descriptionEn: "Comprehensive solution designed for optimal performance, high security, and fast turnaround.",
      descriptionNp: "उत्कृष्ट कार्यसम्पादन, उच्च सुरक्षा र द्रुत सेवाका लागि डिजाइन गरिएको पूर्ण समाधान।",
      priceEn: "NPR 5,000",
      priceNp: "रु ५,०००",
      whatsappMessageEn: "Hello Amit, I would like to inquire about the service.",
      whatsappMessageNp: "नमस्कार अमित, म यस सेवाको बारेमा सोधपुछ गर्न चाहन्छु।",
      officialLink: "https://amitjoshi.info.np/services",
      icon: "FileText",
      questions: [
        {
          id: `q-${Date.now()}-1`,
          order: 1,
          labelEn: "Full Legal Name",
          labelNp: "पूरा नाम",
          fieldType: "short_text",
          required: true,
          placeholder: "e.g. Ram Prasad Sharma",
          helpText: "Applicant's official full name"
        },
        {
          id: `q-${Date.now()}-2`,
          order: 2,
          labelEn: "Contact Phone / Mobile",
          labelNp: "सम्पर्क फोन / मोबाइल",
          fieldType: "phone",
          required: true,
          placeholder: "98XXXXXXXX",
          helpText: "Primary phone for WhatsApp and SMS updates"
        },
        {
          id: `q-${Date.now()}-3`,
          order: 3,
          labelEn: "Email Address",
          labelNp: "इमेल ठेगाना",
          fieldType: "email",
          required: true,
          placeholder: "client@example.com",
          helpText: "For digital invoice and receipt delivery"
        }
      ]
    };

    setEditingService(newService);
    setIsNewServiceModalOpen(true);
  };

  const handleSaveServiceForm = async (serviceToSave: ServiceItem) => {
    const isNew = !portfolioData.services?.some(s => s.id === serviceToSave.id);
    const requiredPermission = isNew ? "createServiceForms" : "editServiceForms";
    if (!checkUserPermission(currentUserInfo, requiredPermission)) {
      showToast(`Access Denied: You lack permission to ${isNew ? "create" : "edit"} service forms.`, "error");
      return;
    }

    const currentServices = [...(portfolioData.services || defaultPortfolioData.services)];
    const existingIndex = currentServices.findIndex(s => s.id === serviceToSave.id);

    if (existingIndex >= 0) {
      currentServices[existingIndex] = serviceToSave;
    } else {
      currentServices.push(serviceToSave);
    }

    await handleSaveAllServices(currentServices);
    setEditingService(null);
    setIsNewServiceModalOpen(false);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!checkUserPermission(currentUserInfo, "deleteServiceForms")) {
      showToast("Access Denied: You lack permission to delete service forms.", "error");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this service and all its configured questions?")) return;
    const updated = (portfolioData.services || defaultPortfolioData.services).filter(s => s.id !== serviceId);
    await handleSaveAllServices(updated);
    if (editingService?.id === serviceId) setEditingService(null);
  };

  // Add Question to currently editing service
  const handleAddQuestionToService = (fieldType: ServiceFieldType = "short_text") => {
    if (!checkUserPermission(currentUserInfo, "editServiceForms")) {
      showToast("Access Denied: You lack permission to modify questions.", "error");
      return;
    }
    if (!editingService) return;
    const currentQuestions = editingService.questions ? [...editingService.questions] : [];
    const newOrder = currentQuestions.length + 1;
    
    const newQ: ServiceQuestion = {
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order: newOrder,
      labelEn: fieldType === "image_upload" ? "Upload Photo / Image" : fieldType === "file_upload" ? "Upload Document (PDF)" : "Question Label",
      labelNp: fieldType === "image_upload" ? "फोटो / छवि अपलोड गर्नुहोस्" : fieldType === "file_upload" ? "कागजात अपलोड गर्नुहोस्" : "प्रश्नको विवरण",
      fieldType: fieldType,
      required: true,
      placeholder: "",
      helpText: "",
      options: (fieldType === "dropdown" || fieldType === "radio" || fieldType === "checkbox") ? ["Option 1", "Option 2"] : undefined,
      maxImages: fieldType === "image_upload" ? 4 : undefined,
      allowedFileTypes: fieldType === "image_upload" ? ["jpg", "jpeg", "png", "webp"] : fieldType === "file_upload" ? ["pdf", "jpg", "png"] : undefined
    };

    const updatedQuestions = [...currentQuestions, newQ];
    setEditingService({ ...editingService, questions: updatedQuestions });
    setEditingQuestion(newQ);
  };

  const handleUpdateQuestion = (updatedQ: ServiceQuestion) => {
    if (!checkUserPermission(currentUserInfo, "editServiceForms")) {
      showToast("Access Denied: You lack permission to modify questions.", "error");
      return;
    }
    if (!editingService || !editingService.questions) return;
    const updatedQuestions = editingService.questions.map(q => q.id === updatedQ.id ? updatedQ : q);
    setEditingService({ ...editingService, questions: updatedQuestions });
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!checkUserPermission(currentUserInfo, "editServiceForms")) {
      showToast("Access Denied: You lack permission to delete questions.", "error");
      return;
    }
    if (!editingService || !editingService.questions) return;
    const filtered = editingService.questions
      .filter(q => q.id !== questionId)
      .map((q, idx) => ({ ...q, order: idx + 1 }));
    setEditingService({ ...editingService, questions: filtered });
    if (editingQuestion?.id === questionId) setEditingQuestion(null);
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (!checkUserPermission(currentUserInfo, "editServiceForms")) return;
    if (!editingService || !editingService.questions) return;
    const list = [...editingService.questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const reordered = list.map((q, idx) => ({ ...q, order: idx + 1 }));
    setEditingService({ ...editingService, questions: reordered });
  };

  // ----------------------------------------------------
  // APPLICATION & STATUS HANDLERS
  // ----------------------------------------------------
  const handleUpdateApplicationStatus = async (appId: string, status: string, remarks?: string) => {
    if (!checkUserPermission(currentUserInfo, "changeStatusServices")) {
      showToast("Access Denied: You lack permission to change service status.", "error");
      return;
    }
    if (remarks !== undefined && !checkUserPermission(currentUserInfo, "addRemarksServices")) {
      showToast("Access Denied: You lack permission to add/modify remarks.", "error");
      return;
    }
    try {
      const updates: any = {
        status,
        updatedAt: new Date().toISOString()
      };
      if (remarks !== undefined) updates.remarks = remarks;

      await update(ref(db, `service_applications/${appId}`), updates);
      showToast(`Status updated to "${status}" for ${appId}`);
      fetchData();
      if (selectedItem && selectedItem.id === appId) {
        setSelectedItem((prev: any) => ({ ...prev, ...updates }));
      }
    } catch (e: any) {
      showToast("Failed to update status: " + e.message, "error");
    }
  };

  const handleUpdatePaymentStatus = async (appId: string, paymentStatus: "Pending" | "Paid" | "Expired" | "Cancelled" | "Failed", paymentReference?: string) => {
    if (!checkUserPermission(currentUserInfo, "editBills") && !checkUserPermission(currentUserInfo, "modifyServiceBill")) {
      showToast("Access Denied: You lack permission to modify billing/payment status.", "error");
      return;
    }
    try {
      const updates: any = {
        paymentStatus,
        paymentUpdatedAt: new Date().toISOString()
      };
      if (paymentStatus === "Paid") {
        updates.paidAt = new Date().toISOString();
        if (paymentReference) updates.paymentReference = paymentReference;
      }

      await update(ref(db, `service_applications/${appId}`), updates);
      
      // Also sync corresponding invoice if exists
      const invId = `INV-${appId}`;
      await update(ref(db, `invoices/${invId}`), updates).catch(() => {});

      showToast(`Payment marked as "${paymentStatus}" for ${appId}`);
      fetchData();
      if (selectedItem && selectedItem.id === appId) {
        setSelectedItem((prev: any) => ({ ...prev, ...updates }));
      }
    } catch (e: any) {
      showToast("Failed to update payment: " + e.message, "error");
    }
  };

  const handleToggleEditAccess = async (appId: string, currentVal: boolean) => {
    if (!checkUserPermission(currentUserInfo, "editServiceSubmissions")) {
      showToast("Access Denied: You lack permission to configure client edit access.", "error");
      return;
    }
    try {
      await update(ref(db, `service_applications/${appId}`), { allowEdit: !currentVal });
      showToast(!currentVal ? "User Edit Access ENABLED." : "User Edit Access DISABLED.");
      fetchData();
      if (selectedItem && selectedItem.id === appId) {
        setSelectedItem((prev: any) => ({ ...prev, allowEdit: !currentVal }));
      }
    } catch (e: any) {
      showToast("Failed to toggle access: " + e.message, "error");
    }
  };

  const handleDeleteItem = async (type: "applications" | "suggestions" | "subscribers" | "invoices", id: string) => {
    // Check permission based on category
    if (type === "applications" && !checkUserPermission(currentUserInfo, "deleteServiceSubmissions")) {
      showToast("Access Denied: You lack permission to delete service submissions.", "error");
      return;
    }
    if (type === "invoices" && !checkUserPermission(currentUserInfo, "deleteBills")) {
      showToast("Access Denied: You lack permission to delete invoices.", "error");
      return;
    }
    if (type === "suggestions" && !checkUserPermission(currentUserInfo, "deleteSuggestions")) {
      showToast("Access Denied: You lack permission to delete suggestions.", "error");
      return;
    }
    if (type === "subscribers" && !checkUserPermission(currentUserInfo, "deleteNewsletter")) {
      showToast("Access Denied: You lack permission to delete newsletter subscribers.", "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete this ${type.slice(0, -1)}?`)) return;
    try {
      if (type === "subscribers") {
        await set(ref(db, `subscribers/${id}`), null);
        await set(ref(db, `portfolio/subscribers/${id}`), null);
      } else if (type === "applications") {
        await set(ref(db, `service_applications/${id}`), null);
        await set(ref(db, `applications/${id}`), null);
        await set(ref(db, `invoices/INV-${id}`), null).catch(() => {});
      } else if (type === "invoices") {
        await set(ref(db, `invoices/${id}`), null);
      } else {
        await set(ref(db, `suggestions/${id}`), null);
      }
      
      if (selectedItem?.id === id) setSelectedItem(null);
      showToast("Record deleted.");
      fetchData();
    } catch (e: any) {
      showToast("Failed to delete item: " + e.message, "error");
    }
  };

  // ----------------------------------------------------
  // INVOICE / BILL EDITING & MANAGEMENT
  // ----------------------------------------------------
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    if (!checkUserPermission(currentUserInfo, "editBills") && !checkUserPermission(currentUserInfo, "modifyServiceBill")) {
      showToast("Access Denied: You lack permission to modify bills.", "error");
      return;
    }

    try {
      const invId = editingInvoice.invoiceId || `INV-${Date.now()}`;
      const payload: ServiceInvoice = {
        ...editingInvoice,
        invoiceId: invId,
        amountFormatted: editingInvoice.amountFormatted || `NPR ${Number(editingInvoice.amount || 0).toLocaleString()}`,
        updatedAt: new Date().toISOString()
      };

      await set(ref(db, `invoices/${invId}`), payload);
      
      // If linked to an application submission, sync its amount and payment status
      if (editingInvoice.submissionId) {
        await update(ref(db, `service_applications/${editingInvoice.submissionId}`), {
          amount: payload.amountFormatted,
          paymentStatus: payload.paymentStatus,
          paymentDueAt: payload.paymentDueAt
        }).catch(() => {});
      }

      showToast(`Bill #${invId} updated and synced successfully!`);
      setIsEditingInvoiceModalOpen(false);
      setEditingInvoice(null);
      fetchData();
    } catch (err: any) {
      showToast("Failed to save invoice: " + err.message, "error");
    }
  };

  // ----------------------------------------------------
  // SUGGESTIONS STATUS & REMARKS HANDLERS
  // ----------------------------------------------------
  const handleUpdateSuggestionStatus = async (sugId: string, status: string) => {
    if (!checkUserPermission(currentUserInfo, "changeStatusSuggestions")) {
      showToast("Access Denied: You lack permission to change suggestion status.", "error");
      return;
    }
    try {
      await update(ref(db, `suggestions/${sugId}`), {
        status,
        statusUpdatedAt: new Date().toISOString()
      });
      showToast(`Suggestion status updated to "${status}"`);
      fetchData();
    } catch (e: any) {
      showToast("Failed to update suggestion status: " + e.message, "error");
    }
  };

  const handleUpdateSuggestionRemarks = async (sugId: string, remarks: string) => {
    if (!checkUserPermission(currentUserInfo, "addRemarksSuggestions")) {
      showToast("Access Denied: You lack permission to add/modify remarks.", "error");
      return;
    }
    try {
      await update(ref(db, `suggestions/${sugId}`), {
        remarks,
        remarksUpdatedAt: new Date().toISOString()
      });
      showToast("Admin remarks saved for suggestion.");
      fetchData();
    } catch (e: any) {
      showToast("Failed to save remarks: " + e.message, "error");
    }
  };

  // ----------------------------------------------------
  // EXPORT SUBMISSIONS CSV
  // ----------------------------------------------------
  const handleExportSubmissionsCSV = () => {
    if (!checkUserPermission(currentUserInfo, "downloadServiceSubmissions")) {
      showToast("Access Denied: You lack permission to export submissions.", "error");
      return;
    }
    if (applications.length === 0) {
      showToast("No submissions available to export.", "error");
      return;
    }
    const headers = ["Submission ID", "Service Title", "Applicant Name", "Phone", "Email", "Amount", "Status", "Payment Status", "Submitted At", "Remarks"];
    const rows = applications.map(a => [
      `"${a.id || ""}"`,
      `"${(a.serviceTitle || "").replace(/"/g, '""')}"`,
      `"${(a.name || a.fullName || "").replace(/"/g, '""')}"`,
      `"${(a.contact || a.phone || "").replace(/"/g, '""')}"`,
      `"${(a.email || "").replace(/"/g, '""')}"`,
      `"${(a.amount || "").replace(/"/g, '""')}"`,
      `"${(a.status || "Submitted").replace(/"/g, '""')}"`,
      `"${(a.paymentStatus || "Pending").replace(/"/g, '""')}"`,
      `"${(a.submittedAt || a.timestamp || "").replace(/"/g, '""')}"`,
      `"${(a.remarks || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `service_submissions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Submissions exported as CSV successfully.");
  };

  // ----------------------------------------------------
  // NEWSLETTER HELPERS
  // ----------------------------------------------------
  const handleCopyAllSubscriberEmails = () => {
    if (!checkUserPermission(currentUserInfo, "exportNewsletter")) {
      showToast("Access Denied: You lack permission to export newsletter subscribers.", "error");
      return;
    }
    const emails = subscribers.map(s => s.email).filter(Boolean).join(", ");
    if (!emails) {
      showToast("No emails to copy.", "error");
      return;
    }
    navigator.clipboard.writeText(emails);
    setBulkCopySuccess(true);
    setTimeout(() => setBulkCopySuccess(false), 3000);
    showToast(`Copied ${subscribers.length} subscriber emails!`);
  };

  const handleExportSubscribersCSV = () => {
    if (!checkUserPermission(currentUserInfo, "exportNewsletter")) {
      showToast("Access Denied: You lack permission to export newsletter subscribers.", "error");
      return;
    }
    if (subscribers.length === 0) {
      showToast("No subscribers to export.", "error");
      return;
    }
    const headers = ["ID", "Name", "Email", "Subscribed Date & Time", "Status"];
    const rows = subscribers.map(s => [
      `"${s.id || ""}"`,
      `"${(s.name || "").replace(/"/g, '""')}"`,
      `"${(s.email || "").replace(/"/g, '""')}"`,
      `"${(s.subscribedAt || s.timestamp || "").replace(/"/g, '""')}"`,
      `"${(s.status || "active").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscribers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file generated and downloaded.");
  };

  // ----------------------------------------------------
  // RBAC USER MANAGEMENT
  // ----------------------------------------------------
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkUserPermission(currentUserInfo, "manageUsers")) {
      showToast("Access Denied: Only Super Admin can manage user accounts.", "error");
      return;
    }
    if (!userForm.username.trim() || !userForm.pin.trim() || !userForm.name.trim()) {
      showToast("Please fill in username, full name, and 4-digit PIN.", "error");
      return;
    }
    if (userForm.pin.trim().length !== 4 || !/^\d{4}$/.test(userForm.pin.trim())) {
      showToast("PIN must be exactly 4 digits.", "error");
      return;
    }

    const currentUsers = [...(portfolioData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers)];
    const existingIndex = currentUsers.findIndex(u => u.id === userForm.id);

    const userToSave: ServiceAdminUser = {
      ...userForm,
      username: userForm.username.trim().toLowerCase(),
      pin: userForm.pin.trim(),
      id: userForm.id || `sau-${Date.now()}`
    };

    if (existingIndex >= 0) {
      currentUsers[existingIndex] = userToSave;
    } else {
      currentUsers.push(userToSave);
    }

    try {
      await set(ref(db, "portfolio/serviceAdminUsers"), currentUsers);
      setIsEditingUser(false);
      showToast("Admin account saved successfully!");
    } catch (e: any) {
      showToast("Failed to save admin user: " + e.message, "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!checkUserPermission(currentUserInfo, "manageUsers")) {
      showToast("Access Denied: Only Super Admin can delete users.", "error");
      return;
    }
    const currentUsers = portfolioData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers;
    if (currentUsers.length <= 1) {
      showToast("Cannot delete the only admin user.", "error");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this admin account?")) return;
    const updated = currentUsers.filter(u => u.id !== userId);
    try {
      await set(ref(db, "portfolio/serviceAdminUsers"), updated);
      showToast("User removed.");
    } catch (e: any) {
      showToast("Failed to delete user: " + e.message, "error");
    }
  };

  // ----------------------------------------------------
  // FILTERING
  // ----------------------------------------------------
  const filteredApplications = applications.filter((app) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (app.id || "").toLowerCase().includes(q) ||
      (app.name || "").toLowerCase().includes(q) ||
      (app.fullName || "").toLowerCase().includes(q) ||
      (app.contact || "").toLowerCase().includes(q) ||
      (app.phone || "").toLowerCase().includes(q) ||
      (app.serviceTitle || "").toLowerCase().includes(q) ||
      (app.email || "").toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || (app.status || "Submitted").toLowerCase() === statusFilter.toLowerCase();
    const matchesPayment = paymentFilter === "all" || (app.paymentStatus || "Pending").toLowerCase() === paymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (inv.invoiceId || "").toLowerCase().includes(q) ||
      (inv.submissionId || "").toLowerCase().includes(q) ||
      (inv.clientName || "").toLowerCase().includes(q) ||
      (inv.clientEmail || "").toLowerCase().includes(q) ||
      (inv.clientPhone || "").toLowerCase().includes(q) ||
      (inv.serviceTitle || "").toLowerCase().includes(q);

    const matchesPayment = paymentFilter === "all" || (inv.paymentStatus || "Pending").toLowerCase() === paymentFilter.toLowerCase();

    return matchesSearch && matchesPayment;
  });

  const filteredSuggestions = suggestions.filter((sug) => {
    const q = searchTerm.toLowerCase();
    return (
      (sug.name || "").toLowerCase().includes(q) ||
      (sug.contact || "").toLowerCase().includes(q) ||
      (sug.email || "").toLowerCase().includes(q) ||
      (sug.message || "").toLowerCase().includes(q)
    );
  });

  const filteredSubscribers = subscribers.filter((sub) => {
    const q = searchTerm.toLowerCase();
    return (
      (sub.name || "").toLowerCase().includes(q) ||
      (sub.email || "").toLowerCase().includes(q)
    );
  });

  // Calculate 12-Hour Status Helper
  const getDeadlineInfo = (dueAtStr?: string, paymentStatus?: string) => {
    if (paymentStatus === "Paid") {
      return { text: "Paid & Verified", isExpired: false, isPaid: true };
    }
    if (!dueAtStr) return { text: "Standard Processing", isExpired: false, isPaid: false };

    const dueTime = new Date(dueAtStr).getTime();
    const diff = dueTime - Date.now();

    if (diff <= 0) {
      return { text: "12h Window Expired / Overdue", isExpired: true, isPaid: false };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { text: `${hours}h ${minutes}m remaining`, isExpired: false, isPaid: false };
  };

  // ----------------------------------------------------
  // LOGIN SCREEN
  // ----------------------------------------------------
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
              Services & Submissions Portal
            </h1>
            <p className="text-xs text-amber-300/80 mt-1 uppercase tracking-widest font-mono">
              Centralized Services & Questions Architecture
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
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none transition-all text-center text-lg font-mono tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer font-mono"
            >
              Authenticate & Enter Portal
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
          onUpdateStatus={(newStatus) => {
            handleUpdatePaymentStatus(viewingInvoice.submissionId, newStatus);
            setViewingInvoice(prev => prev ? { ...prev, paymentStatus: newStatus } : null);
          }}
          isAdmin={true}
        />
      </div>
    );
  }

  const allServices = portfolioData.services || defaultPortfolioData.services || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-2.5 font-mono text-xs font-bold animate-in slide-in-from-top-4 duration-300 ${
          toastMsg.type === "success" 
            ? "bg-emerald-950/95 border-emerald-500/50 text-emerald-300 shadow-emerald-500/20" 
            : "bg-rose-950/95 border-rose-500/50 text-rose-300 shadow-rose-500/20"
        }`}>
          {toastMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-rose-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-white/20 rounded-2xl overflow-hidden p-2">
            <img 
              src={lightboxImage} 
              alt="Full Preview" 
              className="max-h-[85vh] max-w-full object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-slate-900 border-b border-amber-500/30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-serif text-white">
              ServicesAdmin Central Command
            </h1>
            <p className="text-xs text-amber-400/80 font-mono">
              Logged in as: <span className="font-bold text-white">{currentUserInfo?.name || currentUserInfo?.username || "loginadmin"}</span>
              <span className="ml-2 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] uppercase font-bold border border-amber-500/30">
                {currentUserInfo?.role || "Super Admin"}
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
        
        {/* Navigation Tabs with Permissions Enforcement */}
        <div className="flex flex-wrap p-1.5 bg-slate-900 border border-slate-800 rounded-2xl gap-1 shadow-lg overflow-x-auto">
          
          {checkUserPermission(currentUserInfo, "viewServiceForms") && (
            <button
              onClick={() => { setActiveTab("services"); setSelectedItem(null); }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "services"
                  ? "bg-amber-500 text-slate-950 shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Service & Questions Builder ({allServices.length})</span>
            </button>
          )}

          {checkUserPermission(currentUserInfo, "viewServiceSubmissions") && (
            <button
              onClick={() => { setActiveTab("applications"); setSelectedItem(null); }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "applications"
                  ? "bg-amber-500 text-slate-950 shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Submissions ({applications.length})</span>
            </button>
          )}

          {checkUserPermission(currentUserInfo, "viewBills") && (
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
          )}

          {checkUserPermission(currentUserInfo, "viewSuggestions") && (
            <button
              onClick={() => { setActiveTab("suggestions"); setSelectedItem(null); }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "suggestions"
                  ? "bg-amber-500 text-slate-950 shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Suggestions & Feedback ({suggestions.length})</span>
            </button>
          )}

          {checkUserPermission(currentUserInfo, "viewNewsletter") && (
            <button
              onClick={() => { setActiveTab("subscribers"); setSelectedItem(null); }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "subscribers"
                  ? "bg-amber-500 text-slate-950 shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Newsletter Subscribers ({subscribers.length})</span>
            </button>
          )}

          {checkUserPermission(currentUserInfo, "manageUsers") && (
            <button
              onClick={() => { setActiveTab("rbac"); setSelectedItem(null); }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "rbac"
                  ? "bg-amber-500 text-slate-950 shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Admin Users & PINs</span>
            </button>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: DYNAMIC SERVICE & QUESTIONS BUILDER */}
        {/* ---------------------------------------------------- */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <span>Dynamic Services & Question Form Builder</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Configure services and build dynamic, database-driven intake questions. Changes immediately reflect on the live frontend form.
                </p>
              </div>

              <button
                onClick={handleCreateNewService}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Service</span>
              </button>
            </div>

            {/* Editing Service Modal / View */}
            {editingService ? (
              <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-400">
                      Service Configuration Studio
                    </span>
                    <h3 className="text-lg font-bold text-white font-serif">
                      {editingService.titleEn || "Configure Service"}
                    </h3>
                  </div>
                  <button
                    onClick={() => { setEditingService(null); setEditingQuestion(null); }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Core Service Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Service Title (English) *</label>
                    <input
                      type="text"
                      value={editingService.titleEn}
                      onChange={(e) => setEditingService({ ...editingService, titleEn: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Service Title (Nepali)</label>
                    <input
                      type="text"
                      value={editingService.titleNp}
                      onChange={(e) => setEditingService({ ...editingService, titleNp: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Price Format (English) *</label>
                    <input
                      type="text"
                      value={editingService.priceEn}
                      onChange={(e) => setEditingService({ ...editingService, priceEn: e.target.value })}
                      placeholder="e.g. NPR 15,000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Price Format (Nepali)</label>
                    <input
                      type="text"
                      value={editingService.priceNp}
                      onChange={(e) => setEditingService({ ...editingService, priceNp: e.target.value })}
                      placeholder="e.g. रु १५,०००"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-gray-400 uppercase font-bold">Description (English) *</label>
                    <textarea
                      rows={2}
                      value={editingService.descriptionEn}
                      onChange={(e) => setEditingService({ ...editingService, descriptionEn: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-gray-400 uppercase font-bold">Description (Nepali)</label>
                    <textarea
                      rows={2}
                      value={editingService.descriptionNp}
                      onChange={(e) => setEditingService({ ...editingService, descriptionNp: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">WhatsApp Inquire Message (English)</label>
                    <input
                      type="text"
                      value={editingService.whatsappMessageEn || ""}
                      onChange={(e) => setEditingService({ ...editingService, whatsappMessageEn: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Icon Identifier</label>
                    <input
                      type="text"
                      value={editingService.icon || "FileText"}
                      onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })}
                      placeholder="e.g. Layout, ShieldAlert, FileText, Landmark"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Dynamic Questions Builder Header */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 p-4 rounded-2xl border border-amber-500/20">
                    <div>
                      <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <ListPlus className="w-4 h-4" />
                        <span>Dynamic Questions for this Service ({(editingService.questions || []).length})</span>
                      </h4>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        Define any text fields, numbers, dropdown options, and photo/document uploads required for this service.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAddQuestionToService("short_text")}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ Text Field</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestionToService("dropdown")}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ Dropdown</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestionToService("image_upload")}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ Image Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestionToService("file_upload")}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span>+ Document (PDF)</span>
                      </button>
                    </div>
                  </div>

                  {/* Questions List */}
                  {(!editingService.questions || editingService.questions.length === 0) ? (
                    <div className="p-8 text-center bg-black/20 rounded-2xl border border-dashed border-white/10 text-gray-400 font-mono text-xs">
                      No custom questions created yet. The service will use default intake fields. Click "+ Text Field" or "+ Image Upload" to add custom questions.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editingService.questions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="bg-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-amber-500/30 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-amber-500/30">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm font-sans">{q.labelEn}</span>
                                {q.required ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                                    Required
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-white/5 text-gray-400 border border-white/10">
                                    Optional
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  {q.fieldType}
                                </span>
                              </div>
                              {q.labelNp && <p className="text-xs text-gray-400 font-sans mt-0.5">{q.labelNp}</p>}
                              {q.helpText && <p className="text-[11px] text-gray-500 font-mono mt-0.5">{q.helpText}</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 self-end md:self-auto">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveQuestion(idx, "up")}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 cursor-pointer"
                              title="Move Question Up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === (editingService.questions?.length || 0) - 1}
                              onClick={() => handleMoveQuestion(idx, "down")}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 cursor-pointer"
                              title="Move Question Down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingQuestion(q)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Configure</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save Service Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleDeleteService(editingService.id)}
                    className="px-4 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Service</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setEditingService(null); setEditingQuestion(null); }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-mono font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveServiceForm(editingService)}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      Save Service & Questions to Firebase
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* All Services Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allServices.map((srv) => (
                  <div
                    key={srv.id}
                    className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-amber-500/40 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-mono text-xs font-bold border border-amber-500/20">
                          {srv.priceEn}
                        </span>
                        <span className="text-[11px] font-mono text-gray-400">
                          {(srv.questions || []).length} dynamic questions
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white font-serif">{srv.titleEn}</h3>
                      {srv.titleNp && <p className="text-xs text-gray-400 font-sans">{srv.titleNp}</p>}
                      <p className="text-xs text-gray-400 line-clamp-3 font-sans leading-relaxed">
                        {srv.descriptionEn}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-500">ID: {srv.id}</span>
                      <button
                        type="button"
                        onClick={() => setEditingService({ ...srv })}
                        className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Manage Questions</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Configure Individual Question Modal */}
            {editingQuestion && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h4 className="text-base font-bold text-amber-400 uppercase font-mono flex items-center gap-2">
                      <Edit2 className="w-4 h-4" />
                      <span>Configure Dynamic Question</span>
                    </h4>
                    <button
                      onClick={() => setEditingQuestion(null)}
                      className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs font-mono">
                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Question Label / Title (English) *</label>
                      <input
                        type="text"
                        value={editingQuestion.labelEn}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, labelEn: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Question Label (Nepali)</label>
                      <input
                        type="text"
                        value={editingQuestion.labelNp || ""}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, labelNp: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-gray-400 uppercase font-bold">Field Type *</label>
                        <select
                          value={editingQuestion.fieldType}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, fieldType: e.target.value as ServiceFieldType })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-amber-400 focus:border-amber-500 outline-none"
                        >
                          <option value="short_text">Short Text (Single Line)</option>
                          <option value="long_text">Long Text (Paragraph)</option>
                          <option value="number">Number</option>
                          <option value="email">Email Address</option>
                          <option value="phone">Phone Number (+977)</option>
                          <option value="date">Date</option>
                          <option value="time">Time</option>
                          <option value="datetime">Date & Time</option>
                          <option value="dropdown">Dropdown Selection</option>
                          <option value="radio">Single Choice (Radio)</option>
                          <option value="checkbox">Multiple Choice (Checkboxes)</option>
                          <option value="image_upload">Image / Photo Upload</option>
                          <option value="file_upload">Document Upload (PDF)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-400 uppercase font-bold">Requirement</label>
                        <div className="flex items-center gap-3 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-white">
                            <input
                              type="radio"
                              name="reqToggle"
                              checked={editingQuestion.required === true}
                              onChange={() => setEditingQuestion({ ...editingQuestion, required: true })}
                              className="accent-amber-500"
                            />
                            <span>Required</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-gray-400">
                            <input
                              type="radio"
                              name="reqToggle"
                              checked={editingQuestion.required === false}
                              onChange={() => setEditingQuestion({ ...editingQuestion, required: false })}
                              className="accent-amber-500"
                            />
                            <span>Optional</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Help Text / Instructions for Customer</label>
                      <input
                        type="text"
                        value={editingQuestion.helpText || ""}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, helpText: e.target.value })}
                        placeholder="e.g. Please upload clear scans of both front and back"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                      />
                    </div>

                    {/* Options builder for Dropdown / Radio / Checkbox */}
                    {(editingQuestion.fieldType === "dropdown" || editingQuestion.fieldType === "radio" || editingQuestion.fieldType === "checkbox") && (
                      <div className="space-y-2 p-3 bg-black/40 rounded-xl border border-white/10">
                        <label className="text-amber-400 uppercase font-bold block">Choice Options List</label>
                        <div className="space-y-2">
                          {(editingQuestion.options || []).map((opt, oidx) => (
                            <div key={oidx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updatedOpts = [...(editingQuestion.options || [])];
                                  updatedOpts[oidx] = e.target.value;
                                  setEditingQuestion({ ...editingQuestion, options: updatedOpts });
                                }}
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedOpts = (editingQuestion.options || []).filter((_, i) => i !== oidx);
                                  setEditingQuestion({ ...editingQuestion, options: updatedOpts });
                                }}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedOpts = [...(editingQuestion.options || []), `Option ${(editingQuestion.options?.length || 0) + 1}`];
                              setEditingQuestion({ ...editingQuestion, options: updatedOpts });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold"
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(null)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs font-mono font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuestion(editingQuestion)}
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold uppercase tracking-wider"
                    >
                      Save Question
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: SERVICE SUBMISSIONS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "applications" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>Customer Service Submissions ({applications.length})</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  View submitted applications, customer details, all dynamic answers, uploaded images, and 12-hour payment tracking.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search applicant, ID, phone..."
                    className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 outline-none w-52 sm:w-64"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-mono outline-none"
                >
                  <option value="all">All Request Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="in progress">In Progress</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-mono outline-none"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="pending">Pending / Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {checkUserPermission(currentUserInfo, "downloadServiceSubmissions") && (
                  <button
                    type="button"
                    onClick={handleExportSubmissionsCSV}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                )}
              </div>
            </div>

            {filteredApplications.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-white/5 text-gray-400 font-mono text-xs">
                No submissions found matching your search and filters.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((app) => {
                  const deadline = getDeadlineInfo(app.paymentDueAt, app.paymentStatus);
                  const isExpanded = selectedItem?.id === app.id;

                  return (
                    <div
                      key={app.id}
                      className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all ${
                        isExpanded ? "border-amber-500/50 shadow-xl shadow-amber-500/5" : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      {/* Summary Row */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              {app.serviceTitle || "Service Intake"}
                            </span>
                            <span className="font-mono text-xs text-gray-400 select-all font-bold">
                              ID: {app.id}
                            </span>
                            <span className="text-gray-600">&bull;</span>
                            <span className="text-[11px] font-mono text-gray-400">
                              {app.submittedAt ? new Date(app.submittedAt).toLocaleString() : app.timestamp ? new Date(app.timestamp).toLocaleString() : "Recently"}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white font-serif">
                            {app.name || app.fullName || "Applicant"}
                          </h3>

                          <div className="flex items-center gap-4 text-xs font-mono text-gray-400 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-amber-400" />
                              {app.contact || app.phone || "No phone"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-cyan-400" />
                              {app.email || "No email"}
                            </span>
                            <span className="font-bold text-amber-300">
                              Amount: {app.amount || "NPR --"}
                            </span>
                          </div>
                        </div>

                        {/* Status Badges & Quick Actions */}
                        <div className="flex items-center gap-3 flex-wrap lg:justify-end">
                          {/* Payment status badge with 12h countdown indicator */}
                          <div className="flex flex-col items-start lg:items-end">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                              app.paymentStatus === "Paid"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : deadline.isExpired
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            }`}>
                              {app.paymentStatus || "Pending"}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500 mt-0.5">
                              {deadline.text}
                            </span>
                          </div>

                          <select
                            value={app.status || "Submitted"}
                            onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono outline-none"
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="Under Review">Under Review</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Approved">Approved</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => setSelectedItem(isExpanded ? null : app)}
                            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isExpanded ? "Collapse" : "View Answers"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details Drawer */}
                      {isExpanded && (
                        <div className="pt-4 border-t border-slate-800 space-y-5 animate-in fade-in duration-200">
                          
                          {/* 1. Dynamic Question Answers */}
                          <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                            <h4 className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-2">
                              <CheckSquare className="w-4 h-4" />
                              <span>Submitted Dynamic Question Answers</span>
                            </h4>

                            {app.dynamicAnswers && Object.keys(app.dynamicAnswers).length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {Object.entries(app.dynamicAnswers).map(([label, val]: [string, any], aidx) => (
                                  <div key={aidx} className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-1">
                                    <span className="text-[10px] font-mono text-gray-500 uppercase block">{label}</span>
                                    <p className="font-sans text-white font-medium">{String(val || "N/A")}</p>
                                  </div>
                                ))}
                              </div>
                            ) : app.customAnswers && Object.keys(app.customAnswers).length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {Object.entries(app.customAnswers).map(([label, val]: [string, any], aidx) => (
                                  <div key={aidx} className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-1">
                                    <span className="text-[10px] font-mono text-gray-500 uppercase block">{label}</span>
                                    <p className="font-sans text-white font-medium">{String(val || "N/A")}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 font-mono">No extra custom fields submitted.</p>
                            )}
                          </div>

                          {/* 2. Uploaded Images & Documents */}
                          {app.attachments && app.attachments.length > 0 && (
                            <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                              <h4 className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                <span>Uploaded Files & Images ({app.attachments.length})</span>
                              </h4>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {app.attachments.map((file: any, fidx: number) => {
                                  const isImage = file.data && (file.data.startsWith("data:image/") || file.data.includes(".jpg") || file.data.includes(".png") || file.data.includes(".webp"));
                                  return (
                                    <div
                                      key={fidx}
                                      className="p-3 bg-slate-950 rounded-xl border border-white/10 flex items-center justify-between gap-3"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {isImage ? (
                                          <img
                                            src={file.data}
                                            alt={file.name}
                                            onClick={() => setLightboxImage(file.data)}
                                            className="w-10 h-10 rounded-lg object-cover border border-white/20 shrink-0 cursor-pointer hover:opacity-80"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                                            <FileText className="h-5 w-5" />
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <p className="text-xs font-mono font-bold text-white truncate">{file.name || "Attachment"}</p>
                                          <span className="text-[10px] font-mono text-gray-400 truncate block">{file.fileName || "file"}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        {isImage && (
                                          <button
                                            type="button"
                                            onClick={() => setLightboxImage(file.data)}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                                            title="Enlarge"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <a
                                          href={file.data}
                                          download={file.fileName || file.name || "download"}
                                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400"
                                          title="Download"
                                        >
                                          <DownloadCloud className="w-3.5 h-3.5" />
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 3. Status, Remarks & Payment Actions */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-white/5">
                            
                            {/* Payment Control */}
                            <div className="space-y-3">
                              <h5 className="text-[11px] font-mono font-bold uppercase text-amber-400">
                                Payment Verification (12h Deadline)
                              </h5>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePaymentStatus(app.id, "Paid")}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold hover:bg-emerald-500/30 cursor-pointer"
                                >
                                  Mark as Paid
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePaymentStatus(app.id, "Pending")}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold hover:bg-amber-500/20 cursor-pointer"
                                >
                                  Mark Pending
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePaymentStatus(app.id, "Expired")}
                                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold hover:bg-rose-500/20 cursor-pointer"
                                >
                                  Mark Expired
                                </button>
                              </div>

                              <div className="pt-2 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const matchingInv = invoices.find(i => i.submissionId === app.id || i.invoiceId === `INV-${app.id}`);
                                    if (matchingInv) {
                                      setViewingInvoice(matchingInv);
                                    } else {
                                      // Generate temporary view from application record
                                      setViewingInvoice({
                                        invoiceId: `INV-${app.id}`,
                                        submissionId: app.id,
                                        serviceId: app.serviceId || "serv-default",
                                        serviceTitle: app.serviceTitle || "Professional Service",
                                        clientName: app.name || "Valued Client",
                                        clientEmail: app.email || "client@amitjoshi.info.np",
                                        clientPhone: app.contact || "+977 9800000000",
                                        clientAddress: app.temporaryAddress || "",
                                        amount: typeof app.amount === "number" ? app.amount : 5000,
                                        amountFormatted: app.amount || "NPR 5,000",
                                        currency: "NPR",
                                        submittedAt: app.submittedAt || app.timestamp || new Date().toISOString(),
                                        paymentDueAt: app.paymentDueAt || new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
                                        paymentStatus: app.paymentStatus || "Pending",
                                        answers: app.dynamicAnswers || app.customAnswers,
                                        attachments: app.attachments
                                      });
                                    }
                                  }}
                                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>View Bill</span>
                                </button>

                                {checkUserPermission(currentUserInfo, "editBills") && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const matchingInv = invoices.find(i => i.submissionId === app.id || i.invoiceId === `INV-${app.id}`);
                                      const baseInv = matchingInv || {
                                        invoiceId: `INV-${app.id}`,
                                        submissionId: app.id,
                                        serviceId: app.serviceId || "serv-default",
                                        serviceTitle: app.serviceTitle || "Professional Service",
                                        clientName: app.name || "Valued Client",
                                        clientEmail: app.email || "client@amitjoshi.info.np",
                                        clientPhone: app.contact || "+977 9800000000",
                                        clientAddress: app.temporaryAddress || "",
                                        amount: typeof app.amount === "number" ? app.amount : 5000,
                                        amountFormatted: app.amount || "NPR 5,000",
                                        currency: "NPR",
                                        submittedAt: app.submittedAt || app.timestamp || new Date().toISOString(),
                                        paymentDueAt: app.paymentDueAt || new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
                                        paymentStatus: app.paymentStatus || "Pending",
                                        answers: app.dynamicAnswers || app.customAnswers,
                                        attachments: app.attachments
                                      };
                                      setEditingInvoice({ ...baseInv });
                                      setIsEditingInvoiceModalOpen(true);
                                    }}
                                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Edit Bill</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Admin Remarks */}
                            <div className="space-y-2">
                              <label className="text-[11px] font-mono font-bold uppercase text-gray-400 block">
                                Admin Remarks for Customer (Visible via Status Checker)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  defaultValue={app.remarks || ""}
                                  id={`remarks-${app.id}`}
                                  placeholder="e.g. Documents verified. Processing underway..."
                                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`remarks-${app.id}`) as HTMLInputElement;
                                    handleUpdateApplicationStatus(app.id, app.status || "Submitted", input ? input.value : "");
                                  }}
                                  className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-mono font-bold cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleEditAccess(app.id, app.allowEdit || false)}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase ${
                                    app.allowEdit
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                      : "bg-white/5 text-gray-400 border border-white/10"
                                  }`}
                                >
                                  {app.allowEdit ? "🔓 Customer Edit: ON" : "🔒 Customer Edit: OFF"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem("applications", app.id)}
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: INVOICES & 12-HOUR BILLING */}
        {/* ---------------------------------------------------- */}
        {activeTab === "invoices" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <span>Invoices & Billing Ledger ({invoices.length})</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Manage digital receipts, verify payments, and export official printable invoices.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search invoice # or client..."
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 outline-none w-52"
                />

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-mono outline-none"
                >
                  <option value="all">All Invoices</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-white/5 text-gray-400 font-mono text-xs">
                No invoices recorded in Firebase yet. Invoices are automatically issued whenever a service application is submitted.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-gray-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Invoice #</th>
                      <th className="py-3 px-3">Client Details</th>
                      <th className="py-3 px-3">Service</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Payment</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredInvoices.map((inv) => {
                      const deadline = getDeadlineInfo(inv.paymentDueAt, inv.paymentStatus);
                      return (
                        <tr key={inv.invoiceId} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-3 font-bold text-amber-400 select-all">
                            {inv.invoiceId}
                          </td>
                          <td className="py-4 px-3">
                            <p className="font-sans font-bold text-white text-sm">{inv.clientName}</p>
                            <p className="text-gray-400 text-[11px]">{inv.clientPhone} &bull; {inv.clientEmail}</p>
                          </td>
                          <td className="py-4 px-3 text-gray-300 font-sans">
                            {inv.serviceTitle}
                          </td>
                          <td className="py-4 px-3 font-bold text-white">
                            {inv.amountFormatted || `NPR ${inv.amount?.toLocaleString()}`}
                          </td>
                          <td className="py-4 px-3">
                            <div className="text-gray-400 text-[11px]">
                              {inv.paymentDueAt ? new Date(inv.paymentDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                            </div>
                            <span className={`text-[10px] font-bold ${deadline.isPaid ? "text-emerald-400" : deadline.isExpired ? "text-rose-400" : "text-amber-400"}`}>
                              {deadline.text}
                            </span>
                          </td>
                          <td className="py-4 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              inv.paymentStatus === "Paid"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : deadline.isExpired
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            }`}>
                              {inv.paymentStatus || "Pending"}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setViewingInvoice(inv)}
                                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>View Bill</span>
                              </button>
                              {checkUserPermission(currentUserInfo, "editBills") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingInvoice({ ...inv });
                                    setIsEditingInvoiceModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                              )}
                              {checkUserPermission(currentUserInfo, "deleteBills") && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem("invoices", inv.invoiceId)}
                                  className="p-1.5 text-red-400 hover:text-red-300 rounded-lg"
                                  title="Delete Invoice"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: SUGGESTIONS & FEEDBACK */}
        {/* ---------------------------------------------------- */}
        {activeTab === "suggestions" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <span>Public Suggestions & Inquiries ({suggestions.length})</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Community feedback, feature inquiries, and suggestions captured across the site.
                </p>
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search feedback..."
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 outline-none w-52"
              />
            </div>

            {filteredSuggestions.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-white/5 text-gray-400 font-mono text-xs">
                No suggestions recorded in Firebase yet.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSuggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-400 select-all">
                          ID: {sug.id}
                        </span>
                        <span className="text-gray-600">&bull;</span>
                        <span className="text-[11px] font-mono text-gray-400">
                          {sug.timestamp ? new Date(sug.timestamp).toLocaleString() : "Recently"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={sug.status || "Submitted"}
                          onChange={(e) => handleUpdateSuggestionStatus(sug.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 text-amber-400 rounded-xl px-3 py-1 text-xs font-mono outline-none"
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="In Review">In Review</option>
                          <option value="Acknowledged">Acknowledged</option>
                          <option value="Resolved">Resolved</option>
                        </select>

                        {checkUserPermission(currentUserInfo, "deleteSuggestions") && (
                          <button
                            type="button"
                            onClick={() => handleDeleteItem("suggestions", sug.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 rounded-lg cursor-pointer"
                            title="Delete Suggestion"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white font-sans">{sug.name || "Community Member"}</h4>
                      <p className="text-xs text-gray-400 font-mono">{sug.contact || sug.email || "No contact info provided"}</p>
                    </div>

                    <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 text-xs font-sans text-gray-200 leading-relaxed">
                      {sug.message || sug.suggestion || "No message body"}
                    </div>

                    {/* Remarks Input */}
                    <div className="pt-2 border-t border-white/5">
                      <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block mb-1">
                        Internal Admin Remarks
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={sug.remarks || ""}
                          id={`sug-remarks-${sug.id}`}
                          placeholder="e.g. Replied via email on 2026-03-24..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(`sug-remarks-${sug.id}`) as HTMLInputElement;
                            if (el) handleUpdateSuggestionRemarks(sug.id, el.value);
                          }}
                          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-mono font-bold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: NEWSLETTER SUBSCRIBERS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "subscribers" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-400" />
                  <span>Verified Newsletter Subscribers ({subscribers.length})</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Centralized subscriber distribution list synced with Firebase.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyAllSubscriberEmails}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {bulkCopySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{bulkCopySuccess ? "Copied All!" : "Copy All Emails"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportSubscribersCSV}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter subscribers by email or name..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {filteredSubscribers.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-white/5 text-gray-400 font-mono text-xs">
                No subscribers recorded yet in Firebase.
              </div>
            ) : (
              <div className="overflow-x-auto bg-slate-900 rounded-2xl border border-white/5">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-gray-400 text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Subscriber Name</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Subscribed Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredSubscribers.map((sub, idx) => (
                      <tr key={sub.id || idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-white font-sans">
                          {sub.name || "Community Member"}
                        </td>
                        <td className="py-3 px-4 text-amber-300 font-bold">
                          <a href={`mailto:${sub.email}`} className="hover:underline">
                            {sub.email}
                          </a>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-[11px]">
                          {sub.subscribedAt || sub.timestamp || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem("subscribers", sub.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 rounded-lg cursor-pointer"
                            title="Remove Subscriber"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 6: RBAC & ADMIN USERS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "rbac" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span>Services Admin Accounts & Access Control</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Manage authorized administrator logins, 4-digit security PIN codes, and access permissions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserForm({
                    id: "",
                    username: "",
                    pin: "",
                    name: "",
                    role: "services_admin",
                    status: "active",
                    permissions: {
                      serviceRequests: true,
                      suggestions: true,
                      newsletter: true,
                      serviceConfiguration: true,
                      billing: true
                    }
                  });
                  setIsEditingUser(true);
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Admin User</span>
              </button>
            </div>

            {/* User Form Modal */}
            {isEditingUser && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h4 className="text-base font-bold text-amber-400 uppercase font-mono flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      <span>{userForm.id ? "Edit Admin User" : "Create Admin User"}</span>
                    </h4>
                    <button
                      onClick={() => setIsEditingUser(false)}
                      className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveUser} className="space-y-4 text-xs font-mono">
                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        placeholder="e.g. Services Manager"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Username *</label>
                      <input
                        type="text"
                        required
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        placeholder="e.g. loginadmin"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">4-Digit Security PIN *</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={userForm.pin}
                        onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })}
                        placeholder="••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-center font-mono text-lg tracking-widest focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Role & Account Type</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-amber-400 focus:border-amber-500 outline-none"
                      >
                        <option value="super_admin">Super Admin (Unrestricted Full Access)</option>
                        <option value="services_admin">Services Admin (Granular Permissions Below)</option>
                      </select>
                    </div>

                    {/* Fine-Grained Permissions Matrix */}
                    <div className="space-y-3 pt-2 border-t border-white/10 max-h-60 overflow-y-auto pr-1">
                      <div className="flex items-center justify-between">
                        <label className="text-amber-400 uppercase font-bold text-[11px] block">
                          Granular Permission Matrix
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const allPerms: any = {
                              serviceRequests: true,
                              suggestions: true,
                              newsletter: true,
                              serviceConfiguration: true,
                              billing: true,
                              viewServiceForms: true,
                              createServiceForms: true,
                              editServiceForms: true,
                              deleteServiceForms: true,
                              viewServiceSubmissions: true,
                              editServiceSubmissions: true,
                              deleteServiceSubmissions: true,
                              changeStatusServices: true,
                              addRemarksServices: true,
                              downloadServiceSubmissions: true,
                              viewBills: true,
                              editBills: true,
                              createBills: true,
                              deleteBills: true,
                              modifyServiceBill: true,
                              viewSuggestions: true,
                              deleteSuggestions: true,
                              changeStatusSuggestions: true,
                              addRemarksSuggestions: true,
                              viewNewsletter: true,
                              deleteNewsletter: true,
                              exportNewsletter: true,
                              manageUsers: true
                            };
                            setUserForm(prev => ({ ...prev, permissions: allPerms }));
                          }}
                          className="text-[10px] text-amber-400 hover:underline"
                        >
                          Select All
                        </button>
                      </div>
                      
                      {/* 1. Dynamic Service Forms */}
                      <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-amber-400/80 block">1. Dynamic Service Forms</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { key: "viewServiceForms", label: "View Forms" },
                            { key: "createServiceForms", label: "Create Forms" },
                            { key: "editServiceForms", label: "Edit Forms" },
                            { key: "deleteServiceForms", label: "Delete Forms" }
                          ].map(p => (
                            <label key={p.key} className="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white">
                              <input
                                type="checkbox"
                                checked={(userForm.permissions as any)?.[p.key] ?? true}
                                onChange={(e) => setUserForm(prev => ({
                                  ...prev,
                                  permissions: { ...(prev.permissions || {}), [p.key]: e.target.checked }
                                }))}
                                className="rounded bg-black border-slate-700 text-amber-500 focus:ring-0"
                              />
                              <span className="text-[11px]">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 2. Submissions Management */}
                      <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-amber-400/80 block">2. Submissions & Requests</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { key: "viewServiceSubmissions", label: "View Requests" },
                            { key: "editServiceSubmissions", label: "Edit Access" },
                            { key: "changeStatusServices", label: "Change Status" },
                            { key: "addRemarksServices", label: "Add Remarks" },
                            { key: "downloadServiceSubmissions", label: "Export CSV" },
                            { key: "deleteServiceSubmissions", label: "Delete Request" }
                          ].map(p => (
                            <label key={p.key} className="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white">
                              <input
                                type="checkbox"
                                checked={(userForm.permissions as any)?.[p.key] ?? true}
                                onChange={(e) => setUserForm(prev => ({
                                  ...prev,
                                  permissions: { ...(prev.permissions || {}), [p.key]: e.target.checked }
                                }))}
                                className="rounded bg-black border-slate-700 text-amber-500 focus:ring-0"
                              />
                              <span className="text-[11px]">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 3. Invoices & 12h Billing */}
                      <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-amber-400/80 block">3. Invoices & Billing</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { key: "viewBills", label: "View Bills" },
                            { key: "editBills", label: "Edit Bills" },
                            { key: "createBills", label: "Create Bills" },
                            { key: "deleteBills", label: "Delete Bills" }
                          ].map(p => (
                            <label key={p.key} className="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white">
                              <input
                                type="checkbox"
                                checked={(userForm.permissions as any)?.[p.key] ?? true}
                                onChange={(e) => setUserForm(prev => ({
                                  ...prev,
                                  permissions: { ...(prev.permissions || {}), [p.key]: e.target.checked }
                                }))}
                                className="rounded bg-black border-slate-700 text-amber-500 focus:ring-0"
                              />
                              <span className="text-[11px]">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 4. Feedback & Suggestions */}
                      <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-amber-400/80 block">4. Feedback & Suggestions</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { key: "viewSuggestions", label: "View Suggestions" },
                            { key: "changeStatusSuggestions", label: "Change Status" },
                            { key: "addRemarksSuggestions", label: "Add Remarks" },
                            { key: "deleteSuggestions", label: "Delete Suggestion" }
                          ].map(p => (
                            <label key={p.key} className="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white">
                              <input
                                type="checkbox"
                                checked={(userForm.permissions as any)?.[p.key] ?? true}
                                onChange={(e) => setUserForm(prev => ({
                                  ...prev,
                                  permissions: { ...(prev.permissions || {}), [p.key]: e.target.checked }
                                }))}
                                className="rounded bg-black border-slate-700 text-amber-500 focus:ring-0"
                              />
                              <span className="text-[11px]">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 5. Newsletter Subscribers */}
                      <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-amber-400/80 block">5. Newsletter Subscribers</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { key: "viewNewsletter", label: "View Subscribers" },
                            { key: "exportNewsletter", label: "Export Subscribers" },
                            { key: "deleteNewsletter", label: "Delete Subscriber" }
                          ].map(p => (
                            <label key={p.key} className="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white">
                              <input
                                type="checkbox"
                                checked={(userForm.permissions as any)?.[p.key] ?? true}
                                onChange={(e) => setUserForm(prev => ({
                                  ...prev,
                                  permissions: { ...(prev.permissions || {}), [p.key]: e.target.checked }
                                }))}
                                className="rounded bg-black border-slate-700 text-amber-500 focus:ring-0"
                              />
                              <span className="text-[11px]">{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 6. Admin User Management */}
                      <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-amber-400/80 block">6. System Admin</span>
                        <label className="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white">
                          <input
                            type="checkbox"
                            checked={(userForm.permissions as any)?.manageUsers ?? false}
                            onChange={(e) => setUserForm(prev => ({
                              ...prev,
                              permissions: { ...(prev.permissions || {}), manageUsers: e.target.checked }
                            }))}
                            className="rounded bg-black border-slate-700 text-amber-500 focus:ring-0"
                          />
                          <span className="text-[11px]">Manage Admin Accounts & PINs</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setIsEditingUser(false)}
                        className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider"
                      >
                        Save Account
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Admin Users List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(portfolioData.serviceAdminUsers || defaultPortfolioData.serviceAdminUsers || []).map((u) => (
                <div
                  key={u.id}
                  className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {u.role || "Admin"}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        ● {u.status || "Active"}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white font-serif">{u.name}</h4>
                    <p className="text-xs font-mono text-gray-400">Username: <strong className="text-white">{u.username}</strong></p>
                    <p className="text-xs font-mono text-gray-400">PIN: <span className="tracking-widest font-mono text-amber-400 font-bold">••••</span></p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setUserForm({ ...u });
                        setIsEditingUser(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 rounded-lg cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Invoice Modal */}
        {isEditingInvoiceModalOpen && editingInvoice && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-base font-bold text-amber-400 uppercase font-mono flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  <span>Edit & Update Official Bill</span>
                </h4>
                <button
                  onClick={() => {
                    setIsEditingInvoiceModalOpen(false);
                    setEditingInvoice(null);
                  }}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Invoice Number (ID)</label>
                    <input
                      type="text"
                      disabled
                      value={editingInvoice.invoiceId}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-amber-400 font-bold opacity-80 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Service Title</label>
                    <input
                      type="text"
                      required
                      value={editingInvoice.serviceTitle}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, serviceTitle: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Client Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editingInvoice.clientName}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, clientName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Client Phone *</label>
                    <input
                      type="text"
                      required
                      value={editingInvoice.clientPhone}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, clientPhone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Client Email *</label>
                    <input
                      type="email"
                      required
                      value={editingInvoice.clientEmail}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, clientEmail: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Client Address</label>
                    <input
                      type="text"
                      value={editingInvoice.clientAddress || ""}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, clientAddress: e.target.value })}
                      placeholder="e.g. Kathmandu, Nepal"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Billing Amount (NPR) *</label>
                    <input
                      type="number"
                      required
                      value={editingInvoice.amount || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEditingInvoice({
                          ...editingInvoice,
                          amount: val,
                          amountFormatted: `NPR ${val.toLocaleString()}`
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-amber-400 font-bold focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Payment Status</label>
                    <select
                      value={editingInvoice.paymentStatus || "Pending"}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, paymentStatus: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    >
                      <option value="Pending">Pending / Unpaid</option>
                      <option value="Paid">Paid (Verified)</option>
                      <option value="Expired">Expired</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-bold">Payment Due Date / 12-Hour Deadline</label>
                  <input
                    type="text"
                    value={editingInvoice.paymentDueAt || ""}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, paymentDueAt: e.target.value })}
                    placeholder="ISO Timestamp or YYYY-MM-DD HH:MM:SS"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-gray-500">Defaults to 12 hours from submission.</span>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingInvoiceModalOpen(false);
                      setEditingInvoice(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider"
                  >
                    Save Bill Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-4 text-center text-xs font-mono text-gray-500">
        Amit Joshi Official Portal &bull; Services & Billing System &bull; Realtime Cloud Database Connected
      </footer>
    </div>
  );
}
