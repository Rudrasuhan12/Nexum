"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
} from "lucide-react";
import {
  FreelancerProposalItem,
  ProposalCounteroffer,
} from "@/lib/freelancer-proposals-types";

interface CounterofferComparisonModalProps {
  proposal: FreelancerProposalItem;
  counteroffer: ProposalCounteroffer;
  onClose: () => void;
  onAccept: () => void;
  onCounter: (newPrice: string, newDuration: string, note: string) => void;
  onDecline: () => void;
}

export default function CounterofferComparisonModal({
  proposal,
  counteroffer,
  onClose,
  onAccept,
  onCounter,
  onDecline,
}: CounterofferComparisonModalProps) {
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterPrice, setCounterPrice] = useState(counteroffer.proposedPrice);
  const [counterDuration, setCounterDuration] = useState(counteroffer.proposedDuration);
  const [counterNote, setCounterNote] = useState(
    "I can meet at ₹60,000 with a 3.5-week timeline, ensuring full E2E test coverage and audit signoff."
  );

  const handleSendCounter = (e: React.FormEvent) => {
    e.preventDefault();
    onCounter(counterPrice, counterDuration, counterNote);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Review Client Counteroffer
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
              {proposal.projectTitle} · {proposal.client.companyName}
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

        {/* Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          {/* Column A: Original Proposal */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Your Original Proposal
            </span>
            <div>
              <p className="text-xs text-slate-500">Agreed Price</p>
              <p className="text-sm font-bold text-slate-900 line-through">
                {counteroffer.originalPrice}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Timeline</p>
              <p className="text-sm font-bold text-slate-900">
                {counteroffer.originalDuration}
              </p>
            </div>
          </div>

          {/* Column B: Client Counteroffer */}
          <div className="space-y-3 border-l border-slate-200 pl-4">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
              Client&apos;s Proposed Terms
            </span>
            <div>
              <p className="text-xs text-slate-500">Proposed Price</p>
              <p className="text-sm font-black text-orange-600">
                {counteroffer.proposedPrice}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Proposed Timeline</p>
              <p className="text-sm font-black text-orange-600">
                {counteroffer.proposedDuration}
              </p>
            </div>
          </div>
        </div>

        {/* Client Note */}
        <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs text-orange-950 space-y-1">
          <p className="font-bold">Client Note:</p>
          <p className="italic leading-relaxed">&quot;{counteroffer.scopeNotes}&quot;</p>
        </div>

        {/* Counter-proposal draft form if activated */}
        {showCounterForm ? (
          <form onSubmit={handleSendCounter} className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
            <h4 className="text-xs font-bold text-indigo-950">
              Draft Your Counterproposal
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Proposed Price
                </label>
                <input
                  type="text"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Proposed Duration
                </label>
                <input
                  type="text"
                  value={counterDuration}
                  onChange={(e) => setCounterDuration(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Justification Note to Client
              </label>
              <textarea
                rows={2}
                value={counterNote}
                onChange={(e) => setCounterNote(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCounterForm(false)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white"
              >
                Back
              </button>
              <button
                type="submit"
                className="py-1.5 px-3.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white shadow-xs"
              >
                Send Counterproposal
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onDecline}
              className="py-2 px-3.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              Decline Counteroffer
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCounterForm(true)}
                className="py-2 px-3.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-xs font-bold text-[#4f46e5] transition cursor-pointer"
              >
                Draft Counterproposal
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accept Counteroffer</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
