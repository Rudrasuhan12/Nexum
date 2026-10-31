"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";

interface PaymentSettingsSectionProps {
  showToast: (msg: string) => void;
  onNavigateToEarnings: () => void;
}

export default function PaymentSettingsSection({
  showToast,
  onNavigateToEarnings,
}: PaymentSettingsSectionProps) {
  const [paypalEmail, setPaypalEmail] = useState("sambit.mohanty@example.com");
  const [currency, setCurrency] = useState("INR");
  const [minPayout, setMinPayout] = useState("5000");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Payment configuration saved successfully.");
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Payment Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage payout rails, threshold sweeps, and verified payment credentials.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToEarnings}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-xs font-bold text-[#4f46e5] transition shadow-2xs cursor-pointer"
        >
          <span>Open Full Earnings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. Connected Payout Rail */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Connected Payout Account
        </h3>

        <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center shrink-0">
            <span className="font-extrabold text-lg text-[#003087] italic">P</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">PayPal REST Payouts</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
              {paypalEmail}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Environment: PayPal Sandbox v2 · Merchant ID: PMR-SANDBOX-778129
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Update PayPal Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* 2. Payout Preferences */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Disbursement Rules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Preferred Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            >
              <option value="INR">INR (₹ Indian Rupee)</option>
              <option value="USD">USD ($ US Dollar)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Minimum Threshold Before Sweep
            </label>
            <input
              type="text"
              value={minPayout}
              onChange={(e) => setMinPayout(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/60 flex items-start gap-2.5 text-[11px] text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Nexum maintains strict bilateral escrow. Funds captured in Sandbox are verified
            against provider Order IDs before disbursement is triggered.
          </span>
        </div>
      </div>
    </form>
  );
}
