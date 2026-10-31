"use client";

import React from "react";
import {
  FileText,
  Eye,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  User,
} from "lucide-react";
import { FreelancerProposalItem } from "@/lib/freelancer-proposals-types";

interface ProposalActivityTabProps {
  proposal: FreelancerProposalItem;
}

export default function ProposalActivityTab({
  proposal,
}: ProposalActivityTabProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "SUBMITTED":
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case "VIEWED":
        return <Eye className="w-3.5 h-3.5 text-amber-600" />;
      case "SHORTLISTED":
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case "COUNTEROFFER":
        return <ArrowRightLeft className="w-3.5 h-3.5 text-orange-600" />;
      case "ACCEPTED":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "REJECTED":
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
          Proposal Progression & Audit Timeline
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Verifiable lifecycle records backed by the Nexum consensus audit ledger.
        </p>
      </div>

      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {proposal.activityTrail.map((ev) => (
            <div key={ev.id} className="relative group">
              <div className="absolute -left-6 top-0 w-6 h-6 rounded-full border border-slate-200 bg-white flex items-center justify-center -translate-x-1/2 shadow-2xs">
                {getEventIcon(ev.type)}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900">{ev.title}</p>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {ev.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {ev.description}
                </p>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                  <User className="w-3 h-3" />
                  <span>{ev.actor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

