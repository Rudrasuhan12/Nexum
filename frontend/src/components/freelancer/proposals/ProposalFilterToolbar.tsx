"use client";

import React from "react";
import { Search, ChevronDown, ArrowUpDown } from "lucide-react";
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

  return (
    <div className="space-y-3">
      {/* 1. Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
        {tabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectStatus(tab.id)}
              className={`pb-2.5 px-1 text-xs font-bold transition whitespace-nowrap border-b-2 -mb-[1px] cursor-pointer ${
                isActive
                  ? "border-[#4f46e5] text-[#4f46e5]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* 2. Filter Toolbar (Search + 4 Dropdowns + Sort) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        {/* Search */}
        <div className="sm:col-span-4 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search your proposals..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] shadow-2xs"
          />
        </div>

        {/* Project Type */}
        <div className="sm:col-span-2 relative">
          <select
            value={projectType}
            onChange={(e) => onProjectTypeChange(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 pl-2.5 pr-7 rounded-xl shadow-2xs outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 cursor-pointer"
          >
            <option value="ALL">Project Type</option>
            <option value="FIXED">Fixed Price</option>
            <option value="HOURLY">Hourly</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Budget */}
        <div className="sm:col-span-2 relative">
          <select
            value={budgetFilter}
            onChange={(e) => onBudgetFilterChange(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 pl-2.5 pr-7 rounded-xl shadow-2xs outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 cursor-pointer"
          >
            <option value="ALL">Budget</option>
            <option value="UNDER_50K">&lt; ₹50,000</option>
            <option value="50K_100K">₹50k – ₹100k</option>
            <option value="ABOVE_100K">&gt; ₹100,000</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Date */}
        <div className="sm:col-span-2 relative">
          <select
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 pl-2.5 pr-7 rounded-xl shadow-2xs outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 cursor-pointer"
          >
            <option value="ALL">Date</option>
            <option value="7_DAYS">Past 7 days</option>
            <option value="30_DAYS">Past 30 days</option>
            <option value="OLDER">Older</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="sm:col-span-2 relative">
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3 h-3 absolute left-2.5 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 pl-7 pr-6 rounded-xl shadow-2xs outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 cursor-pointer"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="BUDGET_HIGH">Budget: High to Low</option>
              <option value="BUDGET_LOW">Budget: Low to High</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 pointer-events-none text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

