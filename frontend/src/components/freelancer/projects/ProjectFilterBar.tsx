"use client";

import React from "react";
import { Search, ChevronDown } from "lucide-react";
import { ProjectSummaryKPIs } from "@/lib/freelancer-projects-types";

interface ProjectFilterBarProps {
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  kpis: ProjectSummaryKPIs;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export default function ProjectFilterBar({
  selectedStatus,
  onSelectStatus,
  kpis,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: ProjectFilterBarProps) {
  const tabs = [
    { id: "ALL", label: "All Projects", count: kpis.totalProjects },
    { id: "ACTIVE", label: "Active", count: kpis.activeProjects },
    { id: "AWAITING_APPROVAL", label: "Awaiting Approval", count: kpis.awaitingApproval },
    { id: "COMPLETED", label: "Completed", count: kpis.completedProjects },
    { id: "CANCELLED", label: "Cancelled", count: kpis.cancelledProjects },
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

      {/* 2. Search & Sort Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects or clients..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] shadow-2xs"
          />
        </div>

        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none bg-white border border-slate-200 text-xs font-semibold text-slate-700 py-2 pl-3 pr-8 rounded-xl shadow-2xs outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer"
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="DEADLINE">Due Date</option>
            <option value="PROGRESS">Progress</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

