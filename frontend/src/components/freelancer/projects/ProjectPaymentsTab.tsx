"use client";

import React from "react";
import {
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { FreelancerProjectItem } from "@/lib/freelancer-projects-types";
import { getPaymentStatusConfig } from "@/lib/freelancer-projects-data";

interface ProjectPaymentsTabProps {
  project: FreelancerProjectItem;
  onOpenEarnings: () => void;
}

export default function ProjectPaymentsTab({
  project,
  onOpenEarnings,
}: ProjectPaymentsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Escrow & Payment Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Independent financial state machine separate from deliverable acceptance.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenEarnings}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-xs font-bold text-[#4f46e5] transition shadow-2xs cursor-pointer shrink-0"
        >
          <span>Open Full Earnings & Payments</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Escrow Balance Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Contract Escrow
            </p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {project.totalBudgetDisplay}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Total Agreed Value</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Paid to Freelancer
            </p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">
              ₹20,000
            </p>
            <p className="text-[10px] text-emerald-700 mt-1">Disbursed to PayPal</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Held in Escrow
            </p>
            <p className="text-xl font-black text-[#4f46e5] mt-0.5">
              ₹30,000
            </p>
            <p className="text-[10px] text-indigo-700 mt-1">Milestone 2 Verified Capture</p>
          </div>
        </div>
      </div>

      {/* Milestones Payment Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Milestone Payment Records
        </h3>

        <div className="divide-y divide-slate-100">
          {project.milestones.map((ms) => {
            const payConfig = getPaymentStatusConfig(ms.paymentStatus);

            return (
              <div
                key={ms.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">
                      {ms.title}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${payConfig.badgeClass}`}
                    >
                      {payConfig.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-400">
                    <span>Amount: <strong>{ms.amountDisplay}</strong></span>
                    {ms.paypalOrderId && (
                      <span>· PayPal Order: <code className="font-mono text-slate-600">{ms.paypalOrderId}</code></span>
                    )}
                    {ms.paypalCaptureId && (
                      <span>· Capture: <code className="font-mono text-slate-600">{ms.paypalCaptureId}</code></span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-slate-900">
                    {ms.amountDisplay}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {ms.paymentStatus === "PAYOUT_COMPLETED"
                      ? "Disbursed"
                      : ms.paymentStatus === "SANDBOX_CAPTURE_CONFIRMED"
                      ? "In Escrow"
                      : "Pending Deposit"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Guarantees Notice */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Independent State Machine Rules (Nexum Escrow Protocol)</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
          <li><strong>Work acceptance is not proof of payment</strong>: A client approving work does not immediately release funds until verified by provider capture.</li>
          <li><strong>PayPal Sandbox capture is not commercial settlement</strong>: Sandbox test orders simulate escrow without live banking moves.</li>
          <li><strong>Zero unconfirmed payouts</strong>: Funds are only credited when backed by immutable PayPal capture payloads.</li>
        </ul>
      </div>
    </div>
  );
}
