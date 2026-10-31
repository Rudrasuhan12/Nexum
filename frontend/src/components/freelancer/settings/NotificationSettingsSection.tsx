"use client";

import React, { useState } from "react";
import { NotificationPreferences } from "@/lib/freelancer-settings-types";
import { INITIAL_NOTIFICATION_PREFS } from "@/lib/freelancer-settings-data";

interface NotificationSettingsSectionProps {
  showToast: (msg: string) => void;
}

export default function NotificationSettingsSection({
  showToast,
}: NotificationSettingsSectionProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(INITIAL_NOTIFICATION_PREFS);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Notification preferences updated and saved.");
    }, 500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Notifications
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose what alerts and events you want to receive across email and in-app channels.
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

      {/* 1. Project Notifications */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Project & Opportunity Alerts
        </h3>
        <div className="divide-y divide-slate-100">
          {[
            {
              key: "projectInvitations" as const,
              label: "New Project Invitations",
              desc: "Receive alerts when a client invites you to submit a proposal.",
            },
            {
              key: "proposalResponses" as const,
              label: "Proposal Responses & Counteroffers",
              desc: "Get notified when a client accepts, counters, or questions your quote.",
            },
            {
              key: "milestoneUpdates" as const,
              label: "Milestone State Changes",
              desc: "Alerts when milestones are approved or move into review state.",
            },
            {
              key: "scopeChangeRequests" as const,
              label: "Scope Change Requests",
              desc: "Notices when either side requests price or schedule adjustments.",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="py-3 flex items-center justify-between gap-4"
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

      {/* 2. Communication Notifications */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Communication & Mediation
        </h3>
        <div className="divide-y divide-slate-100">
          {[
            {
              key: "clientMessages" as const,
              label: "New Client Messages",
              desc: "Instant notifications when a client writes in the mediated workspace.",
            },
            {
              key: "aiMediationUpdates" as const,
              label: "Nexum AI Mediation Summaries",
              desc: "Receive summaries when AI reconciles scope or drafts counteroffers.",
            },
            {
              key: "meetingInvitations" as const,
              label: "Meeting & Sync Invitations",
              desc: "Calendar invitations for scheduled project reviews.",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="py-3 flex items-center justify-between gap-4"
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

      {/* 3. Payment Notifications */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Payments & Payouts
        </h3>
        <div className="divide-y divide-slate-100">
          {[
            {
              key: "paymentCaptures" as const,
              label: "Payment Capture Confirmation",
              desc: "Alert when a client deposits milestone funds into verified escrow.",
            },
            {
              key: "payoutProcessing" as const,
              label: "Payout Processing & Sweeps",
              desc: "Notifications when automated withdrawals dispatch to PayPal.",
            },
            {
              key: "payoutCompleted" as const,
              label: "Payout Completion",
              desc: "Receipt delivery when funds successfully settle.",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="py-3 flex items-center justify-between gap-4"
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

      {/* 4. Delivery Channels */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Delivery Channels
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Email Alerts</span>
            <input
              type="checkbox"
              checked={prefs.emailChannel}
              onChange={() => toggle("emailChannel")}
              className="accent-[#4f46e5] w-4 h-4"
            />
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">In-App Alerts</span>
            <input
              type="checkbox"
              checked={prefs.inAppChannel}
              onChange={() => toggle("inAppChannel")}
              className="accent-[#4f46e5] w-4 h-4"
            />
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Browser Push</span>
            <input
              type="checkbox"
              checked={prefs.pushChannel}
              onChange={() => toggle("pushChannel")}
              className="accent-[#4f46e5] w-4 h-4"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
