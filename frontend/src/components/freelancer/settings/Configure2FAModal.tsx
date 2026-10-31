"use client";

import React, { useState } from "react";
import { X, CheckCircle2, QrCode } from "lucide-react";

interface Configure2FAModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function Configure2FAModal({
  onClose,
  onSave,
}: Configure2FAModalProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSave();
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Configure Authenticator App
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan the setup code in Google Authenticator or Authy.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-24 h-24 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
            <QrCode className="w-16 h-16 text-slate-800" />
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Manual Secret: NXUM-7794-28BA-99FC
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Enter 6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest text-center text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={code.length < 6 || isSubmitting}
              className="py-2.5 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Verifying..." : "Verify & Save"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
