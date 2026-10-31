"use client";

import React from "react";
import {
  CheckCircle2,
  ChevronRight,
  PlusSquare,
  ShoppingCart,
  BarChart2,
  Smartphone,
  FileText,
  GraduationCap,
  Clock,
  Sparkles,
} from "lucide-react";
import { FreelancerProposalItem } from "@/lib/freelancer-proposals-types";

interface ProposalCardProps {
  proposal: FreelancerProposalItem;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ProposalCard({
  proposal,
  isSelected,
  onSelect,
}: ProposalCardProps) {
  const renderIcon = () => {
    switch (proposal.categoryIcon) {
      case "HEALTH":
        return <PlusSquare className="w-5 h-5 text-[#4f46e5]" />;
      case "CART":
        return <ShoppingCart className="w-5 h-5 text-[#4f46e5]" />;
      case "CHART":
        return <BarChart2 className="w-5 h-5 text-[#4f46e5]" />;
      case "MOBILE":
        return <Smartphone className="w-5 h-5 text-[#4f46e5]" />;
      case "CERT":
        return <FileText className="w-5 h-5 text-[#4f46e5]" />;
      case "SCHOOL":
        return <GraduationCap className="w-5 h-5 text-[#4f46e5]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#4f46e5]" />;
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl bg-white border transition cursor-pointer relative ${
        isSelected
          ? "border-[#4f46e5] ring-2 ring-[#4f46e5]/15 shadow-sm"
          : "border-slate-200/90 hover:border-slate-300 hover:shadow-2xs"
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Category Thumbnail */}
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
          {renderIcon()}
        </div>

        {/* Middle & Right Content */}
        <div className="flex-1 min-w-0">
          {/* Top Row: Title + Status Pill */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
              {proposal.projectTitle}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${proposal.statusBadgeColor}`}
            >
              {proposal.statusLabel}
            </span>
          </div>

          {/* Client & Verification */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-semibold text-slate-700 truncate">
              {proposal.client.companyName}
            </span>
            {proposal.client.verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 fill-blue-50" />
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {proposal.techTags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 text-[10px] font-medium text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Bottom Row: Budget & Duration + Date + Chevron */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3 text-[11px] text-slate-600 font-semibold">
              <span className="font-bold text-slate-900">
                {proposal.clientBrief.budgetRange}
              </span>
              <span className="flex items-center gap-1 text-slate-400 font-normal">
                <Clock className="w-3 h-3 text-slate-400" />
                {proposal.clientBrief.duration}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">
                Submitted on {proposal.submittedDate}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

