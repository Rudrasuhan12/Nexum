"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Check,
} from "lucide-react";

interface Proposal {
  id: string;
  projectTitle: string;
  clientCompany: string;
  clientName: string;
  proposedAmount: string;
  proposedTimeline: string;
  status: "counteroffer_received" | "under_review" | "accepted" | "draft";
  statusLabel: string;
  submittedDate: string;
  counteroffer?: {
    clientAmount: string;
    originalAmount: string;
    clientSchedule: string;
    originalSchedule: string;
    note: string;
  };
}

const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: "prop_1",
    projectTitle: "Enterprise Smart Escrow Integration for Solana Pay",
    clientCompany: "FinTech Labs Inc.",
    clientName: "David Sterling",
    proposedAmount: "$5,000.00 USD",
    proposedTimeline: "3 Weeks",
    status: "counteroffer_received",
    statusLabel: "Counteroffer Received",
    submittedDate: "Oct 29, 2026",
    counteroffer: {
      clientAmount: "$4,500.00 USD",
      originalAmount: "$5,000.00 USD",
      clientSchedule: "3.5 Weeks (+4 days)",
      originalSchedule: "3 Weeks",
      note: "We would love to move forward with Sambit. Would you be open to $4,500 USD with a slightly relaxed 3.5 week deadline?",
    },
  },
  {
    id: "prop_2",
    projectTitle: "Multi-Tenant PDF Invoice Rendering Pipeline",
    clientCompany: "Apex Retail Group",
    clientName: "Elena Rostova",
    proposedAmount: "$2,800.00 USD",
    proposedTimeline: "2 Weeks",
    status: "under_review",
    statusLabel: "Under Client Review",
    submittedDate: "Oct 30, 2026",
  },
  {
    id: "prop_3",
    projectTitle: "Bilateral E-Commerce Payment Rails",
    clientCompany: "Horizon Commerce LLC",
    clientName: "Alex Rivera",
    proposedAmount: "$5,700.00 USD",
    proposedTimeline: "6 Weeks",
    status: "accepted",
    statusLabel: "Accepted & Signed (v1.2)",
    submittedDate: "Oct 10, 2026",
  },
];

interface FreelancerProposalsViewProps {
  showToast: (msg: string) => void;
  onNavigateTab: (tab: string) => void;
}

export default function FreelancerProposalsView({
  showToast,
  onNavigateTab,
}: FreelancerProposalsViewProps) {
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [filter, setFilter] = useState<"all" | "counteroffer" | "under_review" | "accepted">("all");

  const handleAcceptCounteroffer = (propId: string) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === propId
          ? {
              ...p,
              status: "accepted",
              statusLabel: "Accepted & Bilateral Hash Generated",
              proposedAmount: p.counteroffer?.clientAmount || p.proposedAmount,
            }
          : p
      )
    );
    showToast("Counteroffer accepted! Bilateral agreement hash generated for escrow funding.");
  };

  const filteredProposals = proposals.filter((p) => {
    if (filter === "counteroffer") return p.status === "counteroffer_received";
    if (filter === "under_review") return p.status === "under_review";
    if (filter === "accepted") return p.status === "accepted";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100/90 border border-slate-200/70 text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
              filter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All Proposals ({proposals.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("counteroffer")}
            className={`py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              filter === "counteroffer" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Counteroffers</span>
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
              1
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("under_review")}
            className={`py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
              filter === "under_review" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Under Review (1)
          </button>
          <button
            type="button"
            onClick={() => setFilter("accepted")}
            className={`py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
              filter === "accepted" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Accepted (1)
          </button>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab("find_projects")}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Find & Submit New Proposal</span>
        </button>
      </div>

      {/* Proposals Stream */}
      <div className="space-y-4">
        {filteredProposals.map((p) => {
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.status === "counteroffer_received"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                          : p.status === "accepted"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                          : "bg-blue-50 text-blue-700 border border-blue-200/80"
                      }`}
                    >
                      {p.statusLabel}
                    </span>
                    <span className="text-slate-400">· Submitted on {p.submittedDate}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {p.projectTitle}
                  </h3>
                </div>

                <div className="text-left sm:text-right font-mono">
                  <div className="text-sm font-bold text-slate-900">{p.proposedAmount}</div>
                  <div className="text-xs text-slate-500">{p.proposedTimeline}</div>
                </div>
              </div>

              {/* Counteroffer Highlight Card */}
              {p.status === "counteroffer_received" && p.counteroffer && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold uppercase tracking-wider text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Client Counteroffer from {p.clientName} ({p.clientCompany})</span>
                  </div>

                  <p className="text-slate-700 italic bg-white p-3 rounded-lg border border-amber-100">
                    &ldquo;{p.counteroffer.note}&rdquo;
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Original Quote:</span>
                      <span className="line-through text-slate-500">{p.counteroffer.originalAmount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Client Counter:</span>
                      <strong className="text-emerald-700">{p.counteroffer.clientAmount}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Original Schedule:</span>
                      <span className="text-slate-600">{p.counteroffer.originalSchedule}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">New Delivery:</span>
                      <strong className="text-indigo-700">{p.counteroffer.clientSchedule}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAcceptCounteroffer(p.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Counteroffer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast("Opened counter-proposal draft editor.")}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer shadow-2xs"
                    >
                      Propose Revision ($4,800)
                    </button>
                  </div>
                </div>
              )}

              {/* Meta row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <div>Client: <strong className="text-slate-800">{p.clientCompany}</strong> ({p.clientName})</div>
                <div className="text-emerald-700 font-semibold">✓ Dual Consensus Ready</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
