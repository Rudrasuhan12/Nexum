"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
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
  const [showOriginal1, setShowOriginal1] = useState(false);
  const [showOriginal2, setShowOriginal2] = useState(false);

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
        {/* Message 1 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4f46e5]" />
              <span className="text-xs font-bold text-slate-900">
                Nexum AI · Mediated Update
              </span>
              <span className="text-[10px] text-slate-400">Oct 24, 2026, 11:32 AM</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Approved
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            Client {project.client.companyName} approved Milestone 1: UI/UX Design & Frontend Development.
            Funds of ₹20,000 have completed release sweep.
          </p>

          <button
            type="button"
            onClick={() => setShowOriginal1(!showOriginal1)}
            className="text-[11px] font-semibold text-[#4f46e5] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showOriginal1 ? "Hide Client's Original Wording" : "Read Client's Original Wording"}</span>
            {showOriginal1 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showOriginal1 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
              &quot;Hi Sambit, the storefront screens look crisp and the cart persistence works nicely on mobile.
              Approved milestone 1! Let&apos;s push ahead with the backend APIs.&quot;
            </div>
          )}
        </div>

        {/* Message 2 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-slate-900">
                Nexum AI · Review Notification
              </span>
              <span className="text-[10px] text-slate-400">Nov 14, 2026, 2:42 PM</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              In Client Review
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            Milestone 2 deliverable (Backend APIs & PayPal order capture) was submitted by you.
            Escrow capture of ₹30,000 is verified in PayPal Sandbox.
          </p>

          <button
            type="button"
            onClick={() => setShowOriginal2(!showOriginal2)}
            className="text-[11px] font-semibold text-[#4f46e5] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showOriginal2 ? "Hide Submission Note" : "Read Submission Note"}</span>
            {showOriginal2 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showOriginal2 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
              &quot;All order and payment APIs are deployed to staging. PayPal sandbox order capture webhook verified with zero dropped payloads.&quot;
            </div>
          )}
        </div>
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
