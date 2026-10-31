"use client";

import React, { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { PayoutPreferences } from "@/lib/freelancer-earnings-types";

interface UpdatePreferencesModalProps {
  currentPreferences: PayoutPreferences;
  onClose: () => void;
  onSave: (updated: PayoutPreferences) => void;
}

export default function UpdatePreferencesModal({
  currentPreferences,
  onClose,
  onSave,
}: UpdatePreferencesModalProps) {
  const [minAmount, setMinAmount] = useState(currentPreferences.minimumPayoutAmount);
  const [autoPayout, setAutoPayout] = useState(currentPreferences.autoPayoutEnabled);
  const [frequency, setFrequency] = useState(currentPreferences.payoutFrequency);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onSave({
        minimumPayoutAmount: Number(minAmount),
        formattedMinimumPayout: `₹${Number(minAmount).toLocaleString("en-IN")}`,
        autoPayoutEnabled: autoPayout,
        payoutFrequency: frequency,
      });
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Configure Payout Preferences
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize threshold limits and automated disbursement schedules.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Minimum Payout Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Minimum Payout Threshold (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                min={1000}
                step={500}
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Disbursements occur only when your available balance reaches this amount.
            </p>
          </div>

          {/* Auto Payout Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-900">Automatic Payouts</p>
              <p className="text-[11px] text-slate-500">
                Automatically sweep eligible funds to PayPal
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoPayout(!autoPayout)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                autoPayout ? "bg-[#4f46e5]" : "bg-slate-200"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                  autoPayout ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Frequency Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Payout Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as "Daily" | "Weekly" | "Bi-weekly" | "Monthly")
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly (Every Monday)</option>
              <option value="Bi-weekly">Bi-weekly (Every 2nd Monday)</option>
              <option value="Monthly">Monthly (1st of the month)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Update Preferences</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

