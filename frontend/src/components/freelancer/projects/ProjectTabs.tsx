"use client";

import React from "react";
import {
  Layers,
  CheckSquare,
  FileText,
  MessageSquare,
  CreditCard,
  History,
  LayoutDashboard,
} from "lucide-react";

export type ProjectTabType =
  | "overview"
  | "milestones"
  | "tasks"
  | "files"
  | "messages"
  | "payments"
  | "activity";

interface ProjectTabsProps {
  activeTab: ProjectTabType;
  onTabChange: (tab: ProjectTabType) => void;
  milestonesCount?: number;
  tasksCount?: number;
  filesCount?: number;
}

export default function ProjectTabs({
  activeTab,
  onTabChange,
  milestonesCount = 0,
  tasksCount = 0,
  filesCount = 0,
}: ProjectTabsProps) {
  const tabs: { id: ProjectTabType; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "milestones", label: "Milestones", icon: Layers, count: milestonesCount },
    { id: "tasks", label: "Tasks", icon: CheckSquare, count: tasksCount },
    { id: "files", label: "Files", icon: FileText, count: filesCount },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "activity", label: "Activity", icon: History },
  ];

  return (
    <div className="border-b border-slate-200 bg-white px-2 sm:px-4 rounded-xl shadow-2xs">
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold transition border-b-2 -mb-[1px] whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-[#4f46e5] text-[#4f46e5]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-indigo-100 text-[#4f46e5]"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

