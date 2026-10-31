"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Send,
} from "lucide-react";
import { FreelancerProposalItem } from "@/lib/freelancer-proposals-types";

interface ProposalMessagesTabProps {
  proposal: FreelancerProposalItem;
  onOpenWorkspace: () => void;
  showToast: (msg: string) => void;
}

export default function ProposalMessagesTab({
  proposal,
  onOpenWorkspace,
  showToast,
}: ProposalMessagesTabProps) {
  const [quickReply, setQuickReply] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);

  const handleSendQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReply.trim()) return;
    showToast(`Draft message submitted to Nexum AI mediation queue.`);
    setQuickReply("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Proposal Discussions & Clarifications
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All client communications are routed through the Nexum AI mediation rail.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenWorkspace}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer shrink-0"
        >
          <span>Open Full Workspace</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="space-y-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4f46e5]" />
              <span className="text-xs font-bold text-slate-900">
                {proposal.client.companyName}
              </span>
              <span className="text-[10px] text-slate-400">Oct 27, 2026, 4:20 PM</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Clarification Request
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            &quot;Could you clarify how the FastAPI backend handles rate limits if traffic spikes during appointment booking hours?&quot;
          </p>

          <button
            type="button"
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-[11px] font-semibold text-[#4f46e5] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showOriginal ? "Hide AI Mediation Context" : "View AI Mediation Context"}</span>
            {showOriginal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showOriginal && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
              <strong>Nexum AI Context:</strong> This inquiry relates to Technical Requirement #1. Answering with Redis token bucket rate limiting will strengthen your proposal score.
            </div>
          )}
        </div>
      </div>

      {/* Quick Composer */}
      <form
        onSubmit={handleSendQuickReply}
        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
      >
        <h4 className="text-xs font-bold text-slate-800">
          Reply via Nexum AI Mediation
        </h4>
        <textarea
          rows={3}
          value={quickReply}
          onChange={(e) => setQuickReply(e.target.value)}
          placeholder={`Write a response to ${proposal.client.companyName}... Nexum AI will review before delivery.`}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            AI reviews tone and protects private notes
          </span>
          <button
            type="submit"
            className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Send Mediated Reply</span>
          </button>
        </div>
      </form>
    </div>
  );
}

