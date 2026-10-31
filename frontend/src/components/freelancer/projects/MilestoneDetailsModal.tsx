"use client";

import React from "react";
import {
  X,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import { ProjectMilestone } from "@/lib/freelancer-projects-types";
import {
  getWorkStatusConfig,
  getPaymentStatusConfig,
} from "@/lib/freelancer-projects-data";

interface MilestoneDetailsModalProps {
  milestone: ProjectMilestone;
  onClose: () => void;
  onOpenSubmitModal: (milestone: ProjectMilestone) => void;
  onSendMessage?: () => void;
}

export default function MilestoneDetailsModal({
  milestone,
  onClose,
  onOpenSubmitModal,
  onSendMessage,
}: MilestoneDetailsModalProps) {
  const workConfig = getWorkStatusConfig(milestone.workStatus);
  const payConfig = getPaymentStatusConfig(milestone.paymentStatus);
  const latestSub = milestone.submissions[milestone.submissions.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                {milestone.title}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Agreed Value: <strong>{milestone.amountDisplay}</strong> · Due: {milestone.dueDate}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State Separation Banner */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Work Status
            </p>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border mt-1 ${workConfig.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${workConfig.dotClass}`} />
              {workConfig.label}
            </span>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Payment Status
            </p>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border mt-1 ${payConfig.badgeClass}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {payConfig.label}
            </span>
          </div>
        </div>

        {/* Client Feedback / Review Decision */}
        {latestSub?.clientFeedback ? (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Client Review: {latestSub.clientFeedback.decision}</span>
              </div>
              <span className="text-[10px] text-emerald-700">
                {latestSub.clientFeedback.reviewedAt}
              </span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed italic">
              &quot;{latestSub.clientFeedback.feedbackMessage}&quot;
            </p>
            <p className="text-[10px] text-emerald-600 font-medium">
              Reviewed by {latestSub.clientFeedback.reviewedByName}
            </p>
          </div>
        ) : milestone.workStatus === "AWAITING_CLIENT_REVIEW" ? (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-bold">Awaiting Client Review</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                The client has been notified to review your deliverable submission. You can follow up via the mediated project chat.
              </p>
            </div>
          </div>
        ) : null}

        {/* Deliverable & Submission Info */}
        {latestSub && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900">Submitted Deliverables</h4>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
              <p className="text-slate-700">
                <strong>Notes:</strong> {latestSub.completionNote}
              </p>

              {latestSub.githubPrUrl && (
                <div className="flex items-center gap-1.5 text-[#4f46e5]">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <a
                    href={latestSub.githubPrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline truncate font-medium"
                  >
                    {latestSub.githubPrUrl}
                  </a>
                </div>
              )}

              {latestSub.demoUrl && (
                <div className="flex items-center gap-1.5 text-[#4f46e5]">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <a
                    href={latestSub.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline truncate font-medium"
                  >
                    {latestSub.demoUrl}
                  </a>
                </div>
              )}

              {latestSub.attachmentName && (
                <div className="flex items-center gap-2 pt-1 text-slate-600">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{latestSub.attachmentName}</span>
                  <span className="text-[10px] text-slate-400">({latestSub.attachmentSize})</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Acceptance Criteria */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900">Acceptance Criteria</h4>
          <div className="space-y-1.5">
            {milestone.acceptanceCriteria.map((crit, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs text-slate-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{crit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {onSendMessage && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSendMessage();
              }}
              className="py-2 px-3 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-xs font-bold text-[#4f46e5] transition cursor-pointer"
            >
              Message Client in Workspace
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Close
            </button>
            {milestone.workStatus !== "ACCEPTED" && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSubmitModal(milestone);
                }}
                className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Resubmit Work</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
