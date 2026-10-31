"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { PrivacyPreferences } from "@/lib/freelancer-settings-types";
import { INITIAL_PRIVACY_PREFERENCES } from "@/lib/freelancer-settings-data";

interface PrivacyDataSectionProps {
  showToast: (msg: string) => void;
  onDownloadData: () => void;
}

export default function PrivacyDataSection({
  showToast,
  onDownloadData,
}: PrivacyDataSectionProps) {
  const [prefs, setPrefs] = useState<PrivacyPreferences>(INITIAL_PRIVACY_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (key: keyof PrivacyPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Privacy preferences updated successfully.");
    }, 500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Privacy & Data Controls
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage who can view your profile, discovery visibility, and export your platform records.
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

      {/* 1. Visibility Options */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Profile Discovery & Visibility
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Who can discover your profile?
            </label>
            <select
              value={prefs.profileVisibility}
              onChange={(e) =>
                setPrefs((prev) => ({
                  ...prev,
                  profileVisibility: e.target.value as "PUBLIC" | "VERIFIED_CLIENTS" | "PRIVATE",
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            >
              <option value="PUBLIC">Public (All clients on Nexum)</option>
              <option value="VERIFIED_CLIENTS">Verified Clients Only (Active Escrow required)</option>
              <option value="PRIVATE">Private (Only clients you directly apply to)</option>
            </select>
          </div>

          <div className="divide-y divide-slate-100 pt-1">
            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Searchable in Freelancer Directory
                </p>
                <p className="text-[11px] text-slate-500">
                  Allow buyers to find your skill tags and portfolio through AI search.
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle("searchableInDirectory")}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer shrink-0 ${
                  prefs.searchableInDirectory ? "bg-[#4f46e5]" : "bg-slate-200"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    prefs.searchableInDirectory ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Show Verified Milestone Deliverables
                </p>
                <p className="text-[11px] text-slate-500">
                  Showcase approved project outcomes and verifiable completion hashes on your profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle("showPublicPortfolio")}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer shrink-0 ${
                  prefs.showPublicPortfolio ? "bg-[#4f46e5]" : "bg-slate-200"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    prefs.showPublicPortfolio ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Data Export Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#4f46e5] flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Download Personal Data Archive
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Export your contracts, payment receipts, audit events, and profile data in JSON format.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDownloadData}
          className="py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition shadow-2xs cursor-pointer whitespace-nowrap self-start sm:self-center"
        >
          Download My Data
        </button>
      </div>
    </form>
  );
}
