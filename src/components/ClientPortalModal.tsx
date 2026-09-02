import React, { useState, useEffect } from "react";
import { ref, get, set, update, push } from "firebase/database";
import { db } from "../firebase";
import { ServiceInvoice, ServiceItem } from "../utils/defaultData";
import { 
  X, User, Mail, Phone, MapPin, Building, Shield, KeyRound, 
  FileText, CheckCircle2, Clock, AlertCircle, Copy, Check, 
  Download, Trash2, Plus, Receipt, ExternalLink, RefreshCw, 
  FolderArchive, Save, MessageSquare, Landmark, Briefcase, Eye
} from "lucide-react";
import InvoiceView from "./InvoiceView";

interface ClientPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableServices?: ServiceItem[];
  onRequestService?: (service: ServiceItem, clientData: ClientProfile) => void;
}

export interface ClientDocument {
  id: string;
  title: string;
  category: "Identity / Citizenship" | "Organization / PAN" | "Service Specification" | "Asset / Media" | "Other";
  fileUrl: string;
  fileType: "image" | "pdf" | "doc";
  uploadedAt: string;
  fileSizeFormatted?: string;
}

export interface ClientProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  pin: string;
  address: string;
  currentCity?: string;
  organization?: string;
  designation?: string;
  panNumber?: string;
  notes?: string;
  documents?: ClientDocument[];
  createdAt: string;
  updatedAt?: string;
}

export default function ClientPortalModal({
  isOpen,
  onClose,
  availableServices = [],
  onRequestService
}: ClientPortalModalProps) {
  // Auth state
  const [currentClient, setCurrentClient] = useState<ClientProfile | null>(() => {
    try {
      const saved = localStorage.getItem("client_vault_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [activePortalTab, setActivePortalTab] = useState<"services" | "vault">("services");

  // Login Form
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration Form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regOrg, setRegOrg] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Client Data & Submissions
  const [clientSubmissions, setClientSubmissions] = useState<any[]>([]);
  const [clientInvoices, setClientInvoices] = useState<ServiceInvoice[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Follow-up Note Form
  const [selectedSubForNote, setSelectedSubForNote] = useState<any | null>(null);
  const [clientFollowUpNote, setClientFollowUpNote] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  // Invoice Modal
  const [viewingInvoice, setViewingInvoice] = useState<ServiceInvoice | null>(null);

  // Personal Vault Form (when editing personal profile)
  const [vaultProfile, setVaultProfile] = useState<ClientProfile | null>(null);
  const [vaultSaveSuccess, setVaultSaveSuccess] = useState(false);

  // Document Upload in Vault
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<ClientDocument["category"]>("Identity / Citizenship");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Toast / Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync vault profile when current client changes
  useEffect(() => {
    if (currentClient) {
      setVaultProfile(currentClient);
      fetchClientData(currentClient);
    }
  }, [currentClient?.id]);

  const fetchClientData = async (client: ClientProfile) => {
    setDataLoading(true);
    try {
      // 1. Fetch from service_applications
      const appSnap = await get(ref(db, "service_applications"));
      let matches: any[] = [];

      const clientEmailLower = (client.email || "").toLowerCase().trim();
      const clientPhoneClean = (client.phone || "").replace(/[^0-9]/g, "");
      const clientNameLower = (client.fullName || "").toLowerCase().trim();

      if (appSnap.exists()) {
        const val = appSnap.val();
        Object.keys(val).forEach((key) => {
          const item = { id: key, ...val[key] };
          const itemEmail = (item.email || "").toLowerCase().trim();
          const itemPhone = (item.phone || "").replace(/[^0-9]/g, "");
          const itemName = (item.fullName || "").toLowerCase().trim();
          const itemPin = (item.securityPin || "").trim();

          const isMatch =
            (itemEmail && itemEmail === clientEmailLower) ||
            (clientPhoneClean && itemPhone && itemPhone.includes(clientPhoneClean.slice(-8))) ||
            (itemPin && client.pin && itemPin === client.pin && itemName === clientNameLower);

          if (isMatch) {
            matches.push(item);
          }
        });
      }

      // Also check legacy applications node
      const legacySnap = await get(ref(db, "applications"));
      if (legacySnap.exists()) {
        const val = legacySnap.val();
        Object.keys(val).forEach((key) => {
          const item = { id: key, ...val[key] };
          const itemEmail = (item.email || "").toLowerCase().trim();
          if (itemEmail && itemEmail === clientEmailLower && !matches.some((m) => m.id === key)) {
            matches.push(item);
          }
        });
      }

      matches.sort(
        (a, b) =>
          new Date(b.submittedAt || b.timestamp || 0).getTime() -
          new Date(a.submittedAt || a.timestamp || 0).getTime()
      );
      setClientSubmissions(matches);

      // 2. Fetch Invoices for these submissions
      const invSnap = await get(ref(db, "invoices"));
      let myInvoices: ServiceInvoice[] = [];
      if (invSnap.exists()) {
        const val = invSnap.val();
        Object.keys(val).forEach((key) => {
          const inv: ServiceInvoice = { invoiceId: key, ...val[key] };
          const isInvMatch =
            matches.some((m) => m.id === inv.submissionId || m.invoiceId === inv.invoiceId) ||
            (inv.clientEmail && inv.clientEmail.toLowerCase() === clientEmailLower);
          if (isInvMatch) {
            myInvoices.push(inv);
          }
        });
      }
      setClientInvoices(myInvoices);
    } catch (err) {
      console.error("Error fetching client data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  // Handle Client Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const idInput = loginIdentifier.trim();
      const idInputLower = idInput.toLowerCase();
      const pinInput = loginPin.trim();

      // 1. Check in client_profiles
      const profileSnap = await get(ref(db, "client_profiles"));
      if (profileSnap.exists()) {
        const profiles = profileSnap.val();
        for (const pid of Object.keys(profiles)) {
          const p = profiles[pid];
          const emailMatch = p.email && p.email.toLowerCase() === idInputLower;
          const phoneMatch = p.phone && p.phone.replace(/[^0-9]/g, "") === idInput.replace(/[^0-9]/g, "");
          const nameMatch = p.fullName && p.fullName.toLowerCase() === idInputLower;

          if ((emailMatch || phoneMatch || nameMatch) && p.pin === pinInput) {
            const loggedInClient: ClientProfile = { id: pid, ...p };
            setCurrentClient(loggedInClient);
            localStorage.setItem("client_vault_session", JSON.stringify(loggedInClient));
            setLoginLoading(false);
            return;
          }
        }
      }

      // 2. If not found in client_profiles, check in service_applications by PIN or Request ID
      const appSnap = await get(ref(db, "service_applications"));
      if (appSnap.exists()) {
        const apps = appSnap.val();
        for (const aid of Object.keys(apps)) {
          const a = apps[aid];
          const isReqIdMatch = aid.toUpperCase() === idInput.toUpperCase();
          const emailMatch = a.email && a.email.toLowerCase() === idInputLower;
          const nameMatch = a.fullName && a.fullName.toLowerCase() === idInputLower;
          const pinMatch = (!a.securityPin && pinInput === "1234") || a.securityPin === pinInput;

          if ((isReqIdMatch || emailMatch || nameMatch) && pinMatch) {
            // Auto-create client profile from this application
            const newClientProfile: ClientProfile = {
              id: `client-${Date.now()}`,
              fullName: a.fullName || idInput,
              email: a.email || `${aid.toLowerCase()}@client.portal`,
              phone: a.phone || "",
              pin: pinInput || "1234",
              address: a.address || "",
              organization: a.answers?.["q-1"]?.value || "",
              createdAt: new Date().toISOString(),
              documents: []
            };

            await set(ref(db, `client_profiles/${newClientProfile.id}`), newClientProfile);
            setCurrentClient(newClientProfile);
            localStorage.setItem("client_vault_session", JSON.stringify(newClientProfile));
            setLoginLoading(false);
            return;
          }
        }
      }

      setLoginError("Invalid credentials. Please verify your Email/Phone/Request ID and 4-Digit Security PIN.");
    } catch (err: any) {
      setLoginError("Login failed: " + (err.message || "Network error."));
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Client Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!regName.trim()) {
      setRegError("Full legal name is required.");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setRegError("A valid email address is required.");
      return;
    }
    if (!regPin.trim() || regPin.trim().length !== 4) {
      setRegError("Please set a 4-digit security PIN for your client vault.");
      return;
    }

    setRegLoading(true);
    try {
      const clientId = `client-${Date.now()}`;
      const newProfile: ClientProfile = {
        id: clientId,
        fullName: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
        pin: regPin.trim(),
        address: regAddress.trim(),
        organization: regOrg.trim(),
        createdAt: new Date().toISOString(),
        documents: []
      };

      await set(ref(db, `client_profiles/${clientId}`), newProfile);
      setCurrentClient(newProfile);
      localStorage.setItem("client_vault_session", JSON.stringify(newProfile));
      setRegLoading(false);
    } catch (err: any) {
      setRegError("Registration error: " + err.message);
      setRegLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentClient(null);
    localStorage.removeItem("client_vault_session");
    setClientSubmissions([]);
    setClientInvoices([]);
  };

  // Save Personal Vault Profile Changes
  const handleSaveVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultProfile) return;

    try {
      const updated: ClientProfile = {
        ...vaultProfile,
        updatedAt: new Date().toISOString()
      };

      await set(ref(db, `client_profiles/${updated.id}`), updated);
      setCurrentClient(updated);
      localStorage.setItem("client_vault_session", JSON.stringify(updated));
      setVaultSaveSuccess(true);
      setTimeout(() => setVaultSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving vault:", err);
    }
  };

  // Upload Document to Personal Vault
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultProfile || !newDocTitle.trim() || !newDocUrl.trim()) return;

    setIsUploadingDoc(true);
    try {
      const newDoc: ClientDocument = {
        id: `doc-${Date.now()}`,
        title: newDocTitle.trim(),
        category: newDocCategory,
        fileUrl: newDocUrl.trim(),
        fileType: newDocUrl.toLowerCase().includes(".pdf") ? "pdf" : "image",
        uploadedAt: new Date().toISOString()
      };

      const updatedDocs = [...(vaultProfile.documents || []), newDoc];
      const updatedProfile = { ...vaultProfile, documents: updatedDocs };

      await set(ref(db, `client_profiles/${vaultProfile.id}`), updatedProfile);
      setVaultProfile(updatedProfile);
      setCurrentClient(updatedProfile);
      localStorage.setItem("client_vault_session", JSON.stringify(updatedProfile));

      setNewDocTitle("");
      setNewDocUrl("");
    } catch (err) {
      console.error("Error adding doc:", err);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Delete Document from Personal Vault
  const handleDeleteDoc = async (docId: string) => {
    if (!vaultProfile) return;
    const updatedDocs = (vaultProfile.documents || []).filter((d) => d.id !== docId);
    const updatedProfile = { ...vaultProfile, documents: updatedDocs };

    await set(ref(db, `client_profiles/${vaultProfile.id}`), updatedProfile);
    setVaultProfile(updatedProfile);
    setCurrentClient(updatedProfile);
    localStorage.setItem("client_vault_session", JSON.stringify(updatedProfile));
  };

  // Send Client Follow-up Note for a service submission
  const handleSendFollowUpNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForNote || !clientFollowUpNote.trim()) return;

    setNoteSubmitting(true);
    try {
      const subId = selectedSubForNote.id;
      const noteEntry = {
        id: `note-${Date.now()}`,
        from: "client",
        clientName: currentClient?.fullName || "Client",
        message: clientFollowUpNote.trim(),
        timestamp: new Date().toISOString()
      };

      const notesRef = ref(db, `service_applications/${subId}/clientMessages`);
      await push(notesRef, noteEntry);

      setNoteSuccess(true);
      setClientFollowUpNote("");
      setTimeout(() => {
        setNoteSuccess(false);
        setSelectedSubForNote(null);
        if (currentClient) fetchClientData(currentClient);
      }, 1800);
    } catch (err) {
      console.error("Error sending follow-up note:", err);
    } finally {
      setNoteSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-950/90 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-white font-serif">
                  Client Portal & Personal Data Vault
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Client Self-Service
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                View taken services, track real-time delivery status, inspect invoices, and securely manage your personal data.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentClient && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 border border-white/10 text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                title="Log out of Client Vault"
              >
                <span>Log Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        {!currentClient ? (
          /* ======================================================= */
          /* AUTHENTICATION VIEW: LOGIN & REGISTRATION               */
          /* ======================================================= */
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
            {/* Tab switch */}
            <div className="flex max-w-md mx-auto p-1 bg-slate-950 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => { setAuthMode("login"); setLoginError(""); }}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  authMode === "login"
                    ? "bg-cyan-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Client Login (PIN)
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("register"); setRegError(""); }}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  authMode === "register"
                    ? "bg-cyan-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                New Client Vault Setup
              </button>
            </div>

            {authMode === "login" ? (
              <div className="max-w-md mx-auto bg-slate-950/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="text-center space-y-1">
                  <KeyRound className="w-8 h-8 text-cyan-400 mx-auto" />
                  <h4 className="text-base font-bold text-white font-serif">Access Your Client Vault</h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Enter your Registered Email, Phone, or Request Token (e.g. REQ-7B291) with your 4-digit PIN.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Email / Phone / Request ID *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. bikash.sharma@moest.gov.np or REQ-7B291"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-white focus:border-cyan-500 outline-none"
                      />
                      <User className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">4-Digit Security PIN *</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={loginPin}
                        onChange={(e) => setLoginPin(e.target.value)}
                        placeholder="••••"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-white text-center font-mono tracking-widest text-base focus:border-cyan-500 outline-none"
                      />
                      <KeyRound className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                    </div>
                    <p className="text-[10px] text-gray-500 text-right">Default seed PINs: 1234, 4321, 5678, 8888, 9999</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    {loginLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Vault...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Open My Client Portal</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="max-w-lg mx-auto bg-slate-950/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="text-center space-y-1">
                  <Building className="w-8 h-8 text-cyan-400 mx-auto" />
                  <h4 className="text-base font-bold text-white font-serif">Setup Your Client Vault</h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Store your personal data once. Easily requisition services, store company assets, and track progress.
                  </p>
                </div>

                {regError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Bikash Sharma"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. client@organization.np"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+977 98XXXXXXXX"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">4-Digit Security PIN *</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value)}
                        placeholder="e.g. 5678"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono tracking-widest text-center focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Organization (Optional)</label>
                      <input
                        type="text"
                        value={regOrg}
                        onChange={(e) => setRegOrg(e.target.value)}
                        placeholder="e.g. Ministry of Education / Acme Ltd."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Address / City</label>
                      <input
                        type="text"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="Kathmandu, Nepal"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    {regLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating Personal Vault...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Create Client Vault & Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* ======================================================= */
          /* LOGGED IN CLIENT HUB: SERVICES & PERSONAL DATA VAULT    */
          /* ======================================================= */
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Client Banner */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-white font-serif">{currentClient.fullName}</span>
                  {currentClient.organization && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-cyan-300 border border-white/10">
                      {currentClient.organization}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Vault</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono flex items-center gap-3">
                  <span>{currentClient.email}</span>
                  {currentClient.phone && <span>• {currentClient.phone}</span>}
                  {currentClient.address && <span>• {currentClient.address}</span>}
                </p>
              </div>

              {/* Portal Navigation Tabs */}
              <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActivePortalTab("services")}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activePortalTab === "services"
                      ? "bg-cyan-500 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>My Taken Services ({clientSubmissions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePortalTab("vault")}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activePortalTab === "vault"
                      ? "bg-cyan-500 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>Personal Data Vault</span>
                </button>
              </div>
            </div>

            {/* TAB 1: MY TAKEN & REQUESTED SERVICES */}
            {activePortalTab === "services" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-white font-serif flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-cyan-400" />
                      <span>Services Taken & Delivery Status</span>
                    </h4>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      Track the active milestones, progress notes, official bills, and communicate directly regarding your requests.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (availableServices.length > 0 && onRequestService && currentClient) {
                        onClose();
                        onRequestService(availableServices[0], currentClient);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Request Another Service</span>
                  </button>
                </div>

                {dataLoading ? (
                  <div className="p-12 text-center text-gray-400 font-mono text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Loading your service records...</span>
                  </div>
                ) : clientSubmissions.length === 0 ? (
                  <div className="p-12 bg-slate-950/40 border border-white/5 rounded-3xl text-center space-y-4">
                    <FileText className="w-10 h-10 text-gray-600 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white font-mono">No Service Requisitions Found</p>
                      <p className="text-xs text-gray-400 font-mono">
                        You have not submitted any service inquiries under this profile yet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientSubmissions.map((sub) => {
                      const matchedInvoice = clientInvoices.find(
                        (inv) => inv.submissionId === sub.id || inv.invoiceId === sub.invoiceId
                      );

                      const isGov = sub.serviceCategory === "Government" || sub.serviceTitle?.includes("Government");

                      return (
                        <div
                          key={sub.id}
                          className="bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-cyan-500/40 transition-all shadow-md"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-white font-serif">{sub.serviceTitle}</span>
                                {isGov ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                                    <Landmark className="w-3 h-3" />
                                    <span>Government</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    <span>Private</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400">
                                <span>Token: <strong className="text-cyan-400">{sub.id}</strong></span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(sub.id, sub.id)}
                                  className="text-gray-500 hover:text-white"
                                  title="Copy Request Token"
                                >
                                  {copiedId === sub.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <span>• Submitted: {new Date(sub.submittedAt || sub.timestamp || "").toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Status Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                                  sub.status === "Approved" || sub.status === "Completed"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : sub.status === "In Progress"
                                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                                    : sub.status === "In Review"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                }`}
                              >
                                ● {sub.status || "In Review"}
                              </span>

                              {sub.billingStatus === "Paid" ? (
                                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  ✓ Bill Paid
                                </span>
                              ) : sub.billingStatus === "Billed" ? (
                                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Bill Pending
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-gray-400">
                                  Unbilled
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Admin Remarks / Progress */}
                          {sub.remarks && (
                            <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl space-y-1">
                              <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Official Engineering Remarks & Status Update:</span>
                              </span>
                              <p className="text-xs text-gray-300 font-mono leading-relaxed">{sub.remarks}</p>
                            </div>
                          )}

                          {/* Submitted Answers Grid */}
                          {sub.answers && Object.keys(sub.answers).length > 0 && (
                            <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-2">
                              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">Project Details:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                                {Object.keys(sub.answers).map((k) => {
                                  const ans = sub.answers[k];
                                  if (!ans || !ans.value) return null;
                                  return (
                                    <div key={k} className="p-2 bg-black/30 rounded-lg">
                                      <span className="text-gray-400 text-[10px] block">{ans.label || k}</span>
                                      <span className="text-white font-medium">{String(ans.value)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Action Row: Invoice & Follow-up */}
                          <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              {matchedInvoice && (
                                <button
                                  type="button"
                                  onClick={() => setViewingInvoice(matchedInvoice)}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>View Official Bill ({matchedInvoice.amountFormatted})</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedSubForNote(sub)}
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Message Engineer Regarding This Service</span>
                              </button>
                            </div>

                            {sub.amountFormatted && (
                              <span className="text-xs font-mono font-bold text-gray-400">
                                Estimated Total: <strong className="text-white">{sub.amountFormatted}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PERSONAL DATA VAULT */}
            {activePortalTab === "vault" && vaultProfile && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h4 className="text-base font-bold text-white font-serif flex items-center gap-2">
                    <FolderArchive className="w-4 h-4 text-cyan-400" />
                    <span>Personal Data Vault & Asset Storage</span>
                  </h4>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    Manage your personal profile, tax registration, and store organizational assets, ID documents, and technical briefs.
                  </p>
                </div>

                {vaultSaveSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Personal Data Vault updated and synchronized securely.</span>
                  </div>
                )}

                {/* Profile Form */}
                <form onSubmit={handleSaveVault} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs font-mono">
                  <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Client Identity & Legal Particulars
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        value={vaultProfile.fullName}
                        onChange={(e) => setVaultProfile({ ...vaultProfile, fullName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={vaultProfile.email}
                        onChange={(e) => setVaultProfile({ ...vaultProfile, email: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Phone Number</label>
                      <input
                        type="text"
                        value={vaultProfile.phone}
                        onChange={(e) => setVaultProfile({ ...vaultProfile, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Organization / Entity</label>
                      <input
                        type="text"
                        value={vaultProfile.organization || ""}
                        onChange={(e) => setVaultProfile({ ...vaultProfile, organization: e.target.value })}
                        placeholder="Company or Government Dept."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">Designation / Department</label>
                      <input
                        type="text"
                        value={vaultProfile.designation || ""}
                        onChange={(e) => setVaultProfile({ ...vaultProfile, designation: e.target.value })}
                        placeholder="e.g. Director of Technology"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">PAN / Tax Registration Number</label>
                      <input
                        type="text"
                        value={vaultProfile.panNumber || ""}
                        onChange={(e) => setVaultProfile({ ...vaultProfile, panNumber: e.target.value })}
                        placeholder="e.g. 601294829"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-gray-400 uppercase font-bold">Official / Permanent Address</label>
                      <input
                        type="text"
                        value={vaultProfile.address}
                        onChange={(e) => setVaultProfile({ ...vaultProfile, address: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 uppercase font-bold">4-Digit Security PIN</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={vaultProfile.pin}
                        onChange={(e) => setVaultProfile({ ...vaultProfile, pin: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono tracking-widest text-center focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save & Synchronize Personal Vault</span>
                    </button>
                  </div>
                </form>

                {/* Document & Asset Storage Section */}
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 text-xs font-mono">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                        Stored Personal Assets & Verification Documents
                      </h5>
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        Store brand logos, technical briefs, citizenship copies, and TORs for quick reuse in any service requisition.
                      </p>
                    </div>
                    <span className="text-gray-500">{(vaultProfile.documents || []).length} items stored</span>
                  </div>

                  {/* Add Document Sub-form */}
                  <form onSubmit={handleAddDocument} className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                    <span className="text-[10px] font-mono uppercase font-bold text-gray-300 block">
                      + Store New Document or Asset Link
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-gray-400 uppercase font-bold text-[10px]">Document Title *</label>
                        <input
                          type="text"
                          required
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          placeholder="e.g. Official PAN Certificate / Company Logo"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-400 uppercase font-bold text-[10px]">Category *</label>
                        <select
                          value={newDocCategory}
                          onChange={(e) => setNewDocCategory(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 outline-none"
                        >
                          <option value="Identity / Citizenship">Identity / Citizenship</option>
                          <option value="Organization / PAN">Organization / PAN</option>
                          <option value="Service Specification">Service Specification</option>
                          <option value="Asset / Media">Asset / Media</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-400 uppercase font-bold text-[10px]">Asset URL / Image Link *</label>
                        <input
                          type="text"
                          required
                          value={newDocUrl}
                          onChange={(e) => setNewDocUrl(e.target.value)}
                          placeholder="https://... or data:image/..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isUploadingDoc}
                        className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Personal Vault</span>
                      </button>
                    </div>
                  </form>

                  {/* Documents List */}
                  {(vaultProfile.documents || []).length === 0 ? (
                    <p className="text-gray-500 text-center py-4 italic">No stored documents in vault yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {(vaultProfile.documents || []).map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 bg-slate-900 border border-white/5 rounded-xl space-y-2 flex flex-col justify-between"
                        >
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-white/5 text-cyan-400 border border-white/5">
                              {doc.category}
                            </span>
                            <h6 className="font-bold text-white text-xs truncate" title={doc.title}>{doc.title}</h6>
                            <p className="text-[10px] text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                          </div>

                          {doc.fileUrl && doc.fileType === "image" && (
                            <div className="w-full h-24 bg-black rounded-lg overflow-hidden border border-white/5">
                              <img src={doc.fileUrl} alt={doc.title} className="w-full h-full object-cover" />
                            </div>
                          )}

                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View File</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                              title="Delete from Vault"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Client Follow-Up Note to Engineer */}
        {selectedSubForNote && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-sm font-bold text-cyan-400 uppercase font-mono flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Message Regarding Service</span>
                </h4>
                <button
                  onClick={() => setSelectedSubForNote(null)}
                  className="p-1 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-300 font-mono">
                Inquiring about: <strong className="text-white">{selectedSubForNote.serviceTitle}</strong> ({selectedSubForNote.id})
              </p>

              {noteSuccess ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Message sent to Amit Joshi. You will receive an update shortly.</span>
                </div>
              ) : (
                <form onSubmit={handleSendFollowUpNote} className="space-y-3 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-gray-400 uppercase font-bold">Your Query / Project Note *</label>
                    <textarea
                      rows={4}
                      required
                      value={clientFollowUpNote}
                      onChange={(e) => setClientFollowUpNote(e.target.value)}
                      placeholder="e.g. We have uploaded our revised API credentials to our Personal Vault. Please review milestone 1..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSubForNote(null)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={noteSubmitting}
                      className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider"
                    >
                      {noteSubmitting ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Digital Invoice View */}
        {viewingInvoice && (
          <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950">
            <InvoiceView 
              invoice={viewingInvoice} 
              onBack={() => setViewingInvoice(null)} 
              isAdmin={false} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
