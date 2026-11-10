"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Calendar, Clock, Video, Check, Globe, Sparkles, AlertCircle } from "lucide-react";
import {
  getDefaultMeetingSlot,
  formatInTimezone,
  getTimezoneFriendlyName,
  isSameTimezone,
  parseMeetingSlot,
} from "@/lib/timezone-utils";

export interface ScheduleMeetingPayload {
  date: string;
  time: string;
  topic: string;
  duration?: string;
  isoStartTime?: string;
  displaySlot?: string;
  clientTime?: string;
  freelancerTime?: string;
}

interface ProposeMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  freelancerName?: string;
  clientName?: string;
  freelancerTimezone?: string;
  clientTimezone?: string;
  currentUserRole?: "CLIENT" | "FREELANCER";
  onScheduleMeeting?: (details: ScheduleMeetingPayload) => void;
}

export default function ProposeMeetingModal({
  isOpen,
  onClose,
  freelancerName = "Sambit Kumar",
  clientName = "Alex Rivera",
  freelancerTimezone = "Asia/Kolkata",
  clientTimezone = "America/New_York",
  currentUserRole = "CLIENT",
  onScheduleMeeting,
}: ProposeMeetingModalProps) {
  // Determine effective timezones
  const browserTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Kolkata";
  
  const userTz = currentUserRole === "FREELANCER" ? (freelancerTimezone || browserTz) : (clientTimezone || browserTz);
  const counterpartTz = currentUserRole === "FREELANCER" ? clientTimezone : freelancerTimezone;
  const counterpartName = currentUserRole === "FREELANCER" ? clientName : freelancerName;

  // Active form state
  const [topic, setTopic] = useState("Milestone & Scope Alignment Review");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30 min");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nowTick, setNowTick] = useState(new Date());

  // Reset to live current date/time on modal open
  useEffect(() => {
    if (isOpen) {
      const defaultSlot = getDefaultMeetingSlot(userTz);
      setDate(defaultSlot.date);
      setTime(defaultSlot.time);
      setNowTick(new Date());
    }
  }, [isOpen, userTz]);

  // Keep live clock ticking for accurate timezone comparisons
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNowTick(new Date()), 15000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Timezone calculations for both parties
  const sameTimezone = useMemo(() => isSameTimezone(userTz, counterpartTz), [userTz, counterpartTz]);

  const userLive = useMemo(() => formatInTimezone(nowTick, userTz), [nowTick, userTz]);
  const counterpartLive = useMemo(() => formatInTimezone(nowTick, counterpartTz), [nowTick, counterpartTz]);

  // Selected meeting moment in both timezones
  const selectedSlotComparison = useMemo(() => {
    if (!date || !time) return null;
    const parsed = parseMeetingSlot(`${date} at ${time}`);
    const uFmt = formatInTimezone(parsed, userTz);
    const cFmt = formatInTimezone(parsed, counterpartTz);

    // Parse hour in counterpart timezone to give business hour warning
    const cHourMatch = cFmt.timeFormatted.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let isLateNightOrEarlyMorning = false;
    if (cHourMatch) {
      let h = parseInt(cHourMatch[1], 10);
      const isPm = cHourMatch[3].toUpperCase() === "PM";
      if (isPm && h < 12) h += 12;
      if (!isPm && h === 12) h = 0;
      // Outside 8 AM - 10 PM
      if (h < 8 || h >= 22) {
        isLateNightOrEarlyMorning = true;
      }
    }

    return {
      parsedDate: parsed,
      user: uFmt,
      counterpart: cFmt,
      isOutsideNormalHours: isLateNightOrEarlyMorning,
    };
  }, [date, time, userTz, counterpartTz]);

  if (!isOpen) return null;

  // Preset quick buttons
  const setQuickSlot = (type: "NOW_30" | "TOMORROW_10AM" | "TOMORROW_3PM") => {
    const d = new Date();
    if (type === "NOW_30") {
      const m = d.getMinutes();
      const nextH = m < 30 ? d.getHours() : d.getHours() + 1;
      const nextM = m < 30 ? 30 : 0;
      d.setHours(nextH, nextM, 0, 0);
    } else if (type === "TOMORROW_10AM") {
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);
    } else if (type === "TOMORROW_3PM") {
      d.setDate(d.getDate() + 1);
      d.setHours(15, 0, 0, 0);
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");

    setDate(`${year}-${month}-${day}`);
    setTime(`${hours}:${mins}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const safeDate = selectedSlotComparison?.parsedDate || new Date();
    const durationMins = parseInt(duration) || 30;

    const payload: ScheduleMeetingPayload = {
      date,
      time,
      topic: `${topic} (${duration})`,
      duration,
      isoStartTime: safeDate.toISOString(),
      displaySlot: selectedSlotComparison?.user.fullFormatted || `${date} at ${time}`,
      clientTime: formatInTimezone(safeDate, clientTimezone).fullFormatted,
      freelancerTime: formatInTimezone(safeDate, freelancerTimezone).fullFormatted,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      if (onScheduleMeeting) {
        onScheduleMeeting(payload);
      }
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-b from-slate-50/80 to-white">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#4f46e5] bg-[#eef2ff] border border-indigo-100">
              <Video className="w-3.5 h-3.5" />
              <span>Bilateral Time Consensus</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Propose Meeting with {counterpartName}
            </h3>
            <p className="text-xs text-slate-500">
              Synchronized cross-timezone scheduling with AI Notetaker.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer shrink-0 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Dual-Timezone Compass Card */}
        <div className="px-5 sm:px-6 pt-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span className="flex items-center gap-1 text-indigo-700">
                <Globe className="w-3.5 h-3.5" />
                <span>Live Timezone Synchronization</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                ● Live
              </span>
            </div>

            {sameTimezone ? (
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Both parties in {getTimezoneFriendlyName(userTz)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Meeting times apply identically with zero timezone offset.
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-sm text-indigo-700">
                    {userLive.timeFormatted}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium">{userLive.zoneAbbr}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* User Column */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">You ({currentUserRole === "FREELANCER" ? "Freelancer" : "Client"})</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600">{userLive.zoneAbbr}</span>
                  </div>
                  <div className="font-mono font-bold text-sm text-slate-900">{userLive.timeFormatted}</div>
                  <div className="text-[10px] text-slate-500 truncate" title={getTimezoneFriendlyName(userTz)}>
                    {getTimezoneFriendlyName(userTz).split("(")[0]}
                  </div>
                </div>

                {/* Counterpart Column */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400 truncate max-w-[90px]">{counterpartName}</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600">{counterpartLive.zoneAbbr}</span>
                  </div>
                  <div className="font-mono font-bold text-sm text-slate-900">{counterpartLive.timeFormatted}</div>
                  <div className="text-[10px] text-slate-500 truncate" title={getTimezoneFriendlyName(counterpartTz)}>
                    {getTimezoneFriendlyName(counterpartTz).split("(")[0]}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Agenda / Topic <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              placeholder="e.g. Milestone 1 Acceptance & Verification Review"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Select:</span>
            <button
              type="button"
              onClick={() => setQuickSlot("NOW_30")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition cursor-pointer"
            >
              +30 Mins
            </button>
            <button
              type="button"
              onClick={() => setQuickSlot("TOMORROW_10AM")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition cursor-pointer"
            >
              Tomorrow 10:00 AM
            </button>
            <button
              type="button"
              onClick={() => setQuickSlot("TOMORROW_3PM")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition cursor-pointer"
            >
              Tomorrow 3:00 PM
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date ({userLive.zoneAbbr}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Time ({userLive.zoneAbbr}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Live Slot Conversion Banner */}
          {selectedSlotComparison && (
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 text-indigo-950 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Synchronized Slot Preview</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                <div className="text-slate-700">
                  <span className="font-semibold text-slate-900">Your Time:</span>{" "}
                  <span className="font-mono text-indigo-800 font-bold">
                    {selectedSlotComparison.user.dateFormatted}, {selectedSlotComparison.user.timeFormatted} ({selectedSlotComparison.user.zoneAbbr})
                  </span>
                </div>
                
                <div className="text-slate-700">
                  <span className="font-semibold text-slate-900">{counterpartName}:</span>{" "}
                  <span className="font-mono text-purple-800 font-bold">
                    {selectedSlotComparison.counterpart.dateFormatted}, {selectedSlotComparison.counterpart.timeFormatted} ({selectedSlotComparison.counterpart.zoneAbbr})
                  </span>
                </div>
              </div>

              {selectedSlotComparison.isOutsideNormalHours && (
                <div className="flex items-center gap-1 text-[10px] text-amber-700 font-medium pt-0.5">
                  <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Note: This is early morning or late night for {counterpartName} ({selectedSlotComparison.counterpart.timeFormatted}).</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["15 min", "30 min", "45 min", "60 min"].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setDuration(dur)}
                  className={`py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    duration === dur
                      ? "bg-[#eef2ff] border-[#4f46e5] text-[#4f46e5] shadow-2xs font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            Nexum posts a bilateral proposal card directly into the project channel. Internal video room and Groq Whisper v3 notetaker activate upon confirmation.
          </p>

          <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !date || !time}
              className="px-5 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Proposing..." : "Propose Meeting"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
