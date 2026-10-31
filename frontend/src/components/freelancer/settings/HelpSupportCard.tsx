"use client";

import React from "react";
import { HelpCircle } from "lucide-react";

interface HelpSupportCardProps {
  onVisitHelpCenter: () => void;
  onContactSupport: () => void;
}

export default function HelpSupportCard({
  onVisitHelpCenter,
  onContactSupport,
}: HelpSupportCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-[#4f46e5]/10 text-[#4f46e5] flex items-center justify-center shrink-0">
          <HelpCircle className="w-5 h-5 stroke-[2]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">
            Need help with your account?
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Visit our Help Center or contact support for assistance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={onVisitHelpCenter}
          className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer text-center"
        >
          Visit Help Center
        </button>
        <button
          type="button"
          onClick={onContactSupport}
          className="w-full py-2 px-3 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer text-center"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}

