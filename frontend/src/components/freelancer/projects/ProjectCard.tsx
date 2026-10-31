"use client";

import React from "react";
import { CheckCircle2, ChevronRight, Cpu, FileText } from "lucide-react";
import { FreelancerProjectItem } from "@/lib/freelancer-projects-types";

interface ProjectCardProps {
  project: FreelancerProjectItem;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ProjectCard({
  project,
  isSelected,
  onSelect,
}: ProjectCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 sm:p-5 rounded-2xl bg-white border transition cursor-pointer relative ${
        isSelected
          ? "border-[#4f46e5] ring-2 ring-[#4f46e5]/15 shadow-sm"
          : "border-slate-200/90 hover:border-slate-300 hover:shadow-2xs"
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Thumbnail / Category Icon */}
        <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden bg-gradient-to-br from-indigo-50 to-slate-100 border border-slate-100 flex items-center justify-center">
          {project.thumbnailType === "AI_ICON" ? (
            <Cpu className="w-6 h-6 text-[#4f46e5]" />
          ) : project.thumbnailType === "CERT_ICON" ? (
            <FileText className="w-6 h-6 text-[#4f46e5]" />
          ) : (
            <div className="w-full h-full p-1 flex items-center justify-center">
              <div className="w-full h-full rounded-lg bg-slate-900/90 text-[10px] text-white flex flex-col items-center justify-center font-mono font-bold">
                <span className="text-[9px] text-indigo-300 font-sans">app</span>
                <span>preview</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">
              {project.title}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${project.statusBadgeColor}`}
            >
              {project.statusLabel}
            </span>
          </div>

          {/* Client & Verification */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs font-semibold text-slate-700 truncate">
              {project.client.companyName}
            </span>
            {project.client.verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 fill-blue-50" />
            )}
          </div>

          {/* Dates */}
          <p className="text-[11px] text-slate-400 mt-0.5">
            Started {project.startDate} · Due {project.dueDate}
          </p>

          {/* Progress Bar & Amount Row */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex-1 max-w-[140px]">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#4f46e5] h-full rounded-full transition-all"
                  style={{ width: `${project.progressPercent}%` }}
                />
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-700">
              {project.progressPercent}%
            </span>
            <div className="text-right ml-auto">
              <p className="text-xs font-extrabold text-slate-900 leading-none">
                {project.totalBudgetDisplay}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Fixed Price</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Tech Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
            {project.techTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 text-[10px] font-medium text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

