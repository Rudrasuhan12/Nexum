"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AppearancePreferences } from "@/lib/freelancer-settings-types";
import { INITIAL_APPEARANCE_PREFERENCES } from "@/lib/freelancer-settings-data";

interface AppearanceLanguageSectionProps {
  showToast: (msg: string) => void;
}

export default function AppearanceLanguageSection({
  showToast,
}: AppearanceLanguageSectionProps) {
  const [prefs, setPrefs] = useState<AppearancePreferences>(
    INITIAL_APPEARANCE_PREFERENCES
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Appearance & regional preferences updated.");
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Appearance & Language
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Customize the platform theme, interface language, currency indicators, and time conventions.
          </p>
        </div>
        <button
          type="submit"
          className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer"
        >
          Save Preferences
        </button>
      </div>

      {/* 1. Interface Theme */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Interface Theme
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "light" as const, label: "Light Theme", desc: "Default crisp fintech appearance" },
            { id: "dark" as const, label: "Dark Theme", desc: "High contrast dark mode (Beta)" },
            { id: "system" as const, label: "System Default", desc: "Sync with your device settings" },
          ].map((theme) => (
            <div
              key={theme.id}
              onClick={() => {
                setPrefs((prev) => ({ ...prev, theme: theme.id }));
                if (theme.id !== "light") {
                  showToast("Nexum default light theme preserved per active guidelines.");
                }
              }}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-1 ${
                prefs.theme === theme.id
                  ? "border-[#4f46e5] bg-[#eef2ff] text-[#4f46e5]"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">{theme.label}</span>
                {prefs.theme === theme.id && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[11px] opacity-75">{theme.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Language & Formatting Grid */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Regional & Number Formatting
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Primary Language
            </label>
            <select
              value={prefs.language}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, language: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            >
              <option value="English (United States)">English (United States)</option>
              <option value="English (UK)">English (United Kingdom)</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Primary Currency Indicator
            </label>
            <select
              value={prefs.currency}
              onChange={(e) =>
                setPrefs((prev) => ({
                  ...prev,
                  currency: e.target.value as "INR" | "USD" | "EUR",
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            >
              <option value="INR">INR (₹ Indian Rupee)</option>
              <option value="USD">USD ($ US Dollar)</option>
              <option value="EUR">EUR (€ Euro)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Date Format
            </label>
            <select
              value={prefs.dateFormat}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, dateFormat: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            >
              <option value="MMM DD, YYYY">Oct 31, 2026 (Standard)</option>
              <option value="DD/MM/YYYY">31/10/2026 (DD/MM/YYYY)</option>
              <option value="YYYY-MM-DD">2026-10-31 (ISO)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Time Format
            </label>
            <select
              value={prefs.timeFormat}
              onChange={(e) =>
                setPrefs((prev) => ({
                  ...prev,
                  timeFormat: e.target.value as "12h" | "24h",
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            >
              <option value="12h">12-hour (6:15 PM)</option>
              <option value="24h">24-hour (18:15)</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}
