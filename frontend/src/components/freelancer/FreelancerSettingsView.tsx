"use client";

import React, { useState } from "react";
import {
  User,
  DollarSign,
  Clock,
  CreditCard,
  Bell,
  Save,
} from "lucide-react";
import { DemoUser } from "@/lib/auth-types";

interface FreelancerSettingsViewProps {
  freelancer: DemoUser;
  showToast: (msg: string) => void;
}

export default function FreelancerSettingsView({
  freelancer,
  showToast,
}: FreelancerSettingsViewProps) {
  const [name, setName] = useState(freelancer.name);
  const [title, setTitle] = useState(freelancer.title || "Senior Full Stack & Escrow Systems Engineer");
  const [hourlyRate, setHourlyRate] = useState("65.00");
  const [hoursPerWeek, setHoursPerWeek] = useState("35");
  const [payoutEmail, setPayoutEmail] = useState("sambit.freelancer@nexum.dev");
  const [notifyOnMilestone, setNotifyOnMilestone] = useState(true);
  const [notifyOnCounteroffer, setNotifyOnCounteroffer] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Freelancer profile & payout preferences saved successfully!");
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      {/* Profile & Rates */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" />
          <span>Professional Profile & Pricing</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Legal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Professional Headline / Role
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hourly Rate ($ USD / hr)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Weekly Availability (Hours / Week)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>
          </div>
        </div>
      </section>

      {/* Payout Credentials */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <span>PayPal Sandbox Payout Account</span>
        </h2>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            PayPal Merchant / Freelancer Payout Email
          </label>
          <input
            type="email"
            value={payoutEmail}
            onChange={(e) => setPayoutEmail(e.target.value)}
            className="w-full max-w-md px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            PayPal Sandbox order captures are disbursed automatically upon bilateral milestone signoff.
          </p>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          <span>Notification Preferences</span>
        </h2>

        <div className="space-y-3 text-xs">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOnMilestone}
              onChange={(e) => setNotifyOnMilestone(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span className="text-slate-700 font-medium">
              Notify me instantly when client accepts milestone & releases escrow funds
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOnCounteroffer}
              onChange={(e) => setNotifyOnCounteroffer(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span className="text-slate-700 font-medium">
              Notify me when a client sends a counteroffer or revision feedback
            </span>
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}
