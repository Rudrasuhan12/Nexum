"use client";

import React, { useState } from "react";
import {
  DollarSign,
  Lock,
  TrendingUp,
  Download,
  CreditCard,
  CheckCircle2,
  Receipt,
  ArrowUpRight,
} from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  description: string;
  client: string;
  project: string;
  amount: string;
  status: "completed" | "in_escrow" | "processing";
  statusLabel: string;
  hash: string;
  payoutMethod: string;
}

const TRANSACTIONS: Transaction[] = [
  {
    id: "tx_1",
    date: "Oct 26, 2026",
    description: "Milestone 1: Project Intake & Architecture PRD Payout",
    client: "Alex Rivera (Horizon Commerce)",
    project: "Bilateral E-Commerce Payment Rails",
    amount: "+$1,200.00 USD",
    status: "completed",
    statusLabel: "Completed / Paid Out",
    hash: "0x7a3f81e2b4...",
    payoutMethod: "PayPal REST Payout",
  },
  {
    id: "tx_2",
    date: "Oct 15, 2026",
    description: "Upfront Escrow Deposit: Discovery Phase",
    client: "Alex Rivera (Horizon Commerce)",
    project: "Bilateral E-Commerce Payment Rails",
    amount: "+$1,500.00 USD",
    status: "completed",
    statusLabel: "Completed / Paid Out",
    hash: "0x4b9c12df88...",
    payoutMethod: "PayPal REST Payout",
  },
  {
    id: "tx_3",
    date: "Oct 28, 2026",
    description: "Milestone 2: Orders Webhook Ingestion Engine Escrow Hold",
    client: "Alex Rivera (Horizon Commerce)",
    project: "Bilateral E-Commerce Payment Rails",
    amount: "$1,500.00 USD",
    status: "in_escrow",
    statusLabel: "Locked in Escrow",
    hash: "0x9f8c2b7e10...",
    payoutMethod: "Escrow Release Trigger",
  },
];

interface FreelancerEarningsPaymentsViewProps {
  showToast: (msg: string) => void;
}

export default function FreelancerEarningsPaymentsView({
  showToast,
}: FreelancerEarningsPaymentsViewProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = () => {
    setIsWithdrawing(true);
    showToast("Initiating PayPal REST sandbox instant payout transfer...");
    setTimeout(() => {
      setIsWithdrawing(false);
      showToast("Transfer successful! Funds dispatched to PayPal account.");
    }, 1800);
  };

  return (
    <div className="space-y-8">
      {/* Earnings Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Available for Payout</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">$2,700.00</div>
          <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready for instant transfer to PayPal</span>
          </p>
        </div>

        {/* Pending Escrow */}
        <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Pending Escrow Release</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Lock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">$1,500.00</div>
          <p className="text-xs text-indigo-700 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Releases on client Milestone 2 approval</span>
          </p>
        </div>

        {/* Lifetime Earnings */}
        <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Lifetime Platform Earnings</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">$8,450.00</div>
          <p className="text-xs text-slate-500 font-medium">
            18 contracts · 100% dispute-free
          </p>
        </div>
      </section>

      {/* Payout Setup & Direct Transfer */}
      <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
              <CreditCard className="w-4 h-4" />
              <span>Connected Payout Rails</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              PayPal REST Payouts API (Sandbox Environment)
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Account: sambit.freelancer@nexum.dev · Verified Merchant Status
            </p>
          </div>

          <button
            type="button"
            disabled={isWithdrawing}
            onClick={handleWithdraw}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{isWithdrawing ? "Processing..." : "Withdraw $2,700.00 USD Now"}</span>
          </button>
        </div>
      </section>

      {/* Transaction History & Consensus Ledger */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Consensus Transaction Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All transactions are bilaterally authenticated and signed with dual SHA-256 state hashes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => showToast("Exporting CSV report for tax year 2026...")}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Statement</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {TRANSACTIONS.map((tx) => (
            <div
              key={tx.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{tx.description}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {tx.statusLabel}
                  </span>
                </div>

                <div className="text-slate-500 flex flex-wrap items-center gap-3">
                  <span>{tx.date}</span>
                  <span>· Client: <strong className="text-slate-700">{tx.client}</strong></span>
                  <span>· Hash: <strong className="font-mono text-indigo-600">{tx.hash}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                <div className="text-right font-mono font-bold text-sm text-slate-900">
                  {tx.amount}
                </div>
                <button
                  type="button"
                  onClick={() => showToast(`Downloading receipt for ${tx.id}...`)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                  title="Download Receipt PDF"
                >
                  <Receipt className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
