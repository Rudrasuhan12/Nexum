"use client";

import React from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { FreelancerProposalItem } from "@/lib/freelancer-proposals-types";

interface SelectedProposalHeaderProps {
  proposal: FreelancerProposalItem;
  currentIndex: number;
  totalCount: number;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onBackToDirectory?: () => void;
  onViewProject: () => void;
}

export default function SelectedProposalHeader({
  proposal,
  currentIndex,
  totalCount,
  onNavigatePrev,
  onNavigateNext,
  onBackToDirectory,
  onViewProject,
}: SelectedProposalHeaderProps) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
      {/* Top navigation row */}
      <div className="flex items-center justify-between gap-3">
        {onBackToDirectory && (
          <button
            type="button"
            onClick={onBackToDirectory}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer lg:hidden"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Proposals</span>
          </button>
        )}

        <div className="hidden lg:block text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          Proposal Details
        </div>

        {/* Previous / Next Stepper */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 ml-auto">
          <button
            type="button"
            onClick={onNavigatePrev}
            disabled={currentIndex <= 0}
            className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title="Previous Proposal"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span>
            {currentIndex + 1} / {totalCount}
          </span>
          <button
            type="button"
            onClick={onNavigateNext}
            disabled={currentIndex >= totalCount - 1}
            className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title="Next Proposal"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title & Status */}
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {proposal.projectTitle}
          </h1>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${proposal.statusBadgeColor}`}
          >
            {proposal.statusLabel}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Submitted on {proposal.submittedDate}, {proposal.submittedTime}
        </p>
      </div>

      {/* Client Card */}
      <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${proposal.client.avatarBg}`}
          >
            {proposal.client.avatarLetter}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 truncate">
                {proposal.client.companyName}
              </span>
              {proposal.client.verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 fill-blue-50" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {proposal.client.industry} · {proposal.client.companySize} · Posted on {proposal.client.postedDate}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewProject}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer shrink-0"
        >
          <span>View Project</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
