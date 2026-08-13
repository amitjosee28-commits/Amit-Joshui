import React, { useState } from "react";
import { MessageSquare, MapPin, Send, CheckCircle2 } from "lucide-react";
import { ref, push, set } from "firebase/database";
import { db } from "../firebase";

interface ContactFormProps {
  lang: "en" | "np";
  permanentMapUrl: string;
  temporaryMapUrl: string;
  permanentAddressEn?: string;
  permanentAddressNp?: string;
  temporaryAddressEn?: string;
  temporaryAddressNp?: string;
}

export default function ContactForm({ 
  lang, 
  permanentMapUrl, 
  temporaryMapUrl,
  permanentAddressEn,
  permanentAddressNp,
  temporaryAddressEn,
  temporaryAddressNp
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
      alert(lang === "en" ? "Please fill in all required fields." : "कृपया सबै आवश्यक क्षेत्रहरू भर्नुहोस्।");
      return;
    }

    const gmailCleaned = formData.gmail.trim().toLowerCase();
    const phoneCleaned = formData.phone.trim();

    // Gmail validation: must end with @gmail.com
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(gmailCleaned)) {
      alert(
        lang === "en"
          ? "Please enter a valid Gmail address (must contain @ and end with gmail.com)."
          : "कृपया मान्य जिमेल (Gmail) ठेगाना राख्नुहोस् (@ र gmail.com अनिवार्य छ)।"
      );
      return;
    }

    // Nepali mobile number validation: 10 digits starting with 9
    const phoneRegex = /^9\d{9}$/;
    if (!phoneRegex.test(phoneCleaned)) {
      alert(
        lang === "en"
          ? "Please enter a valid 10-digit Nepali mobile number starting with 9."
          : "कृपया ९ बाट सुरु हुने ठीक १० अंकको मान्य नेपाली मोबाइल नम्बर राख्नुहोस्।"
      );
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
        remarks: lang === "en" ? "Suggestion received and logged." : "सुझाव प्राप्त भयो।",
        timestamp: new Date().toISOString()
      });

      setSubmittedTrackingId(trackingId);
      setSubmitted(true);
      // Reset Form
      setFormData({
        name: "",
        address: "",
        gmail: "",
        phone: "",
        message: "",
      });
    } catch (err) {
      console.error("Error submitting suggestion to Firebase:", err);
      alert(lang === "en" ? "Failed to send suggestion. Please try again." : "सुझाव पठाउन असफल भयो। कृपया पुनः प्रयास गर्नुहोस्।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact-section" className="py-20 relative border-t border-white/5 scroll-mt-24">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
            <MessageSquare className="h-4 w-4 text-cyan-400" />
            <span 
              className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase"
              data-en="Contact Gateway"
              data-np="सम्पर्क केन्द्र"
            >
              {lang === "en" ? "Contact Gateway" : "सम्पर्क केन्द्र"}
            </span>
          </div>
          <h2 
            className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans"
            data-en="Suggestion Box & Location Maps"
            data-np="सुझाव पेटिका र स्थान नक्सा"
          >
            {lang === "en" ? "Suggestion Box & Location Maps" : "सुझाव पेटिका र स्थान नक्सा"}
          </h2>
          <p 
            className="text-gray-400 mt-3 max-w-xl mx-auto text-sm"
            data-en="Drop critical suggestions directly into Amit's database or inspect physical address nodes."
            data-np="अमितको डाटाबेसमा सिधै महत्त्वपूर्ण सुझावहरू पठाउनुहोस् वा भौतिक ठेगानाहरू निरीक्षण गर्नुहोस्।"
          >
            {lang === "en" ? "Drop critical suggestions directly into Amit's database or inspect physical address nodes." : "अमितको डाटाबेसमा सिधै महत्त्वपूर्ण सुझावहरू पठाउनुहोस् वा भौतिक ठेगानाहरू निरीक्षण गर्नुहोस्।"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-6xl mx-auto items-start">
          
          {/* LEFT COLUMN: Suggestion Box Form (5 Cols) */}
          <div className="lg:col-span-5 bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
            <h3 
              className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-3 flex items-center space-x-2 font-sans"
              data-en="Send Suggestion / Query"
              data-np="सुझाव वा सोधपुछ पठाउनुहोस्"
            >
              <Send className="h-4 w-4 text-cyan-400" />
              <span>{lang === "en" ? "Send Suggestion / Query" : "सुझाव वा सोधपुछ पठाउनुहोस्"}</span>
            </h3>

            {submitted ? (
              <div className="text-center py-10 px-4 space-y-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
                <div className="inline-flex p-3 rounded-full bg-cyan-500/10 text-cyan-400">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>
                <h4 className="text-base font-bold text-white">
                  {lang === "en" ? "Submission Successful!" : "प्रविष्टि सफल भयो!"}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {lang === "en" 
                    ? "Congratulations! Your suggestion has been submitted successfully."
                    : "बधाई छ! तपाईंको सुझाव सफलतापूर्वक दर्ता भएको छ।"}
                </p>
                {submittedTrackingId && (
                  <div className="p-3 bg-black/60 border border-purple-500/30 rounded-xl max-w-xs mx-auto font-mono text-center">
                    <span className="text-gray-400 text-[10px] uppercase block mb-0.5">Suggestion Tracking ID</span>
                    <span className="text-base font-bold text-purple-400 tracking-wider select-all">{submittedTrackingId}</span>
                  </div>
                )}
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
                >
                  {lang === "en" ? "Send another message" : "अर्को सन्देश पठाउनुहोस्"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name field */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase text-gray-400 block">
                    {lang === "en" ? "Full Name *" : "पूरा नाम *"}
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={lang === "en" ? "Amit Sharma" : "अमित शर्मा"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                {/* Address field */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase text-gray-400 block">
                    {lang === "en" ? "Address" : "ठेगाना"}
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={lang === "en" ? "Koteshwor, Kathmandu" : "कोटेश्वर, काठमाडौं"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                {/* Gmail address field */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase text-gray-400 block">
                    {lang === "en" ? "Gmail Address *" : "जिमेल ठेगाना *"}
                  </label>
                  <input
                    type="email"
                    name="gmail"
                    required
                    value={formData.gmail}
                    onChange={handleChange}
                    placeholder="amit@gmail.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors font-mono"
                  />
                </div>

                {/* Nepali mobile number field */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase text-gray-400 block">
                    {lang === "en" ? "Nepali Mobile Number *" : "नेपाली मोबाइल नम्बर *"}
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-white/10 bg-white/5 text-xs text-gray-400 font-mono font-bold select-none">
                      +977
                    </span>
                    <input
                      type="text"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9XXXXXXXXX"
                      className="w-full bg-white/5 border border-white/10 rounded-r-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Message field */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase text-gray-400 block">
                    {lang === "en" ? "Message Payload *" : "मुख्य सन्देश *"}
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={lang === "en" ? "Type details or consultation queries..." : "विवरण वा परामर्श सोधपुछ टाइप गर्नुहोस्..."}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                  />
                </div>

                {/* Submit trigger button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/10 active:scale-95 duration-150 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span data-en="Submit Suggestion" data-np="सुझाव बुझाउनुहोस्">
                    {lang === "en" ? (loading ? "Submitting..." : "Submit Suggestion") : (loading ? "बुझाउँदै..." : "सुझाव बुझाउनुहोस्")}
                  </span>
                </button>
              </form>
            )}
          </div>

          {/* RIGHT COLUMN: Responsive Location Map Viewers (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Current address map (Temporary / Work) */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-3">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-2 text-white">
                <MapPin className="h-4 w-4 text-purple-400" />
                <h4 className="text-sm font-bold font-sans">
                  {lang === "en" 
                    ? (temporaryAddressEn || "Current Address: New Baneshwor, Kathmandu") 
                    : (temporaryAddressNp || "हालको ठेगाना: नयाँ बानेश्वर, काठमाडौं")}
                </h4>
              </div>
              <div className="h-[210px] w-full rounded-xl border border-white/5 overflow-hidden shadow-inner relative bg-black/40">
                {temporaryMapUrl ? (
                  <iframe
                    src={temporaryMapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    title="Current Address Map"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-mono text-gray-500">
                    Map Not Available
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none rounded-xl border border-white/10" />
              </div>
            </div>

            {/* Permanent address map */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-3">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-2 text-white">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <h4 className="text-sm font-bold font-sans">
                  {lang === "en" 
                    ? (permanentAddressEn || "Permanent Address: Duhu 3, Darchula") 
                    : (permanentAddressNp || "स्थायी ठेगाना: दुहु ३, दार्चुला")}
                </h4>
              </div>
              <div className="h-[210px] w-full rounded-xl border border-white/5 overflow-hidden shadow-inner relative bg-black/40">
                {permanentMapUrl ? (
                  <iframe
                    src={permanentMapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    title="Permanent Address Map"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-mono text-gray-500">
                    Map Not Available
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none rounded-xl border border-white/10" />
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
