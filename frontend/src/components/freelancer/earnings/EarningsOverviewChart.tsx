"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MonthlyEarningPoint } from "@/lib/freelancer-earnings-types";

interface EarningsOverviewChartProps {
  data: MonthlyEarningPoint[];
}

export default function EarningsOverviewChart({ data }: EarningsOverviewChartProps) {
  const [timeRange, setTimeRange] = useState<"3M" | "6M" | "1Y">("6M");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const displayData =
    timeRange === "3M"
      ? data.slice(-3)
      : data;

  const maxVal = 60000; // ₹60K reference line in screenshot
  const yTicks = [60000, 45000, 30000, 15000, 0];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between h-full">
      {/* Header & Time Filter */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
        <div className="relative">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Earnings Overview
          </h3>
          <span className="absolute -bottom-2.5 left-0 w-8 h-0.5 bg-[#4f46e5] rounded-full" />
        </div>

        {/* Dropdown selector */}
        <div className="relative">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "3M" | "6M" | "1Y")}
            aria-label="Filter earnings time range"
            className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 pl-3 pr-7 rounded-xl transition cursor-pointer outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
          >
            <option value="6M">Last 6 Months</option>
            <option value="3M">Last 3 Months</option>
            <option value="1Y">This Year</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative pt-2 pb-2 select-none">
        {/* Y-Axis Grid Lines */}
        <div className="space-y-6">
          {yTicks.map((tick) => (
            <div key={tick} className="flex items-center gap-3">
              <span className="w-9 text-right text-[11px] font-mono font-medium text-slate-400 shrink-0">
                {tick === 0 ? "₹0" : `₹${tick / 1000}K`}
              </span>
              <div className="flex-1 border-t border-dashed border-slate-100" />
            </div>
          ))}
        </div>

        {/* Stacked Bars Container */}
        <div className="absolute inset-x-0 bottom-4 pl-12 pr-4 flex items-end justify-between h-[155px]">
          {displayData.map((pt, idx) => {
            const receivedHeightPct = (pt.received / maxVal) * 100;
            const pendingHeightPct = (pt.pending / maxVal) * 100;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={pt.month}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center group relative cursor-pointer"
              >
                {/* Tooltip Card on Hover */}
                {isHovered && (
                  <div className="absolute -top-16 z-30 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95">
                    <div className="font-bold">{pt.month}</div>
                    <div className="flex items-center gap-2 text-slate-300 text-[10px]">
                      <span>Received: {pt.formattedReceived}</span>
                      <span>·</span>
                      <span>Pending: {pt.formattedPending}</span>
                    </div>
                  </div>
                )}

                {/* The Stacked Bar */}
                <div className="w-10 sm:w-12 flex flex-col justify-end items-stretch rounded-t-lg overflow-hidden transition-all duration-200 group-hover:brightness-95">
                  {/* Top Part: Pending (Lavender) */}
                  {pendingHeightPct > 0 && (
                    <div
                      style={{ height: `${pendingHeightPct}%` }}
                      className="bg-[#c7d2fe] transition-all duration-300"
                      title={`Pending: ${pt.formattedPending}`}
                    />
                  )}
                  {/* Bottom Part: Received (Deep Purple) */}
                  <div
                    style={{ height: `${receivedHeightPct}%` }}
                    className="bg-[#4f46e5] transition-all duration-300"
                    title={`Received: ${pt.formattedReceived}`}
                  />
                </div>

                {/* X-Axis Label */}
                <span className="text-[11px] text-slate-500 font-medium mt-2 whitespace-nowrap">
                  {pt.shortMonth}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100 mt-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]" />
          <span>Received</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c7d2fe]" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}

