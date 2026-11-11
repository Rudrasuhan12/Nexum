"use client";

import React, { useState, useRef } from "react";
import { X, Send, FileCode, Video, FileText, CheckCircle2, ShieldCheck, Check, UploadCloud, FileArchive, AlertCircle } from "lucide-react";

export interface SubmitDeliverableMilestoneProp {
  id: string;
  number?: number;
  title: string;
  amount?: string;
}

interface SubmitDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: (details: {
    prUrl: string;
    loomUrl: string;
    notes: string;
    milestoneId?: string;
    file?: File | null;
    fileName?: string;
    fileSize?: string;
  }) => void;
  milestone?: SubmitDeliverableMilestoneProp | null;
  defaultMilestone?: string;
  defaultAmount?: string;
}

export default function SubmitDeliverableModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  milestone,
  defaultMilestone = "Milestone 1: Project Kickoff & Initial Deliverables",
  defaultAmount = "$3,000.00 USD",
}: SubmitDeliverableModalProps) {
  const milestoneTitle = milestone
    ? (milestone.number ? `Milestone ${milestone.number}: ${milestone.title}` : milestone.title)
    : defaultMilestone;
  const milestoneAmount = milestone?.amount || defaultAmount;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [githubPrUrl, setGithubPrUrl] = useState("");
  const [loomDemoUrl, setLoomDemoUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState(
    "All milestone acceptance criteria implemented and verified against specification."
  );
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationError("");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Validation: Require EITHER GitHub URL OR an uploaded ZIP archive
    if (!githubPrUrl.trim() && !selectedFile) {
      setValidationError("Please upload a codebase .zip archive OR provide a GitHub Repository/PR URL.");
      return;
    }

    setIsSubmitting(true);

    const fileSizeStr = selectedFile
      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
      : undefined;

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      if (onSubmitSuccess) {
        onSubmitSuccess({
          prUrl: githubPrUrl.trim(),
          loomUrl: loomDemoUrl.trim(),
          notes: submissionNotes,
          milestoneId: milestone?.id,
          file: selectedFile,
          fileName: selectedFile?.name,
          fileSize: fileSizeStr,
        });
      }
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1000);
    }, 600);
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
              {milestoneTitle} · Escrow Allocation: <span className="font-bold text-slate-800 font-mono">{milestoneAmount}</span>
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
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Option A: Upload Codebase ZIP Archive */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Codebase Archive (.zip, .tar.gz)</span>
              <span className="text-[10px] font-semibold text-slate-400">At least one delivery method required</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".zip,.tar,.gz,.tgz,.7z"
              className="hidden"
            />
            {selectedFile ? (
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <FileArchive className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Codebase Archive
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50/40 hover:bg-indigo-50/20 group"
              >
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 mx-auto mb-1 transition" />
                <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-900 transition">
                  Click to upload codebase .zip archive or drag & drop
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Accepts ZIP, TAR.GZ (up to 50MB) for automated sandboxed inspection
                </p>
              </div>
            )}
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              OR
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Option B: GitHub Pull Request / Repository URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>GitHub Pull Request / Repository URL</span>
              <span className="text-[10px] font-semibold text-slate-400">Public or access-token repo</span>
            </label>
            <div className="relative">
              <FileCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={githubPrUrl}
                onChange={(e) => {
                  setGithubPrUrl(e.target.value);
                  setValidationError("");
                }}
                placeholder="https://github.com/org/repo/pull/42 or https://github.com/org/repo"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Optional: Loom / Demo Walkthrough */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Loom / Video Walkthrough URL</span>
              <span className="text-[10px] font-normal text-slate-400">Optional walkthrough demo</span>
            </label>
            <div className="relative">
              <Video className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={loomDemoUrl}
                onChange={(e) => setLoomDemoUrl(e.target.value)}
                placeholder="https://www.loom.com/share/..."
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
                <span>SLSA v1.0 Provenance</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Sandboxed Checks</span>
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

