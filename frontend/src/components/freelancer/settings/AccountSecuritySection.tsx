"use client";

import React, { useState } from "react";
import {
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Monitor,
  Smartphone,
  Power,
  MoreHorizontal,
  CheckCircle2,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { ActiveSession } from "@/lib/freelancer-settings-types";

interface AccountSecuritySectionProps {
  email: string;
  phone: string;
  passwordLastChanged: string;
  sessions: ActiveSession[];
  onChangeEmail: () => void;
  onChangePhone: () => void;
  onChangePassword: () => void;
  onEdit2FA: () => void;
  onSignOutAllSessions: () => void;
  onDeactivateAccount: () => void;
  showToast: (msg: string) => void;
}

export default function AccountSecuritySection({
  email,
  phone,
  passwordLastChanged,
  sessions,
  onChangeEmail,
  onChangePhone,
  onChangePassword,
  onEdit2FA,
  onSignOutAllSessions,
  onDeactivateAccount,
  showToast,
}: AccountSecuritySectionProps) {
  const [active2FAMethod, setActive2FAMethod] = useState<"authenticator" | "sms">(
    "authenticator"
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Account & Security
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage your login details and keep your account secure.
        </p>
      </div>

      <div className="space-y-4">
        {/* 1. Email Address Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500">Email Address</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {email}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Used for login, notifications and important updates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onChangeEmail}
            className="self-start sm:self-center py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#4f46e5] hover:border-[#4f46e5]/40 transition shadow-2xs cursor-pointer whitespace-nowrap"
          >
            Change Email
          </button>
        </div>

        {/* 2. Phone Number Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500">Phone Number</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {phone}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Used for account security and important alerts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onChangePhone}
            className="self-start sm:self-center py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#4f46e5] hover:border-[#4f46e5]/40 transition shadow-2xs cursor-pointer whitespace-nowrap"
          >
            Change Phone
          </button>
        </div>

        {/* 3. Password Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500">Password</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 tracking-widest font-mono">
                ••••••••••••
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Last changed on {passwordLastChanged}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onChangePassword}
            className="self-start sm:self-center py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#4f46e5] hover:border-[#4f46e5]/40 transition shadow-2xs cursor-pointer whitespace-nowrap"
          >
            Change Password
          </button>
        </div>

        {/* 4. Two-Factor Authentication (2FA) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Two-Factor Authentication (2FA)
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Enabled
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Add an extra layer of security to your account.
                </p>
              </div>
            </div>
          </div>

          {/* Nested 2FA Options */}
          <div className="space-y-2.5 pt-1 pl-0 sm:pl-13">
            {/* Option A: Authenticator App */}
            <div
              onClick={() => setActive2FAMethod("authenticator")}
              className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                active2FAMethod === "authenticator"
                  ? "border-[#4f46e5]/40 bg-[#f8f9ff]"
                  : "border-slate-200/80 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    Authenticator App
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Use an authenticator app (Google Authenticator, Authy, etc.)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    active2FAMethod === "authenticator"
                      ? "border-[#4f46e5]"
                      : "border-slate-300"
                  }`}
                >
                  {active2FAMethod === "authenticator" && (
                    <div className="w-2 h-2 rounded-full bg-[#4f46e5]" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit2FA();
                  }}
                  className="py-1 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Option B: SMS Verification */}
            <div
              onClick={() => setActive2FAMethod("sms")}
              className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                active2FAMethod === "sms"
                  ? "border-[#4f46e5]/40 bg-[#f8f9ff]"
                  : "border-slate-200/80 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    SMS Verification
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Receive codes via SMS
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    active2FAMethod === "sms"
                      ? "border-[#4f46e5]"
                      : "border-slate-300"
                  }`}
                >
                  {active2FAMethod === "sms" && (
                    <div className="w-2 h-2 rounded-full bg-[#4f46e5]" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast("SMS verification OTP sent to registered phone number.");
                  }}
                  className="py-1 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                >
                  Enable
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Active Sessions Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  Active Sessions
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You&apos;re currently logged in on {sessions.length} devices.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOutAllSessions}
              className="py-1.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100/70 text-xs font-bold text-red-600 transition cursor-pointer"
            >
              Sign Out All
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {sess.deviceType === "desktop" ? (
                    <Monitor className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {sess.device}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{sess.location}</span>
                      {sess.isCurrent && (
                        <span className="flex items-center gap-1 font-bold text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Current Session
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {sess.lastActive}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        sess.isCurrent
                          ? "This is your current active session."
                          : `Signed out session on ${sess.device}.`
                      )
                    }
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Account Deactivation Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center shrink-0">
              <Power className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Account Deactivation
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Temporarily deactivate your account. You can reactivate it anytime.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDeactivateAccount}
            className="self-start sm:self-center py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer whitespace-nowrap"
          >
            Deactivate Account
          </button>
        </div>
      </div>
    </div>
  );
}

