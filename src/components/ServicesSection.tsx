import React, { useState } from "react";
import { 
  Heart, Landmark, ExternalLink, FileText, Upload, X, CheckCircle2, 
  Phone, Mail, Sparkles, Printer, ArrowLeft, Search, BookOpen, Calendar, 
  User, ChevronRight, Clock, AlertCircle, Copy, Check, Eye, HelpCircle,
  Receipt, ShieldCheck, DownloadCloud, Image as ImageIcon
} from "lucide-react";
import { DynamicLucideIcon } from "./ToolkitSection";
import StatusCheckerModal from "./StatusCheckerModal";
import InvoiceView from "./InvoiceView";
import { ref, set } from "firebase/database";
import { db } from "../firebase";
import { BlogPost, ServiceItem, ServiceQuestion, ServiceInvoice } from "../utils/defaultData";
import { formatBlogDate, formatBlogTimestamp } from "../utils/date";

interface InterestItem {
  id: string;
  titleEn: string;
  descriptionEn: string;
  icon: string;
}

// Client-side image compression helper to keep base64 payload under 40KB
const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

interface ServicesSectionProps {
  services: ServiceItem[];
  interests: InterestItem[];
  logoUrl?: string;
  faviconUrl?: string;
  blogs?: BlogPost[];
  onOpenBlogModal?: (blog: BlogPost) => void;
}

export default function ServicesSection({ 
  services, 
  interests, 
  logoUrl, 
  faviconUrl, 
  blogs, 
  onOpenBlogModal 
}: ServicesSectionProps) {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Search State for Services
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");

  // Base Form Fields
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contactMethod, setContactMethod] = useState("WhatsApp");

  // Dynamic Questions Form State
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, any>>({});
  const [attachments, setAttachments] = useState<Array<{ name: string; fileName: string; data: string }>>([]);

  // Preview & Submission State
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [generatedRequestId, setGeneratedRequestId] = useState("");
  const [generatedInvoice, setGeneratedInvoice] = useState<ServiceInvoice | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [viewingInvoiceModal, setViewingInvoiceModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleOpenApplyModal = (service: ServiceItem) => {
    setSelectedService(service);
    setIsApplyModalOpen(true);
    setSubmitted(false);
    setIsPreviewMode(false);
    setGeneratedRequestId("");
    setGeneratedInvoice(null);
    setViewingInvoiceModal(false);
    
    // Reset inputs
    setName("");
    setContact("");
    setEmail("");
    setAddress("");
    setContactMethod("WhatsApp");
    setDynamicAnswers({});
    setAttachments([]);
  };

  const handleDynamicAnswerChange = (questionId: string, label: string, value: any) => {
    setDynamicAnswers(prev => ({
      ...prev,
      [label]: value
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, questionLabel: string, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isImage) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
        alert("Please upload an image in JPG, PNG, or WebP format.");
        return;
      }

      try {
        const compressedBase64 = await compressImage(file);
        setAttachments(prev => {
          const filtered = prev.filter(a => a.name !== questionLabel);
          return [...filtered, { name: questionLabel, fileName: file.name, data: compressedBase64 }];
        });
        setDynamicAnswers(prev => ({ ...prev, [questionLabel]: `[Photo Attached: ${file.name}]` }));
      } catch (err) {
        console.error("Image compression error:", err);
      }
    } else {
      if (file.size > 2 * 1024 * 1024) {
        alert("Document file size must be less than 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => {
          const filtered = prev.filter(a => a.name !== questionLabel);
          return [...filtered, { name: questionLabel, fileName: file.name, data: reader.result as string }];
        });
        setDynamicAnswers(prev => ({ ...prev, [questionLabel]: `[Document Attached: ${file.name}]` }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = (questionLabel: string) => {
    setAttachments(prev => prev.filter(a => a.name !== questionLabel));
    setDynamicAnswers(prev => {
      const next = { ...prev };
      delete next[questionLabel];
      return next;
    });
  };

  // Form Validation & Step to Preview
  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    // Validate standard fields
    if (!name.trim()) {
      alert("Please provide your Full Legal Name.");
      return;
    }

    const cleanPhone = contact.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      alert("Please provide a valid 10-digit Mobile / WhatsApp contact number.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Validate custom dynamic questions if configured
    const questions = selectedService.questions || [];
    for (const q of questions) {
      if (q.required) {
        const val = dynamicAnswers[q.labelEn];
        const hasAttachment = attachments.some(a => a.name === q.labelEn);

        if (q.fieldType === "image_upload" || q.fieldType === "file_upload") {
          if (!hasAttachment) {
            alert(`Compulsory Upload Missing: Please upload ${q.labelEn}.`);
            return;
          }
        } else if (!val || (typeof val === "string" && !val.trim())) {
          alert(`Compulsory Field Missing: Please answer "${q.labelEn}".`);
          return;
        }
      }
    }

    setIsPreviewMode(true);
  };

  // Final Submission to Firebase Database
  const handleFinalSubmit = async () => {
    if (!selectedService) return;
    setLoading(true);

    try {
      const uniqueId = "REQ-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const submittedAt = new Date().toISOString();
      const paymentDueAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12-Hour Deadline

      // Parse numerical amount
      const rawPrice = selectedService.priceEn || "5000";
      const numericAmount = parseInt(rawPrice.replace(/\D/g, ""), 10) || 5000;

      // 1. Prepare Service Application Record
      const applicationPayload = {
        id: uniqueId,
        serviceId: selectedService.id,
        serviceTitle: selectedService.titleEn,
        name: name.trim(),
        fullName: name.trim(),
        contact: `+977 ${contact.replace(/\D/g, "")}`,
        phone: `+977 ${contact.replace(/\D/g, "")}`,
        email: email.trim().toLowerCase(),
        gmail: email.trim().toLowerCase(),
        address: address.trim() || "Nepal",
        temporaryAddress: address.trim() || "Nepal",
        contactMethod,
        amount: selectedService.priceEn,
        amountNum: numericAmount,
        status: "Submitted",
        paymentStatus: "Pending", // 12-Hour Payment Window
        submittedAt,
        timestamp: submittedAt,
        paymentDueAt,
        dynamicAnswers,
        customAnswers: dynamicAnswers,
        attachments,
        invoiceId: `INV-${uniqueId}`,
        allowEdit: false,
        read: false,
        isRead: false
      };

      // 2. Prepare Digital Service Invoice
      const invoicePayload: ServiceInvoice = {
        invoiceId: `INV-${uniqueId}`,
        submissionId: uniqueId,
        serviceId: selectedService.id,
        serviceTitle: selectedService.titleEn,
        clientName: name.trim(),
        clientEmail: email.trim().toLowerCase(),
        clientPhone: `+977 ${contact.replace(/\D/g, "")}`,
        clientAddress: address.trim() || "Nepal",
        amount: numericAmount,
        amountFormatted: selectedService.priceEn,
        currency: "NPR",
        submittedAt,
        paymentDueAt,
        paymentStatus: "Pending",
        answers: dynamicAnswers,
        attachments
      };

      // 3. Save to Firebase Realtime Database
      await set(ref(db, `service_applications/${uniqueId}`), applicationPayload);
      await set(ref(db, `invoices/INV-${uniqueId}`), invoicePayload);

      setGeneratedRequestId(uniqueId);
      setGeneratedInvoice(invoicePayload);
      setSubmitted(true);
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Failed to submit application. Please check your internet connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  const copyRequestId = () => {
    if (!generatedRequestId) return;
    navigator.clipboard.writeText(generatedRequestId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const filteredServices = services.filter((s) => {
    const q = serviceSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.titleEn?.toLowerCase().includes(q) ||
      s.descriptionEn?.toLowerCase().includes(q)
    );
  });

  return (
    <section id="services-section" className="py-20 relative border-t border-white/5 scroll-mt-24">
      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
              <Landmark className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                Services & Verification Hub
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans">
              Services, Consultations & Requisitions
            </h2>
            <p className="text-gray-400 mt-2 text-sm max-w-2xl">
              Apply for software architecture, compliance, cyber security, and technology consultations with 12-hour instant invoice tracking.
            </p>
          </div>

          {/* Quick Actions: Tracker Button & Search Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/5"
            >
              <Search className="h-4 w-4" />
              <span>Track Application Status</span>
            </button>

            <div className="relative">
              <input
                type="text"
                value={serviceSearchQuery}
                onChange={(e) => setServiceSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="w-full sm:w-48 pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const isDown = service.serverStatus === "down" || service.serverStatus === "offline";
            return (
              <div
                key={service.id}
                className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden backdrop-blur-md shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                      <DynamicLucideIcon name={service.icon} className="h-6 w-6" />
                    </div>
                    {isDown ? (
                      <span className="text-[10px] font-mono font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                        Server Offline
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        Active Service
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors font-sans">
                      {service.titleEn}
                    </h3>
                    {service.titleNp && (
                      <p className="text-xs text-gray-400 font-sans mt-0.5">{service.titleNp}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed font-sans">
                      {service.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono uppercase block">Rate / Package</span>
                    <span className="text-sm font-bold text-cyan-300 font-mono">{service.priceEn}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      disabled={isDown}
                      onClick={() => handleOpenApplyModal(service)}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 cursor-pointer"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interests Sub-Section */}
        {interests && interests.length > 0 && (
          <div className="mt-20 pt-12 border-t border-white/5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
              <Heart className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-purple-400 uppercase">
                Focus Areas & Passions
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white font-sans mb-6">
              Research Domains & Specializations
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {interests.map((interest) => (
                <div
                  key={interest.id}
                  className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-purple-500/30 transition-all space-y-2"
                >
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 w-fit">
                    <DynamicLucideIcon name={interest.icon} className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">{interest.titleEn}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{interest.descriptionEn}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ---------------------------------------------------- */}
      {/* APPLICATION FORM & REVIEW MODAL */}
      {/* ---------------------------------------------------- */}
      {isApplyModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0c101d] border border-cyan-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl space-y-6 overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Title */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                Official Intake & Requisition Form
              </span>
              <h3 className="text-xl font-bold text-white font-sans">
                {selectedService.titleEn}
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                Standard Fee: <strong className="text-cyan-300">{selectedService.priceEn}</strong> &bull; 12-Hour Confirmation Window
              </p>
            </div>

            {/* ---------------- STATE 1: SUBMITTED CONFIRMATION ---------------- */}
            {submitted ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl text-center space-y-5 animate-in fade-in">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <div>
                  <h4 className="text-xl font-bold text-white font-serif">Service Requisition Transmitted</h4>
                  <p className="text-xs text-gray-300 mt-1">
                    Your unique tracking token has been registered in the cloud database:
                  </p>
                </div>

                <div className="p-4 bg-black/80 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-2 max-w-md mx-auto">
                  <div className="text-left font-mono">
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Request Token</span>
                    <span className="text-base text-emerald-300 font-bold select-all">{generatedRequestId}</span>
                  </div>
                  <button
                    onClick={copyRequestId}
                    className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {/* 12-Hour Payment Notice */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left text-xs font-mono text-amber-300 space-y-1 max-w-md mx-auto">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>12-Hour Payment Window Active</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    Please complete payment settlement via eSewa or Khalti within 12 hours. Use invoice #{generatedInvoice?.invoiceId || generatedRequestId} as reference.
                  </p>
                </div>

                <div className="pt-3 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setViewingInvoiceModal(true)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono uppercase text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View & Print Official Bill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsApplyModalOpen(false);
                      setIsStatusModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono uppercase text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Search className="w-4 h-4" />
                    <span>Track Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold font-mono uppercase text-xs rounded-xl transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : isPreviewMode ? (
              /* ---------------- STATE 2: PREVIEW & VERIFICATION ---------------- */
              <div className="space-y-6 animate-in fade-in">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1 font-mono">
                  <span className="font-bold uppercase tracking-wider block">Verification Review</span>
                  <p>Please carefully review your entered answers and attachments before sending.</p>
                </div>

                <div className="space-y-3 text-xs bg-white/[0.02] p-5 rounded-2xl border border-white/5 font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Applicant Name:</span>
                    <span className="font-bold text-white">{name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Mobile Phone:</span>
                    <span className="font-bold text-white">+977 {contact.replace(/\D/g, "")}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Email Address:</span>
                    <span className="font-bold text-white">{email}</span>
                  </div>
                  {address && (
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">Address / Location:</span>
                      <span className="font-bold text-white">{address}</span>
                    </div>
                  )}

                  {/* Dynamic Answers in Review */}
                  {Object.entries(dynamicAnswers).map(([label, val], didx) => (
                    <div key={didx} className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">{label}:</span>
                      <span className="font-bold text-cyan-300 text-right max-w-xs truncate">{String(val || "N/A")}</span>
                    </div>
                  ))}

                  <div className="flex justify-between pt-1">
                    <span className="text-gray-400">Attached Documents:</span>
                    <span className="font-bold text-amber-400">{attachments.length} files attached</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-gray-300 hover:bg-white/10 cursor-pointer"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono uppercase text-xs tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center space-x-2 shadow-lg shadow-cyan-500/20"
                  >
                    {loading ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>Confirm & Transmit</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* ---------------- STATE 3: DYNAMIC INPUT FORM ---------------- */
              <form onSubmit={handlePreview} className="space-y-6">
                
                {/* 1. Core Applicant Identity */}
                <div className="space-y-4">
                  <h4 className="font-mono font-bold text-cyan-400 text-xs uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>1. Applicant Identity & Contact</span>
                  </h4>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block">
                        Full Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ram Bahadur Thapa"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block">
                          Phone / Mobile (10-Digit) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="98XXXXXXXX"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="client@example.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block">
                        Permanent / Working Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Kathmandu, Bagmati Province"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Dynamic Service Specific Questions */}
                {selectedService.questions && selectedService.questions.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-mono font-bold text-cyan-400 text-xs uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>2. Service Intake Requisites</span>
                    </h4>

                    <div className="space-y-4">
                      {selectedService.questions.map((q) => {
                        const isAttached = attachments.find(a => a.name === q.labelEn);

                        return (
                          <div key={q.id} className="space-y-1.5 p-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-mono font-bold text-white block">
                                {q.labelEn} {q.required && <span className="text-red-400">*</span>}
                              </label>
                              {q.labelNp && <span className="text-[10px] text-gray-400">{q.labelNp}</span>}
                            </div>
                            {q.helpText && <p className="text-[11px] text-gray-400 font-mono">{q.helpText}</p>}

                            {/* Render according to Field Type */}
                            {q.fieldType === "short_text" && (
                              <input
                                type="text"
                                required={q.required}
                                placeholder={q.placeholder || "Enter details..."}
                                value={dynamicAnswers[q.labelEn] || ""}
                                onChange={(e) => handleDynamicAnswerChange(q.id, q.labelEn, e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                              />
                            )}

                            {q.fieldType === "long_text" && (
                              <textarea
                                rows={3}
                                required={q.required}
                                placeholder={q.placeholder || "Enter description..."}
                                value={dynamicAnswers[q.labelEn] || ""}
                                onChange={(e) => handleDynamicAnswerChange(q.id, q.labelEn, e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                              />
                            )}

                            {q.fieldType === "number" && (
                              <input
                                type="number"
                                required={q.required}
                                placeholder={q.placeholder || "0"}
                                value={dynamicAnswers[q.labelEn] || ""}
                                onChange={(e) => handleDynamicAnswerChange(q.id, q.labelEn, e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                              />
                            )}

                            {q.fieldType === "date" && (
                              <input
                                type="date"
                                required={q.required}
                                value={dynamicAnswers[q.labelEn] || ""}
                                onChange={(e) => handleDynamicAnswerChange(q.id, q.labelEn, e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                              />
                            )}

                            {q.fieldType === "dropdown" && (
                              <select
                                required={q.required}
                                value={dynamicAnswers[q.labelEn] || ""}
                                onChange={(e) => handleDynamicAnswerChange(q.id, q.labelEn, e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                              >
                                <option value="">-- Please Select --</option>
                                {(q.options || []).map((opt, oidx) => (
                                  <option key={oidx} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}

                            {q.fieldType === "radio" && (
                              <div className="flex flex-wrap gap-4 pt-1">
                                {(q.options || []).map((opt, oidx) => (
                                  <label key={oidx} className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={q.id}
                                      value={opt}
                                      checked={dynamicAnswers[q.labelEn] === opt}
                                      onChange={() => handleDynamicAnswerChange(q.id, q.labelEn, opt)}
                                      className="accent-cyan-400"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {q.fieldType === "checkbox" && (
                              <div className="flex flex-wrap gap-4 pt-1">
                                {(q.options || []).map((opt, oidx) => {
                                  const currentArr = Array.isArray(dynamicAnswers[q.labelEn]) ? dynamicAnswers[q.labelEn] : [];
                                  const isChecked = currentArr.includes(opt);
                                  return (
                                    <label key={oidx} className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          const nextArr = e.target.checked
                                            ? [...currentArr, opt]
                                            : currentArr.filter((i: string) => i !== opt);
                                          handleDynamicAnswerChange(q.id, q.labelEn, nextArr);
                                        }}
                                        className="accent-cyan-400 rounded"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}

                            {q.fieldType === "image_upload" && (
                              <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-xl">
                                <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-bold transition-all">
                                  <ImageIcon className="h-4 w-4" />
                                  <span>{isAttached ? "Change Photo" : "Upload Image / Photo"}</span>
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => handleFileUpload(e, q.labelEn, true)}
                                    className="hidden"
                                  />
                                </label>
                                {isAttached && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[11px] font-mono text-emerald-400 font-bold truncate max-w-[150px]">
                                      ✓ {isAttached.fileName}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAttachment(q.labelEn)}
                                      className="text-red-400 hover:text-red-300 p-1"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {q.fieldType === "file_upload" && (
                              <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-xl">
                                <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-mono font-bold transition-all">
                                  <Upload className="h-4 w-4" />
                                  <span>{isAttached ? "Change Document" : "Upload Document (PDF)"}</span>
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => handleFileUpload(e, q.labelEn, false)}
                                    className="hidden"
                                  />
                                </label>
                                {isAttached && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[11px] font-mono text-emerald-400 font-bold truncate max-w-[150px]">
                                      ✓ {isAttached.fileName}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAttachment(q.labelEn)}
                                      className="text-red-400 hover:text-red-300 p-1"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase text-gray-300 hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-cyan-500 text-black hover:bg-cyan-400 font-bold uppercase text-xs tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-cyan-500/20 font-mono"
                  >
                    Preview Application
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* FULL INVOICE VIEW MODAL */}
      {/* ---------------------------------------------------- */}
      {viewingInvoiceModal && generatedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950">
          <InvoiceView
            invoice={generatedInvoice}
            onBack={() => setViewingInvoiceModal(false)}
            isAdmin={false}
          />
        </div>
      )}

      {/* Status Tracker Modal */}
      <StatusCheckerModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        logoUrl={logoUrl}
        faviconUrl={faviconUrl}
      />

    </section>
  );
}
