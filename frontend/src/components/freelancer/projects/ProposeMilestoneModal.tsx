"use client";

import React, { useState } from "react";
import { X, Plus, AlertCircle, ShieldAlert } from "lucide-react";
import { ProjectMilestone } from "@/lib/freelancer-projects-types";

interface ProposeMilestoneModalProps {
  projectTitle: string;
  nextOrderIndex: number;
  onClose: () => void;
  onPropose: (newMilestone: ProjectMilestone) => void;
}

export default function ProposeMilestoneModal({
  projectTitle,
  nextOrderIndex,
  onClose,
  onPropose,
}: ProposeMilestoneModalProps) {
  const [title, setTitle] = useState(`Milestone ${nextOrderIndex}: Performance Optimization`);
  const [description, setDescription] = useState(
    "Implement server-side caching, bundle splitting, and database index tuning."
  );
  const [amountStr, setAmountStr] = useState("25000");
  const [dueDate, setDueDate] = useState("Dec 30, 2026");
  const [acceptanceCriteriaStr, setAcceptanceCriteriaStr] = useState(
    "Lighthouse performance score >= 95\nP95 API latency < 200ms\nPassing stress tests under 500 concurrent users"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amountStr.trim() || !dueDate.trim()) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    const numAmount = parseInt(amountStr.replace(/[^0-9]/g, ""), 10) || 10000;
    const criteriaList = acceptanceCriteriaStr
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    setIsSubmitting(true);

    const proposedMilestone: ProjectMilestone = {
      id: `ms-prop-${Date.now()}`,
      number: nextOrderIndex,
      title,
      description,
      deliverablesSummary: description,
      acceptanceCriteria: criteriaList.length > 0 ? criteriaList : ["Passes client review"],
      amountCents: numAmount * 100,
      amountDisplay: `₹${numAmount.toLocaleString("en-IN")}`,
      currency: "INR",
      dueDate,
      workStatus: "UPCOMING",
      paymentStatus: "NOT_FUNDED",
      fundingRule: "PRE_FUNDED_BEFORE_WORK",
      submissions: [],
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onPropose(proposedMilestone);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Propose New Milestone
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
              {projectTitle}
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

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Milestone Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deliverables Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Agreed Amount (₹ INR)
              </label>
              <input
                type="number"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Due Date
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. Dec 30, 2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Acceptance Criteria (One per line)
            </label>
            <textarea
              rows={3}
              value={acceptanceCriteriaStr}
              onChange={(e) => setAcceptanceCriteriaStr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-[11px] text-amber-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Proposing a milestone creates a Change Request in the project agreement version chain.
              Both you and the client must approve before it is added to active deliverables.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Send Milestone Proposal"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

