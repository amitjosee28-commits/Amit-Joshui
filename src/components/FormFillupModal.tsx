import React, { useState } from "react";
import { X, Send, CheckCircle2, FileSignature, Upload } from "lucide-react";
import { ref, push, set } from "firebase/database";
import { db } from "../firebase";

interface FormFillupModalProps {
  isOpen: boolean;
  formTitle: string;
  targetId: string;
  lang: "en" | "np";
  onClose: () => void;
}

export default function FormFillupModal({ isOpen, formTitle, targetId, lang, onClose }: FormFillupModalProps) {
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
        alert(lang === "en" ? "File size must be under 5MB" : "फाइल साइज ५MB भन्दा कम हुनुपर्छ");
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
      alert(lang === "en" ? "Please fill in all required fields." : "कृपया आवश्यक क्षेत्रहरू भर्नुहोस्।");
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
      alert(lang === "en" ? "Submission failed. Please try again." : "बुझाउन असफल भयो। पुनः प्रयास गर्नुहोस्।");
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
            {formTitle || (lang === "en" ? "Online Application Form" : "अनलाइन आवेदन फारम")}
          </h2>
          <p className="text-xs text-gray-400">
            {lang === "en" 
              ? "Complete this direct form for processing and official tracking."
              : "प्रशोधन र आधिकारिक ट्र्याकिङका लागि यो फारम भर्नुहोस्।"}
          </p>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">
              {lang === "en" ? "Application Submitted!" : "फारम सफलतापूर्वक बुझाइयो!"}
            </h3>
            <p className="text-xs text-gray-300">
              {lang === "en" ? "Your tracking reference ID:" : "तपाईंको ट्र्याकिङ कोड:"}
            </p>
            <div className="p-3 bg-black/60 border border-emerald-500/40 rounded-xl font-mono text-emerald-300 font-bold text-lg select-all">
              {trackingId}
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase text-xs"
            >
              {lang === "en" ? "Done & Close" : "सम्पन्न र बन्द गर्नुहोस्"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400 block font-bold">
                {lang === "en" ? "Full Name *" : "पूरा नाम *"}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Amit Sharma"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400 block font-bold">
                  {lang === "en" ? "Mobile Number *" : "मोबाइल नम्बर *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="98XXXXXXXX"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400 block font-bold">
                  {lang === "en" ? "Email Address" : "इमेल ठेगाना"}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400 block font-bold">
                {lang === "en" ? "Application Details / Remarks *" : "आवेदन विवरण / आवश्यकता *"}
              </label>
              <textarea
                required
                rows={3}
                value={formData.details}
                onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                placeholder={lang === "en" ? "Provide details for your request..." : "तपाईंको अनुरोधको विवरण दिनुहोस्..."}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Document upload field */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-400 block font-bold">
                {lang === "en" ? "Attach Document / PDF (Optional)" : "कागजात / PDF संलग्न गर्नुहोस् (ऐच्छिक)"}
              </label>
              <div className="relative border border-dashed border-white/20 hover:border-amber-500/50 rounded-xl p-3 text-center bg-black/40">
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                  <Upload className="h-4 w-4 text-amber-400" />
                  <span>{formData.pdfName || (lang === "en" ? "Click to upload document" : "कागजात अपलोड गर्न क्लिक गर्नुहोस्")}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black transition-all cursor-pointer shadow-lg"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? "Submitting..." : (lang === "en" ? "Submit Application Now" : "अहिले बुझाउनुहोस्")}</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
