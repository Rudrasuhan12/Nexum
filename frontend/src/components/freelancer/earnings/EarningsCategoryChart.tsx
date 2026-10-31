"use client";

import React, { useState, useMemo } from "react";
import { ProjectCategoryShare } from "@/lib/freelancer-earnings-types";

interface EarningsCategoryChartProps {
  categories: ProjectCategoryShare[];
  totalFormatted: string;
}

export default function EarningsCategoryChart({
  categories,
  totalFormatted,
}: EarningsCategoryChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // SVG circular dimensions
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Pure functional calculation of stroke offsets with zero mutation
  const categorySlices = useMemo(() => {
    return categories.map((cat, index) => {
      const priorPercentage = categories
        .slice(0, index)
        .reduce((sum, item) => sum + item.percentage, 0);
      const strokeLength = (cat.percentage / 100) * circumference;
      const offset = -((priorPercentage / 100) * circumference);
      return {
        ...cat,
        strokeLength,
        offset,
      };
    });
  }, [categories, circumference]);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between h-full">
      <div className="mb-4 pb-2 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Earnings by Project Category
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
        {/* Doughnut SVG Container */}
        <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Background Base Ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Slices */}
            {categorySlices.map((cat) => {
              const isHovered = hoveredCategory === cat.name;

              return (
                <circle
                  key={cat.name}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={cat.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={`${cat.strokeLength} ${circumference}`}
                  strokeDashoffset={cat.offset}
                  fill="transparent"
                  strokeLinecap="butt"
                  onMouseEnter={() => setHoveredCategory(cat.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className="transition-all duration-200 cursor-pointer"
                />
              );
            })}
          </svg>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-base font-extrabold text-slate-900 leading-tight">
              {totalFormatted}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Total Earnings
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-2">
          {categories.map((cat) => {
            const isHovered = hoveredCategory === cat.name;
            return (
              <div
                key={cat.name}
                onMouseEnter={() => setHoveredCategory(cat.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-all cursor-pointer ${
                  isHovered ? "bg-slate-50 font-bold" : "text-slate-600"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className="font-semibold text-slate-900 ml-2">
                  {cat.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 text-right">
        <span className="text-[11px] text-slate-400 font-medium">
          Based on 8 finalized agreement versions
        </span>
      </div>
    </div>
  );
}
