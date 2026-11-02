"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { FreelancerProjectItem } from "@/lib/freelancer-projects-types";

interface ProjectMessagesTabProps {
  project: FreelancerProjectItem;
  onOpenWorkspace: () => void;
}

export default function ProjectMessagesTab({
  project,
  onOpenWorkspace,
}: ProjectMessagesTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const acceptedMilestones = project.milestones.filter((m) => m.workStatus === "ACCEPTED");
  const inReviewMilestones = project.milestones.filter((m) => m.workStatus === "AWAITING_CLIENT_REVIEW");

  const hasMessages = acceptedMilestones.length > 0 || inReviewMilestones.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Mediated Project Communications
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent AI-mediated messages with verifiable bilateral consensus records.
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

      {/* Messages Thread Preview */}
      <div className="space-y-4">
        {!hasMessages ? (
          <div className="p-10 text-center rounded-2xl bg-white border border-slate-200/90 text-slate-500">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No mediated messages yet</p>
            <p className="text-xs text-slate-400 mt-1">
              As deliverables are submitted and reviewed, mediated consensus updates will appear here. Use &quot;Open Full Workspace&quot; to message the client.
            </p>
          </div>
        ) : (
          <>
            {acceptedMilestones.map((m) => {
              const isExpanded = expandedId === `accepted-${m.id}`;
              return (
                <div
                  key={`accepted-${m.id}`}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#4f46e5]" />
                      <span className="text-xs font-bold text-slate-900">
                        Nexum AI · Mediated Update
                      </span>
                      {m.approvedAt && (
                        <span className="text-[10px] text-slate-400">{m.approvedAt}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Approved
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    Client {project.client.companyName} approved {m.title}.
                    Funds of {m.amountDisplay} completed milestone acceptance.
                  </p>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : `accepted-${m.id}`)}
                    className="text-[11px] font-semibold text-[#4f46e5] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? "Hide Acceptance Note" : "Read Acceptance Note"}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                      &quot;Milestone deliverables verified and approved against bilateral acceptance criteria.&quot;
                    </div>
                  )}
                </div>
              );
            })}

            {inReviewMilestones.map((m) => {
              const isExpanded = expandedId === `review-${m.id}`;
              return (
                <div
                  key={`review-${m.id}`}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-slate-900">
                        Nexum AI · Review Notification
                      </span>
                      {m.submittedAt && (
                        <span className="text-[10px] text-slate-400">{m.submittedAt}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      In Client Review
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    Milestone deliverable ({m.title}) was submitted by you.
                    Escrow funding of {m.amountDisplay} is held pending verification.
                  </p>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : `review-${m.id}`)}
                    className="text-[11px] font-semibold text-[#4f46e5] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? "Hide Deliverable Scope" : "Read Deliverable Scope"}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                      &quot;{m.deliverablesSummary || "Milestone deliverables submitted for stakeholder review."}&quot;
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Mediation Guarantees Card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Nexum Mediation Principles</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
          <li>Neither client nor freelancer writes unfiltered messages that alter agreed contract scope.</li>
          <li>Every scope or price suggestion is automatically converted to an actionable Change Request.</li>
          <li>Original stakeholder wording is immutably archived behind every summary card.</li>
        </ul>
      </div>
    </div>
  );
}
