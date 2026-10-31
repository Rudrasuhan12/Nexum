"use client";

import React from "react";
import { CheckCircle2, ChevronRight, HelpCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { VerificationItem } from "@/lib/freelancer-earnings-types";

interface IdentityVerificationCardProps {
  items: VerificationItem[];
  onHelpClick?: () => void;
  onItemClick?: (item: VerificationItem) => void;
}

export default function IdentityVerificationCard({
  items,
  onHelpClick,
  onItemClick,
}: IdentityVerificationCardProps) {
  return (
    <div className="space-y-4">
      {/* Verification Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
              Verification Status
            </h3>
          </div>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70 shrink-0">
            3/3 Complete
          </span>
        </div>

        <div className="space-y-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 transition border border-slate-100 cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5] shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">
                  {item.title}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Need Help Card (Matching Reference Screenshot) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-[#f8f9ff] to-white border border-indigo-100/90 shadow-2xs space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#4f46e5]/10 text-[#4f46e5] flex items-center justify-center shrink-0 border border-indigo-100">
            <HelpCircle className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
              Need help with payments?
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Check payout timelines, fee deductions, and PayPal escrow protection.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onHelpClick}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-indigo-200/80 text-xs font-bold text-[#4f46e5] transition shadow-2xs cursor-pointer"
        >
          <span>Visit Help Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
