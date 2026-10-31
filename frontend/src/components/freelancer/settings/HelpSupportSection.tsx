"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface HelpSupportSectionProps {
  showToast: (msg: string) => void;
}

export default function HelpSupportSection({
  showToast,
}: HelpSupportSectionProps) {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "When are milestone funds released to my PayPal account?",
      a: "Milestone funds are pre-funded into verified escrow prior to contract kickoff. Once the client approves your deliverable package, funds become immediately available for withdrawal.",
    },
    {
      q: "How does AI mediation handle disagreements on project scope?",
      a: "Nexum AI inspects the mutually signed PRD version and canonical hash. It outlines unmet criteria or identifies whether a request represents an out-of-scope change requiring a price counteroffer.",
    },
    {
      q: "What is the difference between PayPal Sandbox and Production payout?",
      a: "In sandbox mode, Order IDs and Capture tokens simulate real-world ledger captures without real banking movement. You can test your automated sweep workflows with 100% fidelity.",
    },
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setTicketSubject("");
      setTicketMessage("");
      showToast("Support inquiry ticket created. Response will arrive within 2 hours.");
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Help & Support
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Search the developer knowledge base or contact Nexum engineering support.
        </p>
      </div>

      {/* 1. FAQs Accordion */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Frequently Asked Questions
        </h3>

        <div className="space-y-2 pt-1">
          {faqs.map((faq, i) => (
            <div
              key={faq.q}
              className="rounded-xl border border-slate-100 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-slate-900 hover:bg-slate-50 transition cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === i && (
                <div className="px-3.5 pb-3.5 text-xs text-slate-500 leading-relaxed border-t border-slate-50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Direct Support Ticket Form */}
      <form
        onSubmit={handleTicketSubmit}
        className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4"
      >
        <h3 className="text-sm font-bold text-slate-900">
          Contact Developer Support
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Issue Subject
            </label>
            <input
              type="text"
              required
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="e.g. PayPal sandbox webhook reconciliation inquiry"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Project Reference
            </label>
            <textarea
              rows={3}
              required
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="Describe what occurred, along with any relevant transaction or milestone IDs..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2.5 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? "Submitting Ticket..." : "Submit Inquiry"}
          </button>
        </div>
      </form>
    </div>
  );
}
