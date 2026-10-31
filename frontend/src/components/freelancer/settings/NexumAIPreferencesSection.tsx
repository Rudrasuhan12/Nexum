"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";
import { NexumAIPreferences } from "@/lib/freelancer-settings-types";
import { INITIAL_AI_PREFERENCES } from "@/lib/freelancer-settings-data";

interface NexumAIPreferencesSectionProps {
  showToast: (msg: string) => void;
}

export default function NexumAIPreferencesSection({
  showToast,
}: NexumAIPreferencesSectionProps) {
  const [prefs, setPrefs] = useState<NexumAIPreferences>(INITIAL_AI_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (key: keyof NexumAIPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Nexum AI assistance preferences updated.");
    }, 500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Nexum AI Preferences
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure how the multi-model AI copilot assists your proposals, deliverable summaries, and scope mediation.
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

      {/* 1. Core AI Assistance Features */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          AI Copilot Capabilities
        </h3>

        <div className="divide-y divide-slate-100">
          {[
            {
              key: "proposalDrafting" as const,
              label: "AI-Assisted Proposal Drafting",
              desc: "Generate PRD scopes, milestone architecture, and competitive quotes automatically.",
            },
            {
              key: "messageDrafting" as const,
              label: "AI-Assisted Message Drafting & Mediation",
              desc: "Draft professional client replies and review scope impact before sending.",
            },
            {
              key: "milestoneSummaries" as const,
              label: "Milestone Deliverable Summaries",
              desc: "Auto-generate test logs and SHA-256 evidence digests from GitHub PRs.",
            },
            {
              key: "scopeChangeExplanations" as const,
              label: "Scope Change Impact Explanations",
              desc: "Highlight price and schedule diffs whenever contract versions advance.",
            },
            {
              key: "communicationSuggestions" as const,
              label: "Bilateral Communication Suggestions",
              desc: "De-escalate disputes and clarify ambiguous client acceptance criteria.",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="py-3.5 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">{item.label}</p>
                <p className="text-[11px] text-slate-500">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(item.key)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer shrink-0 ${
                  prefs[item.key] ? "bg-[#4f46e5]" : "bg-slate-200"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    prefs[item.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Response Style & Language */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Response Style & Tone
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Copilot Verbosity
            </label>
            <select
              value={prefs.responseStyle}
              onChange={(e) =>
                setPrefs((prev) => ({
                  ...prev,
                  responseStyle: e.target.value as "Concise" | "Balanced" | "Detailed",
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            >
              <option value="Concise">Concise (Fast bullet points & summaries)</option>
              <option value="Balanced">Balanced (Standard professional explanations)</option>
              <option value="Detailed">Detailed (Full PRD breakdown & technical specs)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Primary Language
            </label>
            <input
              type="text"
              value={prefs.responseLanguage}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, responseLanguage: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>
        </div>
      </div>

      {/* 3. Privacy & Safety Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900">
        <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Segregated AI Privacy Guarantee:</span> Nexum AI can
          only access information authorized for its particular workflow. Private AI conversations
          remain strictly private and are never disclosed to clients. AI never independently
          approves agreements, accepts work, or releases funds.
        </div>
      </div>
    </form>
  );
}
