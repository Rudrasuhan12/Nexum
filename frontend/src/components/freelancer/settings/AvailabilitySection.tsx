"use client";

import React, { useState } from "react";
import { DollarSign, CheckCircle2 } from "lucide-react";
import { AvailabilityPreferences } from "@/lib/freelancer-settings-types";
import { INITIAL_AVAILABILITY_PREFS } from "@/lib/freelancer-settings-data";

interface AvailabilitySectionProps {
  showToast: (msg: string) => void;
}

export default function AvailabilitySection({
  showToast,
}: AvailabilitySectionProps) {
  const [prefs, setPrefs] = useState<AvailabilityPreferences>(INITIAL_AVAILABILITY_PREFS);
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    "Web Development",
    "AI & Data",
    "Mobile Development",
    "Blockchain",
    "UI/UX Design",
    "DevOps & Cloud",
  ];

  const toggleCategory = (cat: string) => {
    setPrefs((prev) => {
      const exists = prev.preferredCategories.includes(cat);
      return {
        ...prev,
        preferredCategories: exists
          ? prev.preferredCategories.filter((c) => c !== cat)
          : [...prev.preferredCategories, cat],
      };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Availability and matching preferences updated.");
    }, 500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Availability & Preferences
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure your working schedule, baseline pricing, and discovery preferences for AI matching.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>

      {/* 1. Availability Status Pill Selector */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Current Availability Status
        </h3>
        <p className="text-xs text-slate-500">
          This status appears on your verified profile and determines client invitation limits.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            {
              id: "AVAILABLE" as const,
              label: "Available",
              desc: "Open for new contracts",
              color: "border-emerald-200 bg-emerald-50 text-emerald-800",
            },
            {
              id: "BUSY" as const,
              label: "Busy / Limited",
              desc: "Only high-value matches",
              color: "border-amber-200 bg-amber-50 text-amber-800",
            },
            {
              id: "UNAVAILABLE" as const,
              label: "Unavailable",
              desc: "Not accepting proposals",
              color: "border-slate-200 bg-slate-50 text-slate-800",
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setPrefs((prev) => ({ ...prev, status: item.id }))}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-1 ${
                prefs.status === item.id
                  ? `${item.color} ring-2 ring-[#4f46e5]`
                  : "border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">{item.label}</span>
                {prefs.status === item.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4f46e5]" />
                )}
              </div>
              <span className="text-[11px] opacity-80">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Rates & Hours Grid */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Pricing & Working Hours
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hourly Baseline Rate ($ USD / hr)
            </label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={prefs.hourlyRate}
                onChange={(e) =>
                  setPrefs((prev) => ({ ...prev, hourlyRate: e.target.value }))
                }
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Minimum Project Budget ($ USD)
            </label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={prefs.minBudget}
                onChange={(e) =>
                  setPrefs((prev) => ({ ...prev, minBudget: e.target.value }))
                }
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Weekly Capacity (Hours / Week)
            </label>
            <input
              type="text"
              value={prefs.hoursPerWeek}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, hoursPerWeek: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Primary Time Zone
            </label>
            <input
              type="text"
              value={prefs.timezone}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, timezone: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>
        </div>
      </div>

      {/* 3. Preferred Categories */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Preferred Project Categories
        </h3>
        <p className="text-xs text-slate-500">
          Select areas where you want to receive prioritized recommendations.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {categories.map((cat) => {
            const isSelected = prefs.preferredCategories.includes(cat);
            return (
              <div
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs font-semibold ${
                  isSelected
                    ? "border-[#4f46e5] bg-[#eef2ff] text-[#4f46e5]"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>{cat}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </form>
  );
}
