"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, Circle } from "lucide-react";

interface SecuritySummaryCardProps {
  onAddBackupMethod?: () => void;
}

export default function SecuritySummaryCard({
  onAddBackupMethod,
}: SecuritySummaryCardProps) {
  const steps = [
    { id: "email", label: "Verified email address", completed: true },
    { id: "phone", label: "Verified phone number", completed: true },
    { id: "2fa", label: "Two-factor authentication enabled", completed: true },
    { id: "backup", label: "Add a backup method (recommended)", completed: false },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const percent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">
            Your Account is Secure
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            You&apos;ve completed the recommended security steps.
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-[#4f46e5] rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="text-[11px] font-semibold text-slate-500">
          {completedCount} of {steps.length} security steps completed
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2.5 pt-1">
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={() => {
              if (!step.completed && onAddBackupMethod) {
                onAddBackupMethod();
              }
            }}
            className={`flex items-center gap-2.5 text-xs ${
              step.completed
                ? "text-slate-700"
                : "text-slate-500 hover:text-[#4f46e5] cursor-pointer"
            }`}
          >
            {step.completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.2] shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 stroke-[2] shrink-0" />
            )}
            <span className="font-medium">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

