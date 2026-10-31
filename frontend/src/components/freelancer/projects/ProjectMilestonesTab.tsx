"use client";

import React from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  MessageSquare,
  FileText,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import {
  FreelancerProjectItem,
  ProjectMilestone,
} from "@/lib/freelancer-projects-types";
import {
  getWorkStatusConfig,
  getPaymentStatusConfig,
} from "@/lib/freelancer-projects-data";

interface ProjectMilestonesTabProps {
  project: FreelancerProjectItem;
  onOpenSubmitModal: (milestone: ProjectMilestone) => void;
  onOpenDetailsModal: (milestone: ProjectMilestone) => void;
  onOpenProposeModal: () => void;
  onSendMessageAction?: () => void;
  showToast: (msg: string) => void;
}

export default function ProjectMilestonesTab({
  project,
  onOpenSubmitModal,
  onOpenDetailsModal,
  onOpenProposeModal,
  onSendMessageAction,
  showToast,
}: ProjectMilestonesTabProps) {
  return (
    <div className="space-y-6">
      {/* 1. Header with title and Propose New Milestone button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Milestones ({project.milestones.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bilateral deliverable scope, independent work verification, and payment tracking.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenProposeModal}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-xs font-bold text-[#4f46e5] transition shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Propose New Milestone</span>
        </button>
      </div>

      {/* 2. Milestones List */}
      <div className="space-y-3.5">
        {project.milestones.map((ms) => {
          const workConfig = getWorkStatusConfig(ms.workStatus);
          const payConfig = getPaymentStatusConfig(ms.paymentStatus);

          return (
            <div
              key={ms.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 transition hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Status Indicator Icon */}
                  <div className="mt-0.5 shrink-0">
                    {ms.workStatus === "ACCEPTED" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                    ) : ms.workStatus === "AWAITING_CLIENT_REVIEW" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        {ms.title}
                      </h3>
                      {/* Work Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${workConfig.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${workConfig.dotClass}`} />
                        {workConfig.label}
                      </span>
                      {/* Payment Status Badge (Separate Dimension) */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${payConfig.badgeClass}`}
                        title="Payment State"
                      >
                        <ShieldCheck className="w-3 h-3 text-current opacity-80" />
                        {payConfig.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {ms.description}
                    </p>

                    {/* Meta row: dates & subtexts */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Due {ms.dueDate}
                      </span>
                      {ms.submittedAt && (
                        <span>· Submitted {ms.submittedAt}</span>
                      )}
                      {ms.approvedAt && (
                        <span>· Approved {ms.approvedAt}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Action Button */}
                <div className="text-right shrink-0 flex flex-col items-end justify-between min-h-[56px]">
                  <p className="text-sm font-black text-slate-900 leading-none">
                    {ms.amountDisplay}
                  </p>

                  <div className="mt-2">
                    {ms.workStatus === "ACCEPTED" || ms.workStatus === "AWAITING_CLIENT_REVIEW" ? (
                      <button
                        type="button"
                        onClick={() => onOpenDetailsModal(ms)}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer"
                      >
                        View Details
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenSubmitModal(ms)}
                        className="py-1.5 px-3.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer"
                      >
                        Submit Work
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Cards: Project Progress & Next Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Card A: Project Progress */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Project Progress</h3>
            <span className="text-xs font-extrabold text-[#4f46e5]">
              {project.progressPercent}%
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#4f46e5] h-full rounded-full transition-all"
              style={{ width: `${project.progressPercent}%` }}
            />
          </div>

          <div className="space-y-2.5 pt-1">
            {project.progressSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-2.5 text-xs">
                {step.status === "COMPLETED" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50 shrink-0" />
                ) : step.status === "CURRENT" ? (
                  <div className="w-4 h-4 rounded-full border-2 border-[#4f46e5] flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4f46e5]" />
                  </div>
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span
                  className={
                    step.status === "COMPLETED"
                      ? "text-slate-800 font-semibold"
                      : step.status === "CURRENT"
                      ? "text-slate-900 font-bold"
                      : "text-slate-400 font-medium"
                  }
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card B: Next Actions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Next Actions</h3>
            <button
              type="button"
              onClick={() => showToast("Viewing full chronological project action items.")}
              className="text-[11px] font-bold text-[#4f46e5] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {project.nextActions.map((action) => (
              <div
                key={action.id}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-white border border-slate-200/60 shadow-2xs text-[#4f46e5] shrink-0">
                    {action.iconType === "MESSAGE" ? (
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    ) : action.iconType === "DOCUMENT" ? (
                      <FileText className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <CalendarDays className="w-3.5 h-3.5 text-purple-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {action.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {action.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (action.actionType === "MESSAGE" && onSendMessageAction) {
                      onSendMessageAction();
                    } else if (action.actionType === "REMINDER") {
                      showToast(`Reminder set: ${action.title}`);
                    } else {
                      showToast(`Meeting proposed to ${project.client.companyName}.`);
                    }
                  }}
                  className="py-1 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {action.actionLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
