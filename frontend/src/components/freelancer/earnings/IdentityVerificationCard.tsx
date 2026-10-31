"use client";

import React from "react";
import { CheckCircle2, ChevronRight, HelpCircle, ArrowRight } from "lucide-react";
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
    <div className="space-y-5">
      {/* Verification Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Identity & Verification
          </h3>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            3/3 Complete
          </span>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.2] shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  {item.title}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Need Help Card (Matching Reference Screenshot) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#f8f9ff] via-[#f5f6ff] to-[#eef2ff] border border-indigo-100 shadow-2xs space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#4f46e5]/10 text-[#4f46e5] flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Need help with payments?
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Check our help center for payout timelines, fees, and common issues.
            </p>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={onHelpClick}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-indigo-200/80 text-xs font-bold text-[#4f46e5] transition shadow-2xs cursor-pointer"
          >
            <span>Visit Help Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

