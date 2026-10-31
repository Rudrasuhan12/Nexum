"use client";

import React from "react";
import { Banknote, Zap, Calendar, ChevronRight, Sliders } from "lucide-react";
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
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
          Payout Preferences
        </h3>
        <button
          type="button"
          onClick={onEditPreferences}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 px-2.5 py-1 rounded-lg transition cursor-pointer"
        >
          Manage
        </button>
      </div>

      {/* Modern Preference List */}
      <div className="space-y-2">
        {/* 1. Minimum Payout Amount */}
        <div
          onClick={onEditPreferences}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 transition border border-slate-100 cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs">
              <Banknote className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500">Min. Payout</p>
              <p className="text-xs font-bold text-slate-800 truncate">Threshold</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
              {preferences.formattedMinimumPayout}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
          </div>
        </div>

        {/* 2. Auto Payout */}
        <div
          onClick={onEditPreferences}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 transition border border-slate-100 cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
              <Zap className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500">Auto Payout</p>
              <p className="text-xs font-bold text-slate-800 truncate">Schedule</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/70 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {preferences.autoPayoutEnabled ? "Enabled" : "Disabled"}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
          </div>
        </div>

        {/* 3. Payout Frequency */}
        <div
          onClick={onEditPreferences}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 transition border border-slate-100 cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-2xs">
              <Calendar className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500">Frequency</p>
              <p className="text-xs font-bold text-slate-800 truncate">Cadence</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
              {preferences.payoutFrequency}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
          </div>
        </div>
      </div>
    </div>
  );
}
