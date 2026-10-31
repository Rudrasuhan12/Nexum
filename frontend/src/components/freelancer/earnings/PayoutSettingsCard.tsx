"use client";

import React, { useState } from "react";
import { Edit2, CheckCircle2 } from "lucide-react";
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
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Payout Settings
        </h3>
        <button
          type="button"
          onClick={() => {
            setIsEditing(!isEditing);
            onUpdateClick();
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#4f46e5] hover:text-[#4338ca] transition cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
      </div>

      {/* Account Info Box */}
      <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
        {/* PayPal Icon */}
        <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path
              d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.45A.641.641 0 0 1 5.577 1.9h7.457c3.42 0 5.86 1.488 5.438 4.793-.418 3.27-2.732 5.09-6.046 5.09H9.414l-1.393 8.814a.641.641 0 0 1-.633.54l-.312 0z"
              fill="#003087"
            />
            <path
              d="M8.887 14.62l1.01-6.42a.641.641 0 0 1 .633-.54h4.152c3.314 0 5.628-1.82 6.046-5.09.422-3.305-2.018-4.793-5.438-4.793H7.833a.641.641 0 0 0-.633.55L4.092 19.923a.641.641 0 0 0 .633.74h3.529l.633-6.043z"
              fill="#0079C1"
              opacity="0.8"
            />
          </svg>
        </div>

        {/* Account Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">PayPal</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
            {settings.accountEmail}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Connected on {settings.connectedDate}
          </p>
        </div>
      </div>

      {/* Update PayPal Button */}
      <button
        type="button"
        onClick={onUpdateClick}
        className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#4f46e5] hover:border-[#4f46e5]/40 transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
      >
        <span>Update PayPal Account</span>
      </button>

      {/* Environment Note */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
        <span>Environment: Sandbox v2</span>
        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
          <CheckCircle2 className="w-3 h-3" />
          Verified Merchant
        </span>
      </div>
    </div>
  );
}

