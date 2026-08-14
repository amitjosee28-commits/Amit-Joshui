import React, { useState } from "react";
import { MessageSquare, MapPin, Send, CheckCircle2 } from "lucide-react";
import { ref, set } from "firebase/database";
import { db } from "../firebase";

interface ContactFormProps {
  permanentMapUrl: string;
  temporaryMapUrl: string;
  permanentAddressEn?: string;
  temporaryAddressEn?: string;
}

export default function ContactForm({ 
  permanentMapUrl, 
  temporaryMapUrl,
  permanentAddressEn,
  temporaryAddressEn,
}: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    gmail: "",
    phone: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedTrackingId, setSubmittedTrackingId] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const val = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: val }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message || !formData.gmail || !formData.phone) {
      alert("Please fill in all required fields.");
      return;
    }

    const gmailCleaned = formData.gmail.trim().toLowerCase();
    const phoneCleaned = formData.phone.trim();

    // Gmail validation: must end with @gmail.com
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(gmailCleaned)) {
      alert("Please enter a valid Gmail address (must contain @ and end with gmail.com).");
      return;
    }

    // Nepali mobile number validation: 10 digits starting with 9
    const phoneRegex = /^9\d{9}$/;
    if (!phoneRegex.test(phoneCleaned)) {
      alert("Please enter a valid 10-digit mobile number starting with 9.");
      return;
    }

    setLoading(true);

    try {
      const trackingId = "SUG-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const suggestionRef = ref(db, `suggestions/${trackingId}`);
      await set(suggestionRef, {
        id: trackingId,
        name: formData.name,
        address: formData.address || "",
        contact: `+977 ${phoneCleaned} (${gmailCleaned})`,
        gmail: gmailCleaned,
        phone: `+977 ${phoneCleaned}`,
        message: formData.message,
        status: "Received",
        remarks: "Suggestion received and logged in official queue.",
        timestamp: new Date().toISOString()
      });

      setSubmittedTrackingId(trackingId);
      setSubmitted(true);
      setFormData({
        name: "",
        address: "",
        gmail: "",
        phone: "",
        message: "",
      });
    } catch (err) {
      console.error("Error submitting suggestion to Firebase:", err);
      alert("Failed to send suggestion. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact-section" className="py-20 relative border-t border-white/5 scroll-mt-24">
      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
            <MessageSquare className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
              Contact Gateway
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans">
            Suggestion Box & Location Maps
          </h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto text-sm">
            Drop critical feedback or business inquiries directly into the database or inspect regional office nodes.
          </p>
        </div>

        {/* 2-Column Grid: Left Contact Form, Right Maps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-6 bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2 font-sans flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
              <span>Direct Suggestion Box</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Your feedback is directly recorded with an official tracking ID.
            </p>

            {submitted ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3 animate-in fade-in">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Suggestion Received!</h4>
                <p className="text-xs text-gray-300">
                  Your reference tracking token:
                </p>
                <div className="p-3 bg-black/60 border border-emerald-500/40 rounded-xl font-mono text-emerald-300 font-bold text-sm select-all">
                  {submittedTrackingId}
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 px-4 py-2 bg-emerald-500 text-black font-bold uppercase text-xs rounded-xl"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-mono font-bold text-gray-300 block mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Bishal Sharma"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono font-bold text-gray-300 block mb-1">
                      Mobile Number (98XXXXXXXX) *
                    </label>
                    <input
                      type="tel"
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="98XXXXXXXX"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono font-bold text-gray-300 block mb-1">
                      Gmail Address *
                    </label>
                    <input
                      type="email"
                      required
                      name="gmail"
                      value={formData.gmail}
                      onChange={handleChange}
                      placeholder="username@gmail.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-gray-300 block mb-1">
                    Address / Organization
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. Kathmandu, Nepal"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-gray-300 block mb-1">
                    Suggestion / Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your suggestions or inquiries..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase text-xs tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{loading ? "Transmitting..." : "Submit Suggestion"}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Location Maps */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Permanent Location */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                    Permanent Origin Node
                  </span>
                </div>
                <span className="text-[11px] font-mono text-gray-400">{permanentAddressEn || "Sudurpashchim, Nepal"}</span>
              </div>
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black/50">
                <iframe
                  src={permanentMapUrl}
                  title="Permanent Address Map"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Temporary Location */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                    Present Strategic Headquarters
                  </span>
                </div>
                <span className="text-[11px] font-mono text-gray-400">{temporaryAddressEn || "Kathmandu, Nepal"}</span>
              </div>
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black/50">
                <iframe
                  src={temporaryMapUrl}
                  title="Temporary Address Map"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
