import React, { useState } from "react";
import { Heart, Landmark, ExternalLink, FileText, Upload, X, CheckCircle2, Phone, Mail, Sparkles, Printer, ArrowLeft, Search, BookOpen, Calendar, User, ChevronRight, Clock, AlertCircle } from "lucide-react";
import { DynamicLucideIcon } from "./ToolkitSection";
import StatusCheckerModal from "./StatusCheckerModal";
import { ref, set } from "firebase/database";
import { db } from "../firebase";
import { BlogPost } from "../utils/defaultData";
import { formatBlogDate, formatBlogTimestamp } from "../utils/date";

interface ServiceItem {
  id: string;
  titleEn: string;
  descriptionEn: string;
  priceEn: string;
  whatsappMessageEn: string;
  officialLink: string;
  icon: string;
  photoReqsEn?: string;
  docReqsEn?: string;
  specialNoticeEn?: string;
  customQuestionsEn?: string;
  
  // Dynamic Upload Configurations
  pdfEnabled?: boolean;
  pdfRequired?: boolean;
  pdfLabelEn?: string;
  
  photo1Enabled?: boolean;
  photo1Required?: boolean;
  photo1LabelEn?: string;
  
  photo2Enabled?: boolean;
  photo2Required?: boolean;
  photo2LabelEn?: string;
  
  photo3Enabled?: boolean;
  photo3Required?: boolean;
  photo3LabelEn?: string;
  
  photo4Enabled?: boolean;
  photo4Required?: boolean;
  photo4LabelEn?: string;
  serverStatus?: "active" | "down" | "online" | "offline" | string;
}

interface InterestItem {
  id: string;
  titleEn: string;
  descriptionEn: string;
  icon: string;
}

// Image compression helper using Canvas to keep base64 payload size under 30KB and avoid firebase database write failures
const compressImage = (file: File, maxWidth = 600, maxHeight = 600, quality = 0.65): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
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

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
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

export default function ServicesSection({ services, interests, logoUrl, faviconUrl, blogs, onOpenBlogModal }: ServicesSectionProps) {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Search State for Services
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [localLevel, setLocalLevel] = useState("");
  const [ward, setWard] = useState("");
  const [tole, setTole] = useState("");
  const [temporaryAddress, setTemporaryAddress] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [contactMethod, setContactMethod] = useState("Email");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Array<{ name: string; fileName: string; data: string }>>([]);

  // Preview State
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [generatedRequestId, setGeneratedRequestId] = useState("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const handleOpenApplyModal = (service: ServiceItem) => {
    setSelectedService(service);
    setIsApplyModalOpen(true);
    setSubmitted(false);
    setIsPreviewMode(false);
    setGeneratedRequestId("");
    setName("");
    setProvince("");
    setDistrict("");
    setLocalLevel("");
    setWard("");
    setTole("");
    setTemporaryAddress("");
    setContact("");
    setEmail("");
    setContactMethod("Email");
    setCustomAnswers({});
    setAttachments([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, isPdf: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isPdf) {
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
          alert("Only PDF files are accepted for this document upload.");
          return;
        }
        if (file.size > 100 * 1024) {
          alert("PDF file size must be less than 100KB.");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachments(prev => {
            const filtered = prev.filter(att => att.name !== fieldName);
            return [...filtered, { name: fieldName, fileName: file.name, data: reader.result as string }];
          });
        };
        reader.readAsDataURL(file);
      } else {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension !== "jpg" && extension !== "jpeg") {
          alert("Only JPG files are accepted for photo uploads.");
          return;
        }

        compressImage(file)
          .then((compressedBase64) => {
            setAttachments(prev => {
              const filtered = prev.filter(att => att.name !== fieldName);
              return [...filtered, { name: fieldName, fileName: file.name, data: compressedBase64 }];
            });
          })
          .catch((err) => {
            console.error("Error compressing photo:", err);
            const reader = new FileReader();
            reader.onloadend = () => {
              setAttachments(prev => {
                const filtered = prev.filter(att => att.name !== fieldName);
                return [...filtered, { name: fieldName, fileName: file.name, data: reader.result as string }];
              });
            };
            reader.readAsDataURL(file);
          });
      }
    }
  };

  const handleCustomQuestionChange = (question: string, value: string) => {
    setCustomAnswers(prev => ({
      ...prev,
      [question]: value
    }));
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    if (!name.trim()) {
      alert("Full Name is required.");
      return;
    }
    if (!province.trim() || !district.trim() || !localLevel.trim() || !ward.trim() || !tole.trim()) {
      alert("All permanent address fields are compulsory.");
      return;
    }
    if (!contact.trim()) {
      alert("Contact number is required.");
      return;
    }
    
    const contactCleaned = contact.trim();
    if (contactCleaned.length !== 10 || !contactCleaned.startsWith("9")) {
      alert("Contact number must be exactly 10 digits starting with 9.");
      return;
    }

    const emailCleaned = email.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(emailCleaned)) {
      alert("Please enter a valid Gmail address (must contain @ and end with gmail.com).");
      return;
    }

    if (selectedService.pdfEnabled && selectedService.pdfRequired) {
      const pdfLabel = selectedService.pdfLabelEn || "PDF Document";
      const hasPdf = attachments.some(att => att.name === pdfLabel);
      if (!hasPdf) {
        alert(`Please upload the compulsory PDF document: ${pdfLabel}`);
        return;
      }
    }

    for (let slot = 1; slot <= 4; slot++) {
      const isEnabled = (selectedService as any)[`photo${slot}Enabled`];
      const isRequired = (selectedService as any)[`photo${slot}Required`];
      if (isEnabled && isRequired) {
        const label = (selectedService as any)[`photo${slot}LabelEn`] || `Photo Slot ${slot}`;
        const hasPhoto = attachments.some(att => att.name === label);
        if (!hasPhoto) {
          alert(`Please upload the compulsory photo: ${label}`);
          return;
        }
      }
    }

    setIsPreviewMode(true);
  };

  const handleFinalSubmit = async () => {
    if (!selectedService) return;
    setLoading(true);

    try {
      const uniqueId = "REQ-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const submissionRef = ref(db, `service_applications/${uniqueId}`);
      
      const payload = {
        id: uniqueId,
        serviceId: selectedService.id,
        serviceTitle: selectedService.titleEn,
        name,
        permanentAddress: {
          province,
          district,
          localLevel,
          ward,
          tole
        },
        temporaryAddress: temporaryAddress || "Same as permanent address",
        contact: `+977 ${contact}`,
        email: email.trim().toLowerCase(),
        gmail: email.trim().toLowerCase(),
        contactMethod,
        customAnswers,
        attachments,
        status: "Submitted",
        timestamp: new Date().toISOString(),
        userNotes: ""
      };

      await set(submissionRef, payload);
      setGeneratedRequestId(uniqueId);
      setSubmitted(true);
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Failed to submit application. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((s) => {
    const q = serviceSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.titleEn?.toLowerCase().includes(q) ||
      s.descriptionEn?.toLowerCase().includes(q)
    );
  });

  const photoRequirements = selectedService?.photoReqsEn ? selectedService.photoReqsEn.split(",").map(p => p.trim()).filter(Boolean) : [];
  const docRequirements = selectedService?.docReqsEn ? selectedService.docReqsEn.split(",").map(d => d.trim()).filter(Boolean) : [];
  const customQuestions = selectedService?.customQuestionsEn ? selectedService.customQuestionsEn.split("\n").map(q => q.trim()).filter(Boolean) : [];

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
              Apply for specialized software design, compliance audits, or public service filings with real-time status tracking.
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
                className="w-full sm:w-48 pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
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
                      <span className="text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Available
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors font-sans">
                      {service.titleEn}
                    </h3>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                      {service.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {service.priceEn || "Complimentary / Standard"}
                  </span>

                  <button
                    onClick={() => handleOpenApplyModal(service)}
                    disabled={isDown}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interests & Secondary Domains */}
        {interests && interests.length > 0 && (
          <div className="mt-20 pt-12 border-t border-white/5">
            <div className="text-center max-w-xl mx-auto mb-10">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                <Heart className="h-3.5 w-3.5" />
                <span>Specialized Domains</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Areas of Active Interest & Research</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {interests.map((interest) => (
                <div key={interest.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
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

      {/* Application Form Modal */}
      {isApplyModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0d0f18] border border-cyan-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl space-y-6 overflow-y-auto">
            
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
                Official Application Intake
              </span>
              <h3 className="text-xl font-bold text-white font-sans">
                {selectedService.titleEn}
              </h3>
            </div>

            {submitted ? (
              /* Success State */
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-4 animate-in fade-in">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">Application Successfully Submitted!</h4>
                <p className="text-xs text-gray-300">
                  Please save your unique reference ID to track status and download verification slips:
                </p>
                <div className="p-3 bg-black/70 border border-emerald-500/40 rounded-xl font-mono text-emerald-300 font-bold text-base select-all">
                  {generatedRequestId}
                </div>
                <div className="pt-2 flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      setIsApplyModalOpen(false);
                      setIsStatusModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-cyan-500 text-black font-bold uppercase text-xs rounded-xl"
                  >
                    Track in Portal
                  </button>
                  <button
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-5 py-2.5 bg-white/10 text-white font-bold uppercase text-xs rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : isPreviewMode ? (
              /* Preview Verification State */
              <div className="space-y-6 animate-in fade-in">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
                  <span className="font-bold uppercase tracking-wider block font-mono">Verification Confirmation</span>
                  <p>Please inspect all entered application records before transmitting to the database.</p>
                </div>

                <div className="space-y-3 text-xs bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Applicant Name:</span>
                    <span className="font-bold text-white">{name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Permanent Address:</span>
                    <span className="font-mono text-white">{`${tole}, Ward ${ward}, ${localLevel}, ${district}, ${province}`}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Contact Number:</span>
                    <span className="font-mono text-white">+977 {contact}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Email Address:</span>
                    <span className="font-mono text-white">{email}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Documents Attached:</span>
                    <span className="font-bold text-cyan-400">{attachments.length} files</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/10"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase text-xs tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>Confirm & Submit</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Input Form */
              <form onSubmit={handlePreview} className="space-y-6">
                
                {/* Applicant Identity */}
                <div className="space-y-4">
                  <h4 className="font-mono font-bold text-cyan-400 text-xs uppercase tracking-wider border-b border-white/5 pb-1">
                    1. Applicant Identity
                  </h4>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Bishal Sharma"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>
                </div>

                {/* Permanent Address */}
                <div className="space-y-4">
                  <h4 className="font-mono font-bold text-cyan-400 text-xs uppercase tracking-wider border-b border-white/5 pb-1">
                    2. Permanent Address
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-gray-400">Province *</label>
                      <input
                        type="text"
                        required
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="Province"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-gray-400">District *</label>
                      <input
                        type="text"
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="District"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-gray-400">Municipality / Local *</label>
                      <input
                        type="text"
                        required
                        value={localLevel}
                        onChange={(e) => setLocalLevel(e.target.value)}
                        placeholder="Municipality"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-gray-400">Ward No. *</label>
                      <input
                        type="text"
                        required
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                        placeholder="Ward"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1 col-span-2 sm:col-span-2">
                      <label className="text-[10px] font-mono uppercase text-gray-400">Tole / Village *</label>
                      <input
                        type="text"
                        required
                        value={tole}
                        onChange={(e) => setTole(e.target.value)}
                        placeholder="Tole"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="font-mono font-bold text-cyan-400 text-xs uppercase tracking-wider border-b border-white/5 pb-1">
                    3. Contact & Communication
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-gray-400">Mobile Number (9XXXXXXXXX) *</label>
                      <input
                        type="tel"
                        required
                        value={contact}
                        onChange={(e) => setContact(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9XXXXXXXXX"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-gray-400">Gmail Address (@gmail.com) *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="username@gmail.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Uploads */}
                <div className="space-y-4">
                  <h4 className="font-mono font-bold text-cyan-400 text-xs uppercase tracking-wider border-b border-white/5 pb-1 flex items-center space-x-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    <span>4. Supporting Document Uploads</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* PDF Upload */}
                    {selectedService.pdfEnabled && (
                      <div className="p-3 bg-cyan-950/10 border border-cyan-500/20 rounded-xl space-y-2 col-span-1 sm:col-span-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono font-bold text-cyan-400 block uppercase truncate">
                            {selectedService.pdfLabelEn || "PDF Document"} {selectedService.pdfRequired && <span className="text-red-400">*</span>}
                          </span>
                          <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">PDF ONLY (Max 100KB)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-300 hover:bg-white/10 transition-colors">
                            <Upload className="h-3.5 w-3.5 text-cyan-400" />
                            <span>Upload PDF</span>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => handleFileChange(e, selectedService.pdfLabelEn || "PDF Document", true)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Photos 1-4 */}
                    {[1, 2, 3, 4].map((slot) => {
                      const isEnabled = (selectedService as any)[`photo${slot}Enabled`];
                      if (!isEnabled) return null;
                      const label = (selectedService as any)[`photo${slot}LabelEn`] || `Photo Slot ${slot}`;
                      const isRequired = (selectedService as any)[`photo${slot}Required`];
                      const fileSelected = attachments.find(att => att.name === label);

                      return (
                        <div key={`photo-${slot}`} className="p-3 bg-purple-950/10 border border-purple-500/20 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold text-purple-400 block uppercase truncate">
                              {label} {isRequired && <span className="text-red-400">*</span>}
                            </span>
                            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">JPG ONLY</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-300 hover:bg-white/10 transition-colors">
                              <Upload className="h-3.5 w-3.5 text-purple-400" />
                              <span>{fileSelected ? "Change JPG" : "Upload JPG"}</span>
                              <input
                                type="file"
                                accept=".jpg,.jpeg"
                                onChange={(e) => handleFileChange(e, label, false)}
                                className="hidden"
                              />
                            </label>
                            {fileSelected && (
                              <span className="text-[9px] font-mono text-cyan-400 truncate max-w-[120px]">
                                ✓ {fileSelected.fileName}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase text-gray-300 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-cyan-500 text-black hover:bg-cyan-400 font-bold uppercase text-xs tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    Preview Application
                  </button>
                </div>

              </form>
            )}

          </div>
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
