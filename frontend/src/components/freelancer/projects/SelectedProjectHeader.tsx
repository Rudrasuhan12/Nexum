"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  MoreHorizontal,
  Calendar,
  CheckCircle2,
  Share2,
  FileDown,
  Check,
} from "lucide-react";
import { FreelancerProjectItem } from "@/lib/freelancer-projects-types";

interface SelectedProjectHeaderProps {
  project: FreelancerProjectItem;
  onBackToDirectory?: () => void;
  onOpenWorkspace: () => void;
  showToast: (msg: string) => void;
}

export default function SelectedProjectHeader({
  project,
  onBackToDirectory,
  onOpenWorkspace,
  showToast,
}: SelectedProjectHeaderProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopied(true);
    showToast("Project link copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
    setShowMoreMenu(false);
  };

  const handleExportBrief = () => {
    showToast("Exporting project brief and consensus agreement PDF...");
    setShowMoreMenu(false);
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-3">
        {onBackToDirectory && (
          <button
            type="button"
            onClick={onBackToDirectory}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer lg:hidden"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </button>
        )}
        <div className="hidden lg:block text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          Project Workspace
        </div>

        <div className="flex items-center gap-2 ml-auto relative">
          <button
            type="button"
            onClick={onOpenWorkspace}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-xs font-bold text-[#4f46e5] transition shadow-2xs cursor-pointer"
          >
            <span>Open in Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="More Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1.5 divide-y divide-slate-100">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Copy Project Link</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportBrief}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export Agreement PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title & Status */}
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {project.title}
          </h1>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${project.statusBadgeColor}`}
          >
            {project.statusLabel}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Metadata strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
        {/* Client */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${project.client.avatarBg}`}
          >
            {project.client.avatarLetter}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {project.client.companyName}
              </p>
              {project.client.verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 fill-blue-50" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Verified Client</p>
          </div>
        </div>

        {/* Start Date */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Started</p>
            <p className="text-xs font-bold text-slate-900">{project.startDate}</p>
          </div>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Due Date</p>
            <p className="text-xs font-bold text-slate-900">{project.dueDate}</p>
          </div>
        </div>

        {/* Project Value */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4f46e5] font-bold text-xs shrink-0">
            ₹
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Project Value</p>
            <p className="text-xs font-extrabold text-slate-900">
              {project.totalBudgetDisplay}
            </p>
            <p className="text-[9px] text-slate-400 font-medium leading-none">Fixed Price</p>
          </div>
        </div>
      </div>
    </div>
  );
}

