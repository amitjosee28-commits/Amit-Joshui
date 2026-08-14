import React, { useState } from "react";
import { X, Send, CheckCircle2, FileSignature, Upload } from "lucide-react";
import { ref, set } from "firebase/database";
import { db } from "../firebase";

interface FormFillupModalProps {
  isOpen: boolean;
  formTitle: string;
  targetId: string;
  onClose: () => void;
}

export default function FormFillupModal({ isOpen, formTitle, targetId, onClose }: FormFillupModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    details: "",
    pdfBase64: "",
    pdfName: ""
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState("");

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be under 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          pdfBase64: reader.result as string,
          pdfName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.details) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const generatedId = "FORM-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const appRef = ref(db, `service_applications/${generatedId}`);

      await set(appRef, {
        id: generatedId,
        serviceId: targetId || "custom-form",
        serviceTitle: formTitle || "Custom Online Application Form",
        name: formData.name,
        contact: formData.phone,
        gmail: formData.email || "",
        phone: formData.phone,
        address: formData.address || "",
        customAnswers: formData.details,
        pdfBase64: formData.pdfBase64 || "",
        status: "Submitted",
        timestamp: new Date().toISOString()
      });

      setTrackingId(generatedId);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0e1017] border border-amber-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileSignature className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-white">
            {formTitle || "Online Application Form"}
          </h2>
          <p className="text-xs text-gray-400">
            Complete this direct service requisition form for official processing and record tracking.
          </p>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">
              Application Submitted Successfully!
            </h3>
            <p className="text-xs text-gray-300">
              Your tracking reference ID:
            </p>
            <div className="p-3 bg-black/60 border border-emerald-500/40 rounded-xl font-mono text-emerald-300 font-bold text-lg select-all">
              {trackingId}
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase text-xs cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400 block font-bold">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400 block font-bold">
                  Mobile / Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400 block font-bold">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400 block font-bold">
                Permanent Address / Location
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="City, District, Province"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400 block font-bold">
                Service Inquiry & Project Requirements *
              </label>
              <textarea
                rows={3}
                required
                value={formData.details}
                onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Detail your requirements, project scope, or questions..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Document / PDF Attachment Upload */}
            <div className="space-y-1.5 p-3.5 bg-white/[0.02] border border-white/10 rounded-xl">
              <label className="text-xs font-mono text-amber-400 font-bold block">
                Attach Supporting Document / Proposal (PDF / JPG up to 5MB)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                onChange={handleFileUpload}
                className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
              />
              {formData.pdfName && (
                <span className="text-[11px] font-mono text-emerald-400 block">
                  Attached: {formData.pdfName}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Submitting Requisition...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Application Form</span>
                </>
              )}
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
