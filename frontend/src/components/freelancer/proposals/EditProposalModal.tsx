"use client";

import React, { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { FreelancerProposalItem } from "@/lib/freelancer-proposals-types";

interface EditProposalModalProps {
  proposal: FreelancerProposalItem;
  onClose: () => void;
  onSave: (updatedProposal: FreelancerProposalItem) => void;
}

export default function EditProposalModal({
  proposal,
  onClose,
  onSave,
}: EditProposalModalProps) {
  const [priceDisplay, setPriceDisplay] = useState(proposal.offer.priceDisplay);
  const [duration, setDuration] = useState(proposal.offer.duration);
  const [approach, setApproach] = useState(proposal.offer.approach);
  const [summary, setSummary] = useState(proposal.offer.summary);
  const [coverLetter, setCoverLetter] = useState(proposal.offer.coverLetter);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updated: FreelancerProposalItem = {
      ...proposal,
      offer: {
        ...proposal.offer,
        priceDisplay,
        duration,
        approach,
        summary,
        coverLetter,
      },
      activityTrail: [
        {
          id: `act-edit-${Date.now()}`,
          title: "Proposal Terms Updated",
          description: `Updated proposed quote to ${priceDisplay} and duration to ${duration}.`,
          actor: "Sambit Mohanty (Freelancer)",
          timestamp: "Just now",
          type: "SUBMITTED",
        },
        ...proposal.activityTrail,
      ],
    };

    setTimeout(() => {
      setIsSaving(false);
      onSave(updated);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Edit Proposal Offer
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
              {proposal.projectTitle}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Proposed Price
              </label>
              <input
                type="text"
                value={priceDisplay}
                onChange={(e) => setPriceDisplay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estimated Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Development Approach
            </label>
            <input
              type="text"
              value={approach}
              onChange={(e) => setApproach(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Proposal Summary
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cover Letter
            </label>
            <textarea
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="py-2 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Proposal Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
