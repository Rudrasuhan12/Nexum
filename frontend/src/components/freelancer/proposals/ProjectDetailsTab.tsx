"use client";

import React from "react";
import {
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Code,
} from "lucide-react";
import { FreelancerProposalItem } from "@/lib/freelancer-proposals-types";

interface ProjectDetailsTabProps {
  proposal: FreelancerProposalItem;
}

export default function ProjectDetailsTab({ proposal }: ProjectDetailsTabProps) {
  const { clientBrief } = proposal;

  return (
    <div className="space-y-6">
      {/* 1. Project Overview & Client Requirements */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#4f46e5]" />
            <span>Original Client Brief</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            {clientBrief.category}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {clientBrief.description}
        </p>

        {/* Client Budget & Deadline Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Client Budget Range
            </p>
            <p className="text-xs font-black text-slate-900 mt-0.5">
              {clientBrief.budgetRange}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Expected Duration
            </p>
            <p className="text-xs font-bold text-slate-900 mt-0.5">
              {clientBrief.duration}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Project Deadline
            </p>
            <p className="text-xs font-bold text-slate-900 mt-0.5">
              {clientBrief.deadline}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Technical Requirements */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Code className="w-4 h-4 text-[#4f46e5]" />
          <span>Technical Requirements</span>
        </h3>

        <div className="space-y-2">
          {clientBrief.technicalRequirements.map((req, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs text-slate-700"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] shrink-0 mt-1.5" />
              <span>{req}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Acceptance Criteria & Skills */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Client Acceptance Criteria</span>
        </h3>

        <div className="space-y-2">
          {clientBrief.acceptanceCriteria.map((crit, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-900"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{crit}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-700 mb-2">Required Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {clientBrief.requiredSkills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
