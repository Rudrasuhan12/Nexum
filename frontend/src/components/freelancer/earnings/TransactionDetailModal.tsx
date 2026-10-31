"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  CreditCard,
  Building,
} from "lucide-react";
import { FreelancerTransaction } from "@/lib/freelancer-earnings-types";

interface TransactionDetailModalProps {
  transaction: FreelancerTransaction | null;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export default function TransactionDetailModal({
  transaction,
  onClose,
  showToast,
}: TransactionDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(transaction.proofHash);
    setCopied(true);
    showToast("Transaction cryptographic hash copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const isPayout = transaction.type === "Payout";
  const isFee = transaction.type === "Fee";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isPayout
                  ? "bg-blue-50 text-blue-600"
                  : isFee
                  ? "bg-purple-50 text-purple-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {isPayout ? (
                <CreditCard className="w-5 h-5" />
              ) : isFee ? (
                <Building className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {transaction.description}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {transaction.subtitle} · {transaction.date}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Status Badge */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Transaction Amount
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {transaction.formattedAmount}
            </div>
          </div>
          <div>
            {transaction.status === "Received" || transaction.status === "Completed" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {transaction.status}
              </span>
            ) : transaction.status === "Under Review" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                Under Review
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Clock className="w-3.5 h-3.5" />
                Pending
              </span>
            )}
          </div>
        </div>

        {/* Breakdown & Accounting Details */}
        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
            <span>Project</span>
            <span className="font-bold text-slate-900">{transaction.project}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
            <span>Client / Entity</span>
            <span className="font-semibold text-slate-800">{transaction.client}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
            <span>Transaction Type</span>
            <span className="font-mono font-medium text-slate-700">{transaction.type}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
            <span>Settlement Rail</span>
            <span className="font-medium text-slate-800">{transaction.paymentRail}</span>
          </div>
          {transaction.orderId && (
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>Order Reference</span>
              <span className="font-mono text-slate-800">{transaction.orderId}</span>
            </div>
          )}
          {transaction.captureId && (
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>Provider Capture ID</span>
              <span className="font-mono text-slate-800">{transaction.captureId}</span>
            </div>
          )}
        </div>

        {/* Cryptographic SHA-256 Ledger Hash */}
        <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Cryptographic Consensus Proof
            </span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="flex items-center gap-1 text-[#4f46e5] hover:text-[#4338ca] transition cursor-pointer font-semibold"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="text-[11px] font-mono text-indigo-700 truncate">
            {transaction.proofHash}
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              showToast(`Receipt for ${transaction.description} downloaded.`);
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer"
          >
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
