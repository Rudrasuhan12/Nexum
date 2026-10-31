"use client";

import React from "react";
import {
  FileText,
  Clock,
  UserCheck,
  MessageSquare,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { ProposalSummaryKPIs } from "@/lib/freelancer-proposals-types";

interface ProposalSummaryCardsProps {
  kpis: ProposalSummaryKPIs;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

export default function ProposalSummaryCards({
  kpis,
  selectedStatus,
  onSelectStatus,
}: ProposalSummaryCardsProps) {
  const cards = [
    {
      id: "ALL",
      label: "Total Proposals",
      count: kpis.totalProposals,
      icon: FileText,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50 border-indigo-100",
    },
    {
      id: "UNDER_REVIEW",
      label: "Under Client Review",
      count: kpis.underReview,
      icon: Clock,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50 border-amber-100",
    },
    {
      id: "SHORTLISTED",
      label: "Shortlisted",
      count: kpis.shortlisted,
      icon: UserCheck,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-100",
    },
    {
      id: "INTERVIEW",
      label: "Interview / Discussion",
      count: kpis.interview,
      icon: MessageSquare,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50 border-purple-100",
    },
    {
      id: "ACCEPTED",
      label: "Accepted",
      count: kpis.accepted,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-100",
    },
    {
      id: "REJECTED",
      label: "Rejected",
      count: kpis.rejected,
      icon: XCircle,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-50 border-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = selectedStatus === c.id;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectStatus(c.id === selectedStatus && c.id !== "ALL" ? "ALL" : c.id)}
            className={`p-4 rounded-2xl bg-white border transition text-left cursor-pointer flex items-center gap-3.5 group shadow-2xs hover:shadow-xs ${
              isSelected && c.id !== "ALL"
                ? "border-indigo-400 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-400/30"
                : "border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${c.iconBg}`}
            >
              <Icon className={`w-5 h-5 ${c.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-extrabold text-slate-900 leading-none">
                {c.count}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1 truncate">
                {c.label}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
