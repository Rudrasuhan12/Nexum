"use client";

import React, { useState } from "react";
import { X, Send, FileCode, Video, FileText, CheckCircle2, ShieldCheck, Check } from "lucide-react";

interface SubmitDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: (details: { prUrl: string; loomUrl: string; notes: string }) => void;
  defaultMilestone?: string;
  defaultAmount?: string;
}

export default function SubmitDeliverableModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  defaultMilestone = "Milestone 2: Frontend Development & Orders Engine",
  defaultAmount = "$4,000.00 USD",
}: SubmitDeliverableModalProps) {
  const [githubPrUrl, setGithubPrUrl] = useState("https://github.com/techkart/storefront/pull/42");
  const [loomDemoUrl, setLoomDemoUrl] = useState("https://www.loom.com/share/techkart-milestone2-demo");
  const [submissionNotes, setSubmissionNotes] = useState(
    "All milestone acceptance criteria implemented: PayPal v2 order capture verified, idempotency cache deduplicates within 30s window, and SHA-256 state consensus signatures match test vector."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      if (onSubmitSuccess) {
        onSubmitSuccess({
          prUrl: githubPrUrl,
          loomUrl: loomDemoUrl,
          notes: submissionNotes,
        });
      }
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1200);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-b from-slate-50/70 to-white">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#4f46e5] bg-[#eef2ff] border border-indigo-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Consensus Deliverable Station</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Submit Milestone Deliverable
            </h3>
            <p className="text-xs text-slate-500">
              {defaultMilestone} · Escrow Allocation: <span className="font-bold text-slate-800 font-mono">{defaultAmount}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer shrink-0 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              GitHub Pull Request URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FileCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={githubPrUrl}
                onChange={(e) => setGithubPrUrl(e.target.value)}
                placeholder="https://github.com/org/repo/pull/42"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Loom / Video Walkthrough URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Video className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={loomDemoUrl}
                onChange={(e) => setLoomDemoUrl(e.target.value)}
                placeholder="https://www.loom.com/share/..."
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Deliverable Verification Notes & Test Results
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none leading-relaxed transition shadow-2xs"
              />
            </div>
          </div>

          {/* Consensus Verification Criteria */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Automated Dual Consensus Pre-Checks
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>SHA-256 Signatures Valid</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>30s Idempotency Cache</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Mock Capture Passed</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer ${
                isSubmitted
                  ? "bg-emerald-600"
                  : "bg-[#4f46e5] hover:bg-[#4338ca] active:scale-98"
              }`}
            >
              {isSubmitted ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Deliverable Logged to Consensus!</span>
                </>
              ) : isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Verifying Hashing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Deliverable to Client</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

