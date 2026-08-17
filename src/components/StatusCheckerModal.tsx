import React, { useState } from "react";
import { 
  Search, X, CheckCircle2, Clock, AlertCircle, FileText, Printer, 
  MessageSquare, ShieldCheck, User, Phone, Mail, MapPin, Edit3, 
  Save, Receipt, Copy, Check, ExternalLink, DownloadCloud, Image as ImageIcon
} from "lucide-react";
import { ref, get, update } from "firebase/database";
import { db } from "../firebase";
import { ServiceInvoice } from "../utils/defaultData";
import InvoiceView from "./InvoiceView";

interface StatusCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  logoUrl?: string;
  faviconUrl?: string;
  initialReqId?: string;
}

export default function StatusCheckerModal({
  isOpen,
  onClose,
  logoUrl,
  faviconUrl,
  initialReqId = ""
}: StatusCheckerModalProps) {
  const [searchId, setSearchId] = useState(initialReqId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [type, setType] = useState<"service" | "suggestion" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<ServiceInvoice | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = searchId.trim().toUpperCase();
    if (!cleanId) {
      setErrorMsg("Please enter a valid Unique ID / Token.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setResult(null);
    setType(null);
    setShowInvoiceModal(false);
    setInvoiceData(null);
    setIsEditing(false);
    setEditForm(null);

    try {
      // 1. Check direct service_applications
      const appRef = ref(db, `service_applications/${cleanId}`);
      const appSnap = await get(appRef);

      if (appSnap.exists()) {
        const data = appSnap.val();
        setResult(data);
        setType("service");
        
        // Fetch matching invoice
        const invSnap = await get(ref(db, `invoices/INV-${cleanId}`));
        if (invSnap.exists()) {
          setInvoiceData(invSnap.val());
        } else {
          setInvoiceData({
            invoiceId: `INV-${cleanId}`,
            submissionId: cleanId,
            serviceId: data.serviceId || "serv-default",
            serviceTitle: data.serviceTitle || "Professional Service",
            clientName: data.name || "Valued Client",
            clientEmail: data.email || "",
            clientPhone: data.contact || "",
            clientAddress: data.temporaryAddress || data.address || "",
            amount: typeof data.amountNum === "number" ? data.amountNum : 5000,
            amountFormatted: data.amount || "NPR 5,000",
            currency: "NPR",
            submittedAt: data.submittedAt || data.timestamp || new Date().toISOString(),
            paymentDueAt: data.paymentDueAt || new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
            paymentStatus: data.paymentStatus || "Pending",
            answers: data.dynamicAnswers || data.customAnswers,
            attachments: data.attachments
          });
        }
        setLoading(false);
        return;
      }

      // 2. Check suggestions
      const sugRef = ref(db, `suggestions/${cleanId}`);
      const sugSnap = await get(sugRef);

      if (sugSnap.exists()) {
        setResult(sugSnap.val());
        setType("suggestion");
        setLoading(false);
        return;
      }

      // 3. Fallback scan inside service_applications collection
      const allAppsSnap = await get(ref(db, "service_applications"));
      if (allAppsSnap.exists()) {
        const apps = Object.values(allAppsSnap.val() || {}) as any[];
        const matched = apps.find(a => a && a.id && a.id.trim().toUpperCase() === cleanId);
        if (matched) {
          setResult(matched);
          setType("service");
          setLoading(false);
          return;
        }
      }

      // 4. Fallback scan inside suggestions
      const allSugsSnap = await get(ref(db, "suggestions"));
      if (allSugsSnap.exists()) {
        const sugs = Object.values(allSugsSnap.val() || {}) as any[];
        const matched = sugs.find(s => s && s.id && s.id.trim().toUpperCase() === cleanId);
        if (matched) {
          setResult(matched);
          setType("suggestion");
          setLoading(false);
          return;
        }
      }

      setErrorMsg(`No record found with ID "${cleanId}". Please double-check your Token.`);
    } catch (err) {
      console.error("Error checking status:", err);
      setErrorMsg("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (!result?.id) return;
    navigator.clipboard.writeText(result.id);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const getStatusBadge = (status: string = "Submitted") => {
    switch (status.toLowerCase()) {
      case "approved":
      case "completed":
      case "resolved":
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{status}</span>
          </span>
        );
      case "in progress":
      case "in review":
      case "under review":
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Clock className="h-3.5 w-3.5 animate-spin" />
            <span>{status}</span>
          </span>
        );
      case "rejected":
      case "cancelled":
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{status}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Clock className="h-3.5 w-3.5" />
            <span>{status}</span>
          </span>
        );
    }
  };

  const handleStartEdit = () => {
    if (!result) return;
    setEditForm({
      name: result.name || result.fullName || "",
      contact: result.contact || result.phone || "",
      email: result.email || result.gmail || "",
      address: result.address || result.temporaryAddress || ""
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!result || !editForm) return;
    setLoading(true);
    try {
      const updates = {
        name: editForm.name,
        fullName: editForm.name,
        contact: editForm.contact,
        phone: editForm.contact,
        email: editForm.email,
        gmail: editForm.email,
        address: editForm.address,
        temporaryAddress: editForm.address,
        updatedAt: new Date().toISOString()
      };

      const path = type === "service" ? `service_applications/${result.id}` : `suggestions/${result.id}`;
      await update(ref(db, path), updates);
      setResult({ ...result, ...updates });
      setIsEditing(false);
    } catch (err) {
      console.error("Save edit failed:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 12-Hour Countdown calculation
  const getDeadlineText = (dueAtStr?: string, paymentStatus?: string) => {
    if (paymentStatus === "Paid") return "Paid & Verified";
    if (!dueAtStr) return "Standard Window";

    const diff = new Date(dueAtStr).getTime() - Date.now();
    if (diff <= 0) return "12h Window Expired / Overdue";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0c101d] border border-cyan-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl space-y-6 overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Title */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
              Live Status & Verification Portal
            </span>
          </div>
          <h3 className="text-xl font-bold text-white font-sans">
            Track Requisition or Public Feedback
          </h3>
          <p className="text-xs text-gray-400">
            Enter your unique Tracking Token (e.g. <span className="font-mono text-cyan-300 font-bold">REQ-XXXXX</span> or <span className="font-mono text-purple-300 font-bold">SUG-XXXXX</span>) to view real-time processing status and download invoices.
          </p>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            required
            value={searchId}
            onChange={(e) => setSearchId(e.target.value.toUpperCase())}
            placeholder="e.g. REQ-8A4C2"
            className="flex-1 bg-white/5 border border-cyan-500/30 rounded-2xl px-4 py-3 text-sm text-cyan-300 font-mono placeholder-gray-500 focus:outline-none focus:border-cyan-400 uppercase tracking-wider"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20"
          >
            {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>Check</span>
          </button>
        </form>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-mono text-rose-300 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Search Results Display */}
        {result && (
          <div className="space-y-6 pt-4 border-t border-white/10 animate-in fade-in duration-300">
            
            {/* Header info card */}
            <div className="p-5 bg-white/[0.02] border border-cyan-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                    {type === "service" ? "Service Requisition" : "Public Feedback / Suggestion"}
                  </span>
                  <span className="text-xs font-mono text-gray-500">&bull;</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-mono font-bold text-amber-400 select-all">
                      {result.id}
                    </span>
                    <button
                      type="button"
                      onClick={copyToken}
                      className="text-gray-400 hover:text-amber-400 p-0.5"
                      title="Copy Token"
                    >
                      {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {result.serviceTitle || result.subject || result.category || "Official Application"}
                </h3>
              </div>

              <div className="flex items-center space-x-3">
                {getStatusBadge(result.status || "Submitted")}
              </div>
            </div>

            {/* 12-Hour Payment Banner (If Service) */}
            {type === "service" && (
              <div className="p-4 bg-black/40 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">12-Hour Payment Status</span>
                  <span className={`font-bold ${result.paymentStatus === "Paid" ? "text-emerald-400" : "text-amber-400"}`}>
                    {result.paymentStatus || "Pending"} &bull; {getDeadlineText(result.paymentDueAt, result.paymentStatus)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {invoiceData && (
                    <button
                      type="button"
                      onClick={() => setShowInvoiceModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Official Bill</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Admin Remarks for Applicant */}
            {result.remarks && (
              <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 tracking-wider">
                  Admin Response & Remarks:
                </span>
                <p className="text-xs font-sans text-gray-200 leading-relaxed">
                  {result.remarks}
                </p>
              </div>
            )}

            {/* Dynamic Answers Preview */}
            {result.dynamicAnswers && Object.keys(result.dynamicAnswers).length > 0 && (
              <div className="space-y-2 bg-black/30 p-4 rounded-2xl border border-white/5 font-mono text-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-2">
                  Submitted Question Answers:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(result.dynamicAnswers).map(([key, val]: [string, any], didx) => (
                    <div key={didx} className="p-2.5 bg-slate-950/60 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-500 uppercase block">{key}</span>
                      <span className="font-sans text-white text-xs font-medium">{String(val || "N/A")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applicant Metadata Overview */}
            {isEditing ? (
              <div className="p-5 bg-black/60 border border-cyan-500/40 rounded-2xl space-y-4 font-mono text-xs">
                <h4 className="font-bold uppercase text-cyan-400 flex items-center space-x-2">
                  <Edit3 className="h-4 w-4" />
                  <span>Update Contact Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-400 font-bold block">Applicant Full Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-400 font-bold block">Phone / Mobile</label>
                    <input
                      type="text"
                      value={editForm.contact}
                      onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-400 font-bold block">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-400 font-bold block">Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase flex items-center space-x-1">
                    <User className="h-3 w-3 text-cyan-400" />
                    <span>Applicant</span>
                  </div>
                  <div className="font-bold text-white truncate">{result.name || result.fullName || "N/A"}</div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase flex items-center space-x-1">
                    <Phone className="h-3 w-3 text-cyan-400" />
                    <span>Contact</span>
                  </div>
                  <div className="font-bold text-white truncate">{result.contact || result.phone || "N/A"}</div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase flex items-center space-x-1">
                    <Mail className="h-3 w-3 text-cyan-400" />
                    <span>Email</span>
                  </div>
                  <div className="font-bold text-white truncate">{result.email || result.gmail || "N/A"}</div>
                </div>
              </div>
            )}

            {/* Editable Option if Allowed by Admin */}
            {result.allowEdit && !isEditing && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Update Contact Information</span>
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Full Screen Invoice Modal */}
      {showInvoiceModal && invoiceData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950">
          <InvoiceView
            invoice={invoiceData}
            onBack={() => setShowInvoiceModal(false)}
            isAdmin={false}
          />
        </div>
      )}

    </div>
  );
}
