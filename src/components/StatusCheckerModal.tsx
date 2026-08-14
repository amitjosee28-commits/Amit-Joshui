import React, { useState } from "react";
import { Search, X, CheckCircle2, Clock, AlertCircle, FileText, Printer, MessageSquare, ShieldCheck, User, Phone, Mail, MapPin, Edit3, Save } from "lucide-react";
import { ref, get, update } from "firebase/database";
import { db } from "../firebase";

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
  const [showBillReceipt, setShowBillReceipt] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = searchId.trim().toUpperCase();
    if (!cleanId) {
      setErrorMsg("Please enter a valid Unique ID.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setResult(null);
    setType(null);
    setShowBillReceipt(false);
    setIsEditing(false);
    setEditForm(null);

    try {
      // 1. Try fetching directly from service_applications by ID
      const appRef = ref(db, `service_applications/${cleanId}`);
      const appSnap = await get(appRef);

      if (appSnap.exists()) {
        setResult(appSnap.val());
        setType("service");
        setLoading(false);
        return;
      }

      // 2. Try fetching directly from suggestions by ID
      const sugRef = ref(db, `suggestions/${cleanId}`);
      const sugSnap = await get(sugRef);

      if (sugSnap.exists()) {
        setResult(sugSnap.val());
        setType("suggestion");
        setLoading(false);
        return;
      }

      // 3. Fallback: Search inside service_applications array for matching ID
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

      // 4. Fallback: Search inside suggestions array for matching ID
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

      // If not found anywhere
      setErrorMsg(`No application or suggestion found with ID "${cleanId}". Please verify your Request ID.`);
    } catch (err) {
      console.error("Error checking status:", err);
      setErrorMsg("Failed to fetch status from network. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string = "Pending") => {
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
      case "acknowledged":
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Clock className="h-3.5 w-3.5 animate-spin" />
            <span>{status}</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40">
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

  const handlePrint = () => {
    window.print();
  };

  const handleStartEdit = () => {
    if (!result) return;
    setEditForm({
      name: result.name || "",
      temporaryAddress: result.temporaryAddress || "",
      contact: result.contact || "",
      email: result.email || result.gmail || "",
      notes: result.userNotes || ""
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!result || !result.id) return;
    try {
      setLoading(true);
      const endpoint = type === "service" ? `service_applications/${result.id}` : `suggestions/${result.id}`;
      const itemRef = ref(db, endpoint);
      
      const updates: any = {
        name: editForm.name,
        temporaryAddress: editForm.temporaryAddress,
        contact: editForm.contact,
        email: editForm.email,
        gmail: editForm.email,
        userNotes: editForm.notes,
        lastModified: new Date().toISOString()
      };

      await update(itemRef, updates);
      setResult({ ...result, ...updates });
      setIsEditing(false);
      alert("Application details updated successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to update records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0d0f18] border border-cyan-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl space-y-6 overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Search className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold font-sans text-white">
            Application & Requisition Tracker
          </h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Enter your unique reference ID (e.g., REQ-XXXXXX or FORM-XXXXXX) to inspect real-time status and download official verification receipts.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Unique Reference ID..."
              className="w-full pl-4 pr-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Track Status</span>
              </>
            )}
          </button>
        </form>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
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
                  <span className="text-xs font-mono font-bold text-amber-400 select-all">
                    {result.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {result.serviceTitle || result.subject || result.category || "Official Application"}
                </h3>
              </div>

              <div className="flex items-center space-x-3">
                {getStatusBadge(result.status || "Submitted")}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
              <div className="text-xs text-gray-400 font-mono">
                Submitted on: <strong className="text-gray-200">{result.timestamp ? new Date(result.timestamp).toLocaleString() : "Recently"}</strong>
              </div>

              <div className="flex items-center space-x-2">
                {!isEditing && (
                  <button
                    onClick={handleStartEdit}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-mono font-bold flex items-center space-x-1.5 cursor-pointer border border-white/10"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Edit Info</span>
                  </button>
                )}

                <button
                  onClick={() => setShowBillReceipt(!showBillReceipt)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-mono font-bold flex items-center space-x-1.5 cursor-pointer border border-cyan-500/30"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{showBillReceipt ? "Hide Receipt" : "View Official Receipt"}</span>
                </button>
              </div>
            </div>

            {/* Editable Form Modal or Read-only details */}
            {isEditing ? (
              <div className="p-5 bg-black/60 border border-cyan-500/40 rounded-2xl space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center space-x-2">
                  <Edit3 className="h-4 w-4" />
                  <span>Update Application Contact & Address</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Applicant Full Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Phone / Mobile</label>
                    <input
                      type="text"
                      value={editForm.contact}
                      onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Temporary / Present Address</label>
                  <input
                    type="text"
                    value={editForm.temporaryAddress}
                    onChange={(e) => setEditForm({ ...editForm, temporaryAddress: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">Additional Notes / Inquiry</label>
                  <textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
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
              /* Applicant Metadata Overview */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                  <div className="text-[10px] font-mono text-gray-500 uppercase flex items-center space-x-1">
                    <User className="h-3 w-3 text-cyan-400" />
                    <span>Applicant Name</span>
                  </div>
                  <div className="font-bold text-white truncate">{result.name || "N/A"}</div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                  <div className="text-[10px] font-mono text-gray-500 uppercase flex items-center space-x-1">
                    <Phone className="h-3 w-3 text-cyan-400" />
                    <span>Contact Number</span>
                  </div>
                  <div className="font-bold text-white font-mono">{result.contact || "N/A"}</div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                  <div className="text-[10px] font-mono text-gray-500 uppercase flex items-center space-x-1">
                    <Mail className="h-3 w-3 text-cyan-400" />
                    <span>Email Address</span>
                  </div>
                  <div className="font-bold text-white truncate">{result.email || result.gmail || "N/A"}</div>
                </div>
              </div>
            )}

            {/* Official Printable Slip / Receipt */}
            {showBillReceipt && (
              <div className="print-receipt-only p-6 bg-white text-black rounded-2xl shadow-xl space-y-6 font-sans border-2 border-slate-300">
                <div className="flex justify-between items-start border-b pb-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold font-serif tracking-tight text-slate-950">
                      AMIT JOSHI CONSULTING & DIGITAL SERVICES
                    </h2>
                    <p className="text-xs text-slate-600">Official Client Verification & Tracking Receipt</p>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="no-print px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 hover:bg-slate-800 cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Slip</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[10px] block">Reference Token</span>
                    <span className="font-mono font-bold text-base text-slate-900">{result.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[10px] block">Status</span>
                    <span className="font-bold text-slate-900 uppercase">{result.status || "Submitted"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[10px] block">Service Title</span>
                    <span className="font-bold text-slate-900">{result.serviceTitle || result.subject || "Standard Processing"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-bold text-[10px] block">Submission Date</span>
                    <span className="font-mono text-slate-900">{result.timestamp ? new Date(result.timestamp).toLocaleDateString() : "Active"}</span>
                  </div>
                </div>

                <div className="border-t pt-4 text-center text-[10px] text-slate-500 font-mono">
                  This document serves as proof of digital submission for amitjoshi.info.np.
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
