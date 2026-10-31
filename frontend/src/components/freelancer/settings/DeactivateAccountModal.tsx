"use client";

import React, { useState } from "react";
import { X, Power, AlertTriangle } from "lucide-react";

interface DeactivateAccountModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeactivateAccountModal({
  onClose,
  onConfirm,
}: DeactivateAccountModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeactivate = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onConfirm();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Deactivate Freelancer Profile
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Temporarily pause new invitations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            While deactivated:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-500 text-[11px]">
            <li>Your profile will be hidden from client discovery and search results.</li>
            <li>Existing active milestone contracts remain accessible.</li>
            <li>You can reactivate your account at any time by logging in again.</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Keep Active
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleDeactivate}
            className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Deactivating..." : "Confirm Deactivation"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

