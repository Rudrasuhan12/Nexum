"use client";

import React, { useState } from "react";
import { X, Scale, DollarSign, Calendar, MessageSquare, Loader2, ArrowRight } from "lucide-react";
import { counterScopeAmendment } from "@/lib/api-client";

interface CounterofferModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  messageId: string;
  currentAmountMinor: number;
  currentDays: number;
  currentTitle: string;
  responderId: string;
  responderRole: "CLIENT" | "FREELANCER";
  currency?: string;
  onSuccess?: () => void;
  showToast?: (msg: string) => void;
}

export default function CounterofferModal({
  isOpen,
  onClose,
  projectId,
  messageId,
  currentAmountMinor,
  currentDays,
  currentTitle,
  responderId,
  responderRole,
  currency = "USD",
  onSuccess,
  showToast,
}: CounterofferModalProps) {
  const [counterBudgetDollars, setCounterBudgetDollars] = useState<number>(
    Math.round(currentAmountMinor / 100)
  );
  const [counterTimelineDays, setCounterTimelineDays] = useState<number>(currentDays || 14);
  const [reasoning, setReasoning] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitCounteroffer = async () => {
    if (!reasoning.trim()) {
      setErrorMessage("Please provide a reasoning / rationale for your counteroffer.");
      return;
    }
    if (counterBudgetDollars <= 0) {
      setErrorMessage("Counter budget must be greater than 0.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const amountMinor = Math.round(counterBudgetDollars * 100);
      const res = await counterScopeAmendment(projectId, messageId, {
        responderId,
        responderRole,
        counterAmountMinor: amountMinor,
        counterDays: counterTimelineDays,
        reasoning: reasoning.trim(),
      });

      if (res.success) {
        showToast?.("Counteroffer submitted! Sent to counterpart for bilateral consensus.");
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.error || "Failed to submit counteroffer");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <Scale className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base font-bold">Counteroffer Addendum Scope</h2>
              <p className="text-xs text-amber-100/90">{currentTitle || "Milestone Addendum"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Current offer comparison */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between text-xs">
            <div>
              <div className="text-[10px] text-amber-800 uppercase font-bold">Currently Proposed</div>
              <div className="font-bold text-slate-900 mt-0.5">
                ${(currentAmountMinor / 100).toLocaleString()} {currency} · {currentDays} days
              </div>
            </div>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              Adjustable
            </span>
          </div>

          {/* Counter Budget & Timeline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Counter Budget</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="1"
                  step="50"
                  value={counterBudgetDollars}
                  onChange={(e) => setCounterBudgetDollars(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Delivery (Days)</span>
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={counterTimelineDays}
                onChange={(e) => setCounterTimelineDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Counter Reasoning */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
              <span>Reasoning & Technical Justification <span className="text-amber-600">*</span></span>
            </label>
            <textarea
              rows={3}
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Explain why the timeline or budget needs adjustment (e.g. edge-case testing, database scaling, API rate limits)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitCounteroffer}
            disabled={isSubmitting}
            className="px-4.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Counteroffer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

