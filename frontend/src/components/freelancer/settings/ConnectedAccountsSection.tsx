"use client";

import React, { useState } from "react";
import { Link2, CheckCircle2 } from "lucide-react";
import { ConnectedAccountItem } from "@/lib/freelancer-settings-types";
import { INITIAL_CONNECTED_ACCOUNTS } from "@/lib/freelancer-settings-data";

interface ConnectedAccountsSectionProps {
  showToast: (msg: string) => void;
}

export default function ConnectedAccountsSection({
  showToast,
}: ConnectedAccountsSectionProps) {
  const [accounts, setAccounts] = useState<ConnectedAccountItem[]>(
    INITIAL_CONNECTED_ACCOUNTS
  );

  const toggleAccount = (id: string, name: string, isConnected: boolean) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id
          ? {
              ...acc,
              isConnected: !isConnected,
              identifier: !isConnected ? "connected.user@nexum.dev" : "Not connected",
            }
          : acc
      )
    );
    showToast(
      !isConnected
        ? `Connected ${name} integration successfully.`
        : `Disconnected ${name} access.`
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Connected Accounts
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Link external developer tools, identity providers, and payout rails to automate verifications.
        </p>
      </div>

      <div className="space-y-3.5">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold">
                {acc.provider === "PayPal" ? (
                  <span className="text-[#003087] italic font-black text-lg">P</span>
                ) : acc.provider === "GitHub" ? (
                  <span className="text-slate-900 font-mono text-base font-bold">GH</span>
                ) : acc.provider === "Google" ? (
                  <span className="text-red-500 font-bold text-base">G</span>
                ) : (
                  <Link2 className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">{acc.name}</h3>
                  {acc.isConnected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <CheckCircle2 className="w-3 h-3" />
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                  {acc.identifier}
                </p>
                {acc.connectedAt && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Authorized on {acc.connectedAt}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleAccount(acc.id, acc.name, acc.isConnected)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer self-start sm:self-center whitespace-nowrap ${
                acc.isConnected
                  ? "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  : "bg-[#4f46e5] hover:bg-[#4338ca] text-white"
              }`}
            >
              {acc.isConnected ? "Disconnect" : "Connect Account"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
