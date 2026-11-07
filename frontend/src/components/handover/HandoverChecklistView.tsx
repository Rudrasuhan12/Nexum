"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  GitBranch,
  FileText,
  Server,
  Key,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Check,
  X,
  UploadCloud,
  FileCode,
  Lock,
} from "lucide-react";
import {
  ProjectHandoverData,
  ProjectHandoverItemData,
  submitHandoverItem,
  reviewHandoverItem,
  finalizeProjectHandover,
} from "@/lib/api-client";

interface HandoverChecklistViewProps {
  projectId: string;
  projectName?: string;
  role: "CLIENT" | "FREELANCER";
  handoverData: ProjectHandoverData;
  onRefresh: () => void;
  showToast?: (msg: string) => void;
  onClose?: () => void;
}

export default function HandoverChecklistView({
  projectId,
  projectName = "Active Project",
  role,
  handoverData,
  onRefresh,
  showToast,
  onClose,
}: HandoverChecklistViewProps) {
  // Submission drawer state (for Freelancer)
  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [fileKeyInput, setFileKeyInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review modal state (for Client)
  const [reviewingItemId, setReviewingItemId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Finalize state
  const [isFinalizing, setIsFinalizing] = useState(false);

  const stats = handoverData.stats;
  const isCompleted = handoverData.status === "COMPLETED";

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "REPOSITORY":
        return <GitBranch className="w-4 h-4 text-purple-600" />;
      case "DOCUMENTATION":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "DEPLOYMENT":
        return <Server className="w-4 h-4 text-emerald-600" />;
      case "CREDENTIALS":
        return <Key className="w-4 h-4 text-amber-600" />;
      case "TESTS":
        return <ShieldCheck className="w-4 h-4 text-cyan-600" />;
      case "IP_TRANSFER":
        return <Award className="w-4 h-4 text-rose-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleOpenSubmit = (item: ProjectHandoverItemData) => {
    setSubmittingItemId(item.id);
    setUrlInput(item.providedUrl || "");
    setFileKeyInput(item.providedFileKey || "");
    setNotesInput(item.providedNotes || "");
  };

  const handleSubmitItem = async (itemId: string) => {
    try {
      setIsSubmitting(true);
      const res = await submitHandoverItem(projectId, itemId, {
        providedUrl: urlInput.trim() || undefined,
        providedFileKey: fileKeyInput.trim() || undefined,
        providedNotes: notesInput.trim() || undefined,
      });

      if (res.success) {
        if (showToast) showToast("Document submitted for review");
        setSubmittingItemId(null);
        onRefresh();
      } else {
        if (showToast) showToast(res.error || "Failed to submit document");
      }
    } catch {
      if (showToast) showToast("Submission error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (itemId: string, decision: "ACCEPTED" | "REVISIONS_REQUESTED") => {
    try {
      setIsReviewing(true);
      const res = await reviewHandoverItem(
        projectId,
        itemId,
        decision,
        decision === "REVISIONS_REQUESTED" ? rejectionNotes.trim() : undefined
      );

      if (res.success) {
        if (showToast)
          showToast(decision === "ACCEPTED" ? "Item verified and accepted" : "Corrections requested");
        setReviewingItemId(null);
        setRejectionNotes("");
        onRefresh();
      } else {
        if (showToast) showToast(res.error || "Review submission failed");
      }
    } catch {
      if (showToast) showToast("Review error");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleFinalize = async () => {
    try {
      setIsFinalizing(true);
      const res = await finalizeProjectHandover(projectId);
      if (res.success) {
        if (showToast) showToast("Project handover finalized! Project marked COMPLETED.");
        onRefresh();
      } else {
        if (showToast) showToast(res.error || "Failed to finalize handover");
      }
    } catch {
      if (showToast) showToast("Finalization error");
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-6 text-slate-900 animate-in fade-in duration-200">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isCompleted ? "bg-emerald-500" : "bg-blue-500 animate-pulse"
              }`}
            />
            <h3 className="font-heading text-lg font-bold text-slate-900">
              Project Handover Checklist &amp; Repository Manifest
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            {isCompleted
              ? `Cryptographic handover completed for ${projectName}. All artifacts are verified.`
              : `Bilateral deliverable transfer for ${projectName}. Documents must be provided and accepted before final sign-off.`}
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-center"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress & Verification Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
        <div>
          <span className="text-slate-400 font-mono text-[10.5px]">TOTAL REQUIREMENTS</span>
          <div className="font-heading text-base font-bold text-slate-900 mt-0.5">
            {stats?.totalItems || handoverData.items.length}
          </div>
        </div>
        <div>
          <span className="text-slate-400 font-mono text-[10.5px]">SUBMITTED</span>
          <div className="font-heading text-base font-bold text-blue-700 mt-0.5">
            {stats?.providedItems || 0}
          </div>
        </div>
        <div>
          <span className="text-slate-400 font-mono text-[10.5px]">VERIFIED &amp; ACCEPTED</span>
          <div className="font-heading text-base font-bold text-emerald-700 mt-0.5">
            {stats?.acceptedItems || 0}
          </div>
        </div>
        <div>
          <span className="text-slate-400 font-mono text-[10.5px]">STATUS</span>
          <div className="font-mono text-xs font-bold mt-1">
            {isCompleted ? (
              <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                COMPLETED
              </span>
            ) : (
              <span className="text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                {stats?.percentComplete || 0}% VERIFIED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cryptographic SHA-256 Manifest Banner (if completed) */}
      {isCompleted && handoverData.contentHash && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-800">
            <Lock className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-bold">Cryptographic Handover SHA-256 Digest:</span>
            <code className="bg-white/80 px-2 py-0.5 rounded font-mono text-[10.5px] border border-emerald-200">
              {handoverData.contentHash}
            </code>
          </div>
          <span className="text-[10.5px] font-mono text-emerald-700 shrink-0">
            Immutable Record
          </span>
        </div>
      )}

      {/* Checklist Items List */}
      <div className="space-y-3">
        {handoverData.items.map((item) => {
          const isItemCompleted = item.status === "ACCEPTED";
          const isItemProvided = item.status === "PROVIDED";
          const isItemRejected = item.status === "REVISIONS_REQUESTED";

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                isItemCompleted
                  ? "bg-white border-emerald-200/90 shadow-2xs"
                  : isItemProvided
                  ? "bg-white border-blue-200/90 shadow-2xs"
                  : isItemRejected
                  ? "bg-white border-amber-200 shadow-2xs"
                  : "bg-slate-50/50 border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                
                {/* Item Details */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-sm font-bold text-slate-900">
                        {item.title}
                      </span>

                      {/* Status Badges */}
                      {isItemCompleted ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          VERIFIED
                        </span>
                      ) : isItemProvided ? (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.2 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          IN REVIEW
                        </span>
                      ) : isItemRejected ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.2 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          REVISION REQUESTED
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.2 rounded-full text-[10px] font-mono font-medium">
                          PENDING
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                      {item.description}
                    </p>

                    {/* Correction feedback alert */}
                    {isItemRejected && item.rejectionReason && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 mt-2">
                        <strong>Client Feedback:</strong> {item.rejectionReason}
                      </div>
                    )}

                    {/* Submitted Links & Files */}
                    {(item.providedUrl || item.providedFileKey || item.providedNotes) && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                        {item.providedUrl && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span className="text-slate-400 font-mono text-[10.5px]">Link:</span>
                            <a
                              href={item.providedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-cobalt hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <span className="truncate max-w-md">{item.providedUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </div>
                        )}

                        {item.providedFileKey && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span className="text-slate-400 font-mono text-[10.5px]">File:</span>
                            <span className="font-mono text-[11px] text-slate-800 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                              {item.providedFileKey}
                            </span>
                          </div>
                        )}

                        {item.providedNotes && (
                          <div className="text-[11px] text-slate-600 mt-1 italic">
                            &quot;{item.providedNotes}&quot;
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {/* FREELANCER ACTIONS */}
                  {role === "FREELANCER" && !isCompleted && (
                    <>
                      {isItemCompleted ? (
                        <span className="text-xs text-emerald-700 font-mono flex items-center gap-1">
                          <Check className="w-4 h-4" /> Accepted
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSubmit(item)}
                          className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                          <span>{isItemProvided ? "Update Link / File" : "Submit Document"}</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* CLIENT ACTIONS */}
                  {role === "CLIENT" && !isCompleted && (
                    <>
                      {isItemCompleted ? (
                        <span className="text-xs text-emerald-700 font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Verified
                        </span>
                      ) : isItemProvided ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReview(item.id, "ACCEPTED")}
                            className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Verify &amp; Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewingItemId(item.id)}
                            className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-2xs transition-colors"
                          >
                            Request Change
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">
                          Awaiting Freelancer Upload
                        </span>
                      )}
                    </>
                  )}
                </div>

              </div>

              {/* Freelancer Inline Submit Form */}
              {submittingItemId === item.id && (
                <div className="mt-3.5 pt-3 border-t border-slate-200/70 space-y-2.5 bg-slate-50/80 p-3 rounded-xl animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Submit {item.title}</span>
                    <button
                      type="button"
                      onClick={() => setSubmittingItemId(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="url"
                    placeholder="URL Link (e.g. https://github.com/org/repo or Figma link)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  />

                  <input
                    type="text"
                    placeholder="File Key / Archive Reference (or upload via Project Files)"
                    value={fileKeyInput}
                    onChange={(e) => setFileKeyInput(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-mono text-[11px]"
                  />

                  <textarea
                    placeholder="Notes, credentials transfer instructions, or documentation overview..."
                    rows={2}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSubmittingItemId(null)}
                      className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || (!urlInput.trim() && !fileKeyInput.trim() && !notesInput.trim())}
                      onClick={() => handleSubmitItem(item.id)}
                      className="px-3.5 py-1 text-xs bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50"
                    >
                      {isSubmitting ? "Submitting..." : "Submit for Verification"}
                    </button>
                  </div>
                </div>
              )}

              {/* Client Revision Modal Form */}
              {reviewingItemId === item.id && (
                <div className="mt-3.5 pt-3 border-t border-slate-200 space-y-2 bg-amber-50/50 p-3 rounded-xl animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span>Request Changes for {item.title}</span>
                    <button
                      type="button"
                      onClick={() => setReviewingItemId(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    placeholder="Describe what corrections or additional documentation are needed..."
                    rows={2}
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    className="w-full text-xs rounded-lg border border-amber-200 bg-white px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewingItemId(null)}
                      className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isReviewing || !rejectionNotes.trim()}
                      onClick={() => handleReview(item.id, "REVISIONS_REQUESTED")}
                      className="px-3.5 py-1 text-xs bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50"
                    >
                      {isReviewing ? "Sending..." : "Send Revision Request"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Bottom Finalize Box */}
      {stats?.isFullyVerified && !isCompleted && role === "CLIENT" && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All Handover Documents Verified &amp; Accepted!</span>
            </div>
            <p className="text-emerald-700 text-[11.5px]">
              You can now finalize the handover, archive the project manifest, and formally close the contract.
            </p>
          </div>
          <button
            type="button"
            disabled={isFinalizing}
            onClick={handleFinalize}
            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isFinalizing ? "Finalizing..." : "Finalize Handover & Close Project"}</span>
          </button>
        </div>
      )}

    </div>
  );
}

