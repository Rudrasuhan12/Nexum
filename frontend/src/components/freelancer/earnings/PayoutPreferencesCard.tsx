"use client";

import React from "react";
import { Banknote, Zap, Calendar, ChevronRight } from "lucide-react";
import { PayoutPreferences } from "@/lib/freelancer-earnings-types";

interface PayoutPreferencesCardProps {
  preferences: PayoutPreferences;
  onEditPreferences: () => void;
}

export default function PayoutPreferencesCard({
  preferences,
  onEditPreferences,
}: PayoutPreferencesCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Payout Preferences
        </h3>
        <span className="text-[10px] font-mono text-slate-400">Settings</span>
      </div>

      <div className="space-y-3">
        {/* 1. Minimum Payout Amount */}
        <div
          onClick={onEditPreferences}
          className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Banknote className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Minimum Payout Amount
              </p>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                {preferences.formattedMinimumPayout}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
        </div>

        {/* 2. Auto Payout */}
        <div
          onClick={onEditPreferences}
          className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Auto Payout
              </p>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                {preferences.autoPayoutEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
        </div>

        {/* 3. Payout Frequency */}
        <div
          onClick={onEditPreferences}
          className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Payout Frequency
              </p>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                {preferences.payoutFrequency}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
        </div>
      </div>
    </div>
  );
}

