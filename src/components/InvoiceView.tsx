import React, { useState, useEffect } from "react";
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  QrCode, 
  ShieldCheck, 
  FileText, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { ServiceInvoice } from "../utils/defaultData";

interface InvoiceViewProps {
  invoice: ServiceInvoice;
  onBack?: () => void;
  onUpdateStatus?: (newStatus: ServiceInvoice["paymentStatus"]) => void;
  isAdmin?: boolean;
  lang?: "en" | "np";
}

export default function InvoiceView({
  invoice,
  onBack,
  onUpdateStatus,
  isAdmin = false,
  lang = "en"
}: InvoiceViewProps) {
  const [copiedEsewa, setCopiedEsewa] = useState(false);
  const [copiedKhalti, setCopiedKhalti] = useState(false);

  const effectiveStatus = invoice.paymentStatus || "Pending";

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (text: string, type: "esewa" | "khalti") => {
    navigator.clipboard.writeText(text);
    if (type === "esewa") {
      setCopiedEsewa(true);
      setTimeout(() => setCopiedEsewa(false), 2000);
    } else {
      setCopiedKhalti(true);
      setTimeout(() => setCopiedKhalti(false), 2000);
    }
  };

  return (
    <div id="invoice-view-container" className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white print:text-black">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Action Bar (Hidden on Print) */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden border-b border-white/10 pb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-gray-400 hover:text-amber-400 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>{lang === "np" ? "फर्कनुहोस्" : "Back"}</span>
            </button>
          )}

          <div className="flex items-center space-x-3 ml-auto">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>{lang === "np" ? "इनभ्वाइस छाप्नुहोस् / PDF" : "Print / Save PDF"}</span>
            </button>

            {isAdmin && onUpdateStatus && (
              <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
                <span className="text-[11px] font-mono text-gray-400">Admin Action:</span>
                <select
                  value={invoice.paymentStatus}
                  onChange={(e) => onUpdateStatus(e.target.value as any)}
                  className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-amber-400 font-mono outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Mark Paid</option>
                  <option value="Expired">Mark Expired</option>
                  <option value="Cancelled">Mark Cancelled</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Printable Official Invoice Card */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 print:border-none print:shadow-none print:p-0 print:bg-transparent print:text-black">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-white/10 print:border-black/20 pb-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <img
                  src="/profile.jpg"
                  alt="Amit Joshi Solutions"
                  className="w-12 h-12 rounded-xl object-cover border border-amber-500/40 print:border-black"
                />
                <div>
                  <h1 className="text-xl font-extrabold text-white print:text-black tracking-tight font-serif">
                    AMIT JOSHI SOLUTIONS
                  </h1>
                  <p className="text-xs font-mono text-amber-400 print:text-black">
                    Official Architectural & Software Consulting
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-400 print:text-black/70 space-y-0.5 pt-1">
                <p>Kathmandu / Darchula, Nepal</p>
                <p>Email: amit@amitjoshi.info.np &bull; Web: https://amitjoshi.info.np</p>
                <p className="font-mono">PAN / Reg No: 609823411 (Gov of Nepal Registered)</p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="text-left sm:text-right space-y-2">
              <div className="inline-block">
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
                  effectiveStatus === "Paid" 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 print:text-emerald-700" 
                    : effectiveStatus === "Expired"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400 print:text-rose-700"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400 print:text-amber-700"
                }`}>
                  {effectiveStatus}
                </span>
              </div>

              <div className="text-xs font-mono text-gray-400 print:text-black/80 space-y-1">
                <p><span className="font-bold text-white print:text-black">Invoice No:</span> {invoice.invoiceId}</p>
                <p><span className="font-bold text-white print:text-black">Req Ref:</span> {invoice.submissionId}</p>
                <p><span className="font-bold text-white print:text-black">Date Issued:</span> {new Date(invoice.submittedAt).toLocaleDateString()}</p>
                <p><span className="font-bold text-white print:text-black">Status:</span> {effectiveStatus}</p>
              </div>
            </div>
          </div>

          {/* Bill To & Service Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/[0.02] print:bg-transparent border border-white/5 print:border-black/10 rounded-2xl p-4 sm:p-6">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase text-amber-400 print:text-black tracking-wider mb-2">
                Billed To (Client Details)
              </h3>
              <div className="text-sm font-bold text-white print:text-black">{invoice.clientName}</div>
              <div className="text-xs text-gray-400 print:text-black/70 space-y-0.5 mt-1">
                <p>Phone: {invoice.clientPhone}</p>
                <p>Email: {invoice.clientEmail}</p>
                {invoice.clientAddress && <p>Address: {invoice.clientAddress}</p>}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-mono font-bold uppercase text-amber-400 print:text-black tracking-wider mb-2">
                Service Order Details
              </h3>
              <div className="text-sm font-bold text-white print:text-black">{invoice.serviceTitle}</div>
              <div className="text-xs text-gray-400 print:text-black/70 space-y-0.5 mt-1">
                <p>Service ID: {invoice.serviceId}</p>
                <p>Payment Mode: Digital Escrow / Direct Mobile Banking</p>
                <p>Currency: {invoice.currency || "NPR"}</p>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 print:border-black/20 text-gray-400 print:text-black uppercase tracking-wider">
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-right">Unit Rate</th>
                  <th className="py-3 px-2 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-black/10 text-gray-300 print:text-black">
                <tr>
                  <td className="py-4 px-2">
                    <p className="font-bold text-white print:text-black text-sm">{invoice.serviceTitle}</p>
                    <p className="text-gray-400 print:text-black/70 text-[11px] mt-0.5">
                      Professional Consultation, Architecture Deployment, and Technical Setup
                    </p>
                  </td>
                  <td className="py-4 px-2 text-center">1</td>
                  <td className="py-4 px-2 text-right">
                    {invoice.amountFormatted || `NPR ${invoice.amount?.toLocaleString()}`}
                  </td>
                  <td className="py-4 px-2 text-right font-bold text-white print:text-black">
                    {invoice.amountFormatted || `NPR ${invoice.amount?.toLocaleString()}`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-white/10 print:border-black/20">
            
            {/* Payment Details & Instructions */}
            <div className="space-y-3 max-w-sm">
              <h4 className="text-xs font-mono font-bold text-amber-400 print:text-black uppercase tracking-wider flex items-center space-x-1.5">
                <QrCode className="h-4 w-4" />
                <span>Instant Payment Options</span>
              </h4>

              <div className="space-y-2 text-xs font-mono bg-black/40 print:bg-transparent p-3 rounded-xl border border-white/5 print:border-black/10">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold print:text-black">eSewa ID / Phone:</span>
                  <div className="flex items-center space-x-1.5">
                    <code className="text-white print:text-black font-bold">9800000000</code>
                    <button
                      onClick={() => copyToClipboard("9800000000", "esewa")}
                      className="text-gray-400 hover:text-amber-400 print:hidden cursor-pointer"
                      title="Copy eSewa Number"
                    >
                      {copiedEsewa ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-bold print:text-black">Khalti ID / Phone:</span>
                  <div className="flex items-center space-x-1.5">
                    <code className="text-white print:text-black font-bold">9800000000</code>
                    <button
                      onClick={() => copyToClipboard("9800000000", "khalti")}
                      className="text-gray-400 hover:text-amber-400 print:hidden cursor-pointer"
                      title="Copy Khalti Number"
                    >
                      {copiedKhalti ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1 text-[10px] text-gray-500 print:text-black/60">
                  Remark: Please mention invoice #{invoice.invoiceId} in transaction notes.
                </div>
              </div>
            </div>

            {/* Price Calculation Box */}
            <div className="w-full sm:w-64 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-gray-400 print:text-black/70">
                <span>Subtotal:</span>
                <span>{invoice.amountFormatted || `NPR ${invoice.amount?.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between text-gray-400 print:text-black/70">
                <span>Applicable Taxes / VAT:</span>
                <span>NPR 0.00</span>
              </div>
              <div className="flex justify-between text-base font-bold text-amber-400 print:text-black pt-2 border-t border-white/10 print:border-black/20">
                <span>Total Due:</span>
                <span>{invoice.amountFormatted || `NPR ${invoice.amount?.toLocaleString()}`}</span>
              </div>
            </div>

          </div>

          {/* Footer Terms */}
          <div className="pt-6 border-t border-white/5 print:border-black/10 text-[11px] text-gray-500 print:text-black/60 space-y-1">
            <p className="font-bold text-gray-400 print:text-black">Official Notice & Terms:</p>
            <p>1. Please complete payment or transaction verification to proceed with your service request.</p>
            <p>2. Once payment is confirmed, an engineering kickoff consultation will be initiated within 24 business hours.</p>
            <p>3. For direct questions or verification, contact Amit Joshi via WhatsApp (+977 9800000000) or email amit@amitjoshi.info.np.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
