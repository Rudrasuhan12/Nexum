"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteAccountSectionProps {
  showToast?: (msg: string) => void;
  onConfirmDelete: () => void;
}

export default function DeleteAccountSection({
  onConfirmDelete,
}: DeleteAccountSectionProps) {
  const [confirmText, setConfirmText] = useState("");
  const isMatch = confirmText.trim() === "DELETE MY ACCOUNT";

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) return;
    onConfirmDelete();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-red-600 tracking-tight">
          Delete Account
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Permanently delete your freelancer profile, reputation history, and connected credentials.
        </p>
      </div>

      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-red-200 shadow-2xs space-y-4">
        <div className="flex items-start gap-3.5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Warning: This action is permanent and irreversible.</span>
            <p className="text-red-800 leading-relaxed">
              Deleting your account will purge your portfolio, active proposal drafts,
              and reputation ratings. Historical consensus audit hashes on the ledger remain
              permanently verifiable for legal and anti-fraud compliance.
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-700">
          <p className="font-bold">Before deletion can proceed, verify that:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-500 text-[11px]">
            <li>All active client milestone contracts have concluded or been mutually cancelled.</li>
            <li>All eligible PayPal payout balances have been completely withdrawn.</li>
            <li>No pending dispute mediation tickets remain open.</li>
          </ul>
        </div>

        <form onSubmit={handleDelete} className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-slate-700">
            To proceed, type <span className="font-mono text-red-600">DELETE MY ACCOUNT</span> below:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE MY ACCOUNT"
            className="w-full px-3 py-2 rounded-xl border border-red-200 text-xs font-mono text-slate-900 outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />

          <button
            type="submit"
            disabled={!isMatch}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
              isMatch
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Permanently Delete Freelancer Account</span>
          </button>
        </form>
      </div>
    </div>
  );
}
