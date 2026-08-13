import React, { useState } from "react";
import { Search, X, CheckCircle2, Clock, AlertCircle, FileText, Printer, MessageSquare, ShieldCheck, User, Phone, Mail, MapPin, Edit3, Save } from "lucide-react";
import { ref, get, update } from "firebase/database";
import { db } from "../firebase";

interface StatusCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "en" | "np";
  logoUrl?: string;
  faviconUrl?: string;
  initialReqId?: string;
}

export default function StatusCheckerModal({
  isOpen,
  onClose,
  lang,
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
      setErrorMsg(lang === "en" ? "Please enter a valid Unique ID." : "कृपया मान्य युनिक आईडी प्रविष्ट गर्नुहोस्।");
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
      setErrorMsg(
        lang === "en"
          ? `No application or suggestion found with ID "${cleanId}". Please verify your Request ID.`
          : `आईडी "${cleanId}" भएको कुनै पनि आवेदन वा सुझाव भेटिएन। कृपया आफ्नो आईडी पुनः जाँच गर्नुहोस्।`
      );
    } catch (err) {
      console.error("Error checking status:", err);
      setErrorMsg(
        lang === "en"
          ? "Failed to fetch status from network. Please try again."
          : "नेपाल नेटवर्कबाट तथ्याङ्क प्राप्त गर्न असफल भयो। कृपया पुनः प्रयास गर्नुहोस्।"
      );
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
            <span>{status || "Pending"}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto no-print">
      <div className="bg-[#0b101d] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-sans">
                {lang === "en" ? "Check Service & Suggestion Status" : "सेवा र सुझाव स्थिति जाँच गर्नुहोस्"}
              </h3>
              <p className="text-[11px] text-gray-400 font-mono">
                {lang === "en" ? "Enter your Unique Request ID to view live progress & remarks" : "आफ्नो अद्वितीय अनुरोध आईडी राखेर ताजा प्रगति र कैफियत हेर्नुहोस्"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder={lang === "en" ? "Enter ID e.g. REQ-A8F2K9 or SUG-B3X912" : "अद्वितीय आईडी राख्नुहोस् (जस्तै REQ-A8F2K9)"}
              className="flex-1 bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 font-bold uppercase text-xs tracking-wider transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
            >
              <Search className="h-4 w-4" />
              <span>{loading ? (lang === "en" ? "Checking..." : "जाँचिँदैछ...") : (lang === "en" ? "Check Status" : "जाँच गर्नुहोस्")}</span>
            </button>
          </form>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Result */}
          {result && (
            <div className="space-y-5 bg-white/[0.02] border border-white/10 p-5 rounded-2xl">
              
              {/* Top Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase block">
                    {type === "service" ? (lang === "en" ? "Service Request ID" : "सेवा अनुरोध आईडी") : (lang === "en" ? "Suggestion Tracking ID" : "सुझाव ट्र्याकिङ आईडी")}
                  </span>
                  <span className="text-xl font-extrabold font-mono text-cyan-400 select-all">
                    {result.id}
                  </span>
                </div>
                <div>
                  {getStatusBadge(result.status)}
                </div>
              </div>

              {/* Admin Remarks / Remarks Box */}
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 block tracking-wider flex items-center space-x-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{lang === "en" ? "Administrator Remarks / Official Notes:" : "प्रशासकको कैफियत / आधिकारिक प्रतिक्रिया:"}</span>
                </span>
                <p className="text-sm font-sans font-medium text-white leading-relaxed whitespace-pre-wrap">
                  {result.remarks || (lang === "en" ? "Application received and queued for admin review." : "अनुरोध प्राप्त भयो र प्रशासकको समीक्षाको क्रममा छ।")}
                </p>
                {result.updatedAt && (
                  <span className="text-[9px] font-mono text-gray-400 block mt-1">
                    Last Updated: {new Date(result.updatedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Editable Section when allowEdit is enabled by Admin */}
              {result.allowEdit && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl space-y-3 font-mono">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2 text-emerald-300">
                      <span className="text-base">🔓</span>
                      <span className="font-bold text-xs uppercase">
                        {lang === "en" ? "Edit Access Granted by Admin" : "प्रशासकद्वारा सम्पादन सुविधा खुल्ला गरिएको छ"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isEditing) setEditForm({ ...result });
                        setIsEditing(!isEditing);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs uppercase hover:bg-emerald-400 transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>{isEditing ? (lang === "en" ? "Cancel Editing" : "रद्द गर्नुहोस्") : (lang === "en" ? "Edit My Submitted Data" : "मेरो विवरण सम्पादन गर्नुहोस्")}</span>
                    </button>
                  </div>

                  {isEditing && editForm && (
                    <div className="pt-3 border-t border-emerald-500/30 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase block mb-1">{lang === "en" ? "Full Name" : "पूरा नाम"}</label>
                          <input type="text" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-black/60 border border-emerald-500/40 rounded p-2 text-white" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase block mb-1">{lang === "en" ? "Phone Contact" : "फोन नम्बर"}</label>
                          <input type="text" value={editForm.contact || ""} onChange={e => setEditForm({...editForm, contact: e.target.value})} className="w-full bg-black/60 border border-emerald-500/40 rounded p-2 text-white" />
                        </div>
                      </div>
                      {type === "service" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-gray-400 uppercase block mb-1">Email</label>
                            <input type="text" value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-black/60 border border-emerald-500/40 rounded p-2 text-white" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 uppercase block mb-1">Temporary Address</label>
                            <input type="text" value={editForm.temporaryAddress || ""} onChange={e => setEditForm({...editForm, temporaryAddress: e.target.value})} className="w-full bg-black/60 border border-emerald-500/40 rounded p-2 text-white" />
                          </div>
                        </div>
                      )}
                      {type === "suggestion" && (
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase block mb-1">Message</label>
                          <textarea rows={3} value={editForm.message || ""} onChange={e => setEditForm({...editForm, message: e.target.value})} className="w-full bg-black/60 border border-emerald-500/40 rounded p-2 text-white" />
                        </div>
                      )}
                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const path = `${type === "service" ? "service_applications" : "suggestions"}/${result.id}`;
                              const updatedObj = { ...editForm, updatedAt: new Date().toISOString() };
                              await update(ref(db, path), updatedObj);
                              setResult(updatedObj);
                              setIsEditing(false);
                              alert(lang === "en" ? "Your submitted data has been updated successfully!" : "तपाईंको विवरण सफलतापूर्वक अद्यावधिक भयो!");
                            } catch (err) {
                              console.error(err);
                              alert("Failed to update data.");
                            }
                          }}
                          className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-bold text-xs uppercase hover:bg-emerald-400 transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>{lang === "en" ? "Save Changes" : "परिवर्तनहरू बचत गर्नुहोस्"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Request / Suggestion Summary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-gray-400 block border-b border-white/5 pb-1">
                    {lang === "en" ? "Applicant Details" : "आवेदकको विवरण"}
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-white">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-bold">{result.name}</span>
                    </div>
                    {result.contact && (
                      <div className="flex items-center space-x-2 text-gray-300 font-mono">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span>{result.contact}</span>
                      </div>
                    )}
                    {result.email && (
                      <div className="flex items-center space-x-2 text-gray-300 font-mono">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        <span>{result.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-gray-400 block border-b border-white/5 pb-1">
                    {type === "service" ? (lang === "en" ? "Requested Service" : "अनुरोध गरिएको सेवा") : (lang === "en" ? "Suggestion Details" : "सुझाव विवरण")}
                  </span>
                  <div>
                    {type === "service" ? (
                      <>
                        <span className="font-bold text-cyan-300 block text-sm">{result.serviceTitle}</span>
                        {result.permanentAddress && (
                          <span className="text-[11px] text-gray-400 block mt-1">
                            {result.permanentAddress.province} Province, {result.permanentAddress.district}, {result.permanentAddress.localLevel}
                          </span>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-200 text-xs line-clamp-4 italic">{result.message}</p>
                    )}
                    <span className="text-[10px] font-mono text-gray-500 block mt-2">
                      Submitted: {new Date(result.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

              </div>

              {/* View Printable Bill Option if Service */}
              {type === "service" && (
                <div className="pt-2 border-t border-white/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowBillReceipt(!showBillReceipt)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{showBillReceipt ? (lang === "en" ? "Hide Official Bill" : "रसिद लुकाउनुहोस्") : (lang === "en" ? "View / Print Official Bill" : "आधिकारिक बिल र रसिद हेर्नुहोस्")}</span>
                  </button>
                </div>
              )}

              {/* Printable Bill Receipt Embed */}
              {showBillReceipt && type === "service" && (
                <div className="mt-4 p-5 bg-[#0a0f1d] border border-white/15 rounded-2xl space-y-4 font-sans text-white text-xs relative overflow-hidden print-receipt-only">
                  
                  {/* Top Print Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-3">
                      {logoUrl && (
                        <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-white/20" referrerPolicy="no-referrer" />
                      )}
                      <div>
                        <h2 className="text-sm font-extrabold text-white">AMIT JOSHI OFFICIAL PORTAL</h2>
                        <span className="text-[9px] font-mono text-cyan-400 uppercase block">Electronic Service Receipt & Bill</span>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[10px]">
                      <span className="block text-gray-400">Request ID: <strong className="text-cyan-400">{result.id}</strong></span>
                      <span className="block text-gray-400">Date: {new Date(result.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Charges summary */}
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 font-mono">
                    <div className="flex justify-between font-bold text-xs">
                      <span>Particulars:</span>
                      <span className="text-cyan-400">{result.serviceTitle}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-400 pt-1 border-t border-white/5">
                      <span>Status:</span>
                      <span className="uppercase font-bold">{result.status || "Pending"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 no-print">
                    <span className="text-[9px] font-mono text-gray-400">
                      This is an electronically generated receipt and does not require a signature.
                    </span>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 font-bold uppercase text-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>{lang === "en" ? "Print Receipt" : "प्रिन्ट गर्नुहोस्"}</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
