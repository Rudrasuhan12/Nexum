"use client";

import React from "react";
import { Search, ChevronDown, ArrowUpDown, X, RotateCcw } from "lucide-react";
import { ProposalSummaryKPIs } from "@/lib/freelancer-proposals-types";

interface ProposalFilterToolbarProps {
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  kpis: ProposalSummaryKPIs;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  projectType: string;
  onProjectTypeChange: (type: string) => void;
  budgetFilter: string;
  onBudgetFilterChange: (b: string) => void;
  dateFilter: string;
  onDateFilterChange: (d: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export default function ProposalFilterToolbar({
  selectedStatus,
  onSelectStatus,
  kpis,
  searchQuery,
  onSearchChange,
  projectType,
  onProjectTypeChange,
  budgetFilter,
  onBudgetFilterChange,
  dateFilter,
  onDateFilterChange,
  sortBy,
  onSortChange,
}: ProposalFilterToolbarProps) {
  const tabs = [
    { id: "ALL", label: "All Proposals", count: kpis.totalProposals },
    { id: "UNDER_REVIEW", label: "Under Review", count: kpis.underReview },
    { id: "SHORTLISTED", label: "Shortlisted", count: kpis.shortlisted },
    { id: "INTERVIEW", label: "Interview", count: kpis.interview },
    { id: "ACCEPTED", label: "Accepted", count: kpis.accepted },
    { id: "REJECTED", label: "Rejected", count: kpis.rejected },
  ];

  const hasActiveFilters =
    projectType !== "ALL" ||
    budgetFilter !== "ALL" ||
    dateFilter !== "ALL" ||
    sortBy !== "NEWEST";

  const handleResetFilters = () => {
    onProjectTypeChange("ALL");
    onBudgetFilterChange("ALL");
    onDateFilterChange("ALL");
    onSortChange("NEWEST");
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Status Filter Strip with Clean Active Underline */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/80">
        {tabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectStatus(tab.id)}
              className={`pb-2.5 px-2 text-xs font-bold transition whitespace-nowrap border-b-2 -mb-[1px] cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Search Bar - Full Width, Prominent & Clean */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by project title, client, or tech..."
          className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200/90 bg-white text-xs text-slate-900 placeholder:text-slate-400 outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Filter Controls - Clean 2-Column Responsive Grid (No Cramping/Truncation) */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Project Type */}
          <div className="relative">
            <select
              value={projectType}
              onChange={(e) => onProjectTypeChange(e.target.value)}
              className={`w-full appearance-none bg-white border text-xs font-semibold py-2 pl-3 pr-8 rounded-xl shadow-2xs outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition ${
                projectType !== "ALL"
                  ? "border-indigo-400 text-indigo-700 bg-indigo-50/20 font-bold"
                  : "border-slate-200/90 text-slate-700 hover:border-slate-300"
              }`}
            >
              <option value="ALL">Project Type: All</option>
              <option value="FIXED">Fixed Price</option>
              <option value="HOURLY">Hourly Rate</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Budget */}
          <div className="relative">
            <select
              value={budgetFilter}
              onChange={(e) => onBudgetFilterChange(e.target.value)}
              className={`w-full appearance-none bg-white border text-xs font-semibold py-2 pl-3 pr-8 rounded-xl shadow-2xs outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition ${
                budgetFilter !== "ALL"
                  ? "border-indigo-400 text-indigo-700 bg-indigo-50/20 font-bold"
                  : "border-slate-200/90 text-slate-700 hover:border-slate-300"
              }`}
            >
              <option value="ALL">Budget: All</option>
              <option value="UNDER_50K">&lt; ₹50,000</option>
              <option value="50K_100K">₹50k – ₹100k</option>
              <option value="ABOVE_100K">&gt; ₹100,000</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Date */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className={`w-full appearance-none bg-white border text-xs font-semibold py-2 pl-3 pr-8 rounded-xl shadow-2xs outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition ${
                dateFilter !== "ALL"
                  ? "border-indigo-400 text-indigo-700 bg-indigo-50/20 font-bold"
                  : "border-slate-200/90 text-slate-700 hover:border-slate-300"
              }`}
            >
              <option value="ALL">Date: All</option>
              <option value="7_DAYS">Past 7 days</option>
              <option value="30_DAYS">Past 30 days</option>
              <option value="OLDER">Older</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className={`w-full appearance-none bg-white border text-xs font-semibold py-2 pl-3 pr-8 rounded-xl shadow-2xs outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition ${
                sortBy !== "NEWEST"
                  ? "border-indigo-400 text-indigo-700 bg-indigo-50/20 font-bold"
                  : "border-slate-200/90 text-slate-700 hover:border-slate-300"
              }`}
            >
              <option value="NEWEST">Sort: Newest</option>
              <option value="OLDEST">Sort: Oldest</option>
              <option value="BUDGET_HIGH">Budget: High to Low</option>
              <option value="BUDGET_LOW">Budget: Low to High</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Quick Reset Filter Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            <span className="font-medium">Filters applied</span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset all filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
