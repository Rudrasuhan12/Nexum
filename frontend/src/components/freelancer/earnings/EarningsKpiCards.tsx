"use client";

import React from "react";
import { Wallet, Coins, CheckCircle2, Landmark } from "lucide-react";
import { FreelancerEarningsKpis } from "@/lib/freelancer-earnings-types";

interface EarningsKpiCardsProps {
  kpis: FreelancerEarningsKpis;
}

export default function EarningsKpiCards({ kpis }: EarningsKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Earnings */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500 tracking-wide">
              Total Earnings
            </p>
            <h3 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight mt-1">
              {kpis.totalEarningsDisplay}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium truncate">
              From {kpis.completedProjectsCount} completed projects
            </p>
          </div>
        </div>
      </div>

      {/* 2. Pending Amount */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#fffbeb] text-[#d97706] flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500 tracking-wide">
              Pending Amount
            </p>
            <h3 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight mt-1">
              {kpis.pendingAmountDisplay}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium truncate">
              {kpis.milestonesUnderReviewCount} milestones under review
            </p>
          </div>
        </div>
      </div>

      {/* 3. Available for Payout */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500 tracking-wide">
              Available for Payout
            </p>
            <h3 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight mt-1">
              {kpis.availableForPayoutDisplay}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium truncate">
              Ready to withdraw
            </p>
          </div>
        </div>
      </div>

      {/* 4. Total Withdrawn */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500 tracking-wide">
              Total Withdrawn
            </p>
            <h3 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight mt-1">
              {kpis.totalWithdrawnDisplay}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium truncate">
              {kpis.successfulPayoutsCount} successful payouts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

