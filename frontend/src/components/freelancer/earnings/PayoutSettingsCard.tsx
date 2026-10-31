"use client";

import React, { useState } from "react";
import { Edit2, CheckCircle2, ShieldCheck, ExternalLink } from "lucide-react";
import { PayoutSettings } from "@/lib/freelancer-earnings-types";

interface PayoutSettingsCardProps {
  settings: PayoutSettings;
  onUpdateClick: () => void;
}

export default function PayoutSettingsCard({
  settings,
  onUpdateClick,
}: PayoutSettingsCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            Payout Settings
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsEditing(!isEditing);
            onUpdateClick();
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 px-2.5 py-1 rounded-lg transition cursor-pointer"
        >
          <Edit2 className="w-3 h-3" />
          <span>Edit</span>
        </button>
      </div>

      {/* Account Info Box */}
      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-3">
        <div className="flex items-center gap-3">
          {/* PayPal Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center shrink-0 border border-[#003087]/15 shadow-2xs">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.45A.641.641 0 0 1 5.577 1.9h7.457c3.42 0 5.86 1.488 5.438 4.793-.418 3.27-2.732 5.09-6.046 5.09H9.414l-1.393 8.814a.641.641 0 0 1-.633.54l-.312 0z"
                fill="#003087"
              />
              <path
                d="M8.887 14.62l1.01-6.42a.641.641 0 0 1 .633-.54h4.152c3.314 0 5.628-1.82 6.046-5.09.422-3.305-2.018-4.793-5.438-4.793H7.833a.641.641 0 0 0-.633.55L4.092 19.923a.641.641 0 0 0 .633.74h3.529l.633-6.043z"
                fill="#0079C1"
                opacity="0.85"
              />
            </svg>
          </div>

          {/* Account Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-black text-slate-900">PayPal</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                Connected
              </span>
            </div>
            <p
              className="text-xs font-semibold text-slate-700 truncate mt-0.5"
              title={settings.accountEmail}
            >
              {settings.accountEmail}
            </p>
          </div>
        </div>

        {/* Date note */}
        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Linked on {settings.connectedDate}</span>
          <span className="text-[10px] font-medium text-slate-500">Auto-Disbursement</span>
        </div>
      </div>

      {/* Update PayPal Button */}
      <button
        type="button"
        onClick={onUpdateClick}
        className="w-full py-2.5 px-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/40 hover:bg-indigo-50 text-xs font-bold text-indigo-700 hover:border-indigo-300 transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
      >
        <span>Update PayPal Account</span>
      </button>

      {/* Environment Note with Clean Non-Breaking Pills */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
        <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
          Sandbox v2
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded-full border border-emerald-200/70">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Merchant</span>
        </span>
      </div>
    </div>
  );
}
