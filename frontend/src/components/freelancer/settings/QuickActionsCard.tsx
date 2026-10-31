"use client";

import React from "react";
import { Download, Link2, Bell, Clock, ChevronRight } from "lucide-react";
import { SettingsSectionKey } from "@/lib/freelancer-settings-types";

interface QuickActionsCardProps {
  onNavigateSection: (section: SettingsSectionKey) => void;
  onDownloadData: () => void;
}

export default function QuickActionsCard({
  onNavigateSection,
  onDownloadData,
}: QuickActionsCardProps) {
  const actions = [
    {
      id: "download",
      title: "Download My Data",
      subtitle: "Export your Nexum data",
      icon: Download,
      iconBg: "bg-purple-50 text-[#4f46e5]",
      onClick: onDownloadData,
    },
    {
      id: "connected",
      title: "Manage Connected Accounts",
      subtitle: "View and revoke access",
      icon: Link2,
      iconBg: "bg-indigo-50 text-indigo-600",
      onClick: () => onNavigateSection("connected_accounts"),
    },
    {
      id: "notifications",
      title: "Update Notification Preferences",
      subtitle: "Choose what you want to be notified about",
      icon: Bell,
      iconBg: "bg-amber-50 text-amber-600",
      onClick: () => onNavigateSection("notifications"),
    },
    {
      id: "availability",
      title: "Set Availability Preferences",
      subtitle: "Manage your working hours",
      icon: Clock,
      iconBg: "bg-purple-50 text-purple-600",
      onClick: () => onNavigateSection("availability"),
    },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
        Quick Actions
      </h3>

      <div className="space-y-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <div
              key={act.id}
              onClick={act.onClick}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200/80 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${act.iconBg}`}
                >
                  <Icon className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-[#4f46e5] transition leading-tight truncate">
                    {act.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {act.subtitle}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition shrink-0 ml-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

