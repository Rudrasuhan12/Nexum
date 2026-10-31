"use client";

import React from "react";
import {
  User,
  Flag,
  Bell,
  Clock,
  CreditCard,
  Sparkles,
  Link2,
  ShieldCheck,
  Palette,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { SettingsSectionKey } from "@/lib/freelancer-settings-types";

interface SettingsNavigationProps {
  activeSection: SettingsSectionKey;
  onSelectSection: (section: SettingsSectionKey) => void;
}

interface NavItemDef {
  key: SettingsSectionKey;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  isDestructive?: boolean;
}

const NAV_ITEMS: NavItemDef[] = [
  {
    key: "account",
    label: "Account & Security",
    subtitle: "Login, password, verification",
    icon: User,
  },
  {
    key: "saved_projects",
    label: "Saved Projects",
    subtitle: "Manage your saved opportunities",
    icon: Flag,
  },
  {
    key: "notifications",
    label: "Notifications",
    subtitle: "Email, in-app and other alerts",
    icon: Bell,
  },
  {
    key: "availability",
    label: "Availability & Preferences",
    subtitle: "Work preferences and project filters",
    icon: Clock,
  },
  {
    key: "payments",
    label: "Payment Settings",
    subtitle: "Payout methods and tax details",
    icon: CreditCard,
  },
  {
    key: "ai_preferences",
    label: "Nexum AI Preferences",
    subtitle: "Customize AI assistant experience",
    icon: Sparkles,
  },
  {
    key: "connected_accounts",
    label: "Connected Accounts",
    subtitle: "Link external accounts",
    icon: Link2,
  },
  {
    key: "privacy",
    label: "Privacy & Data",
    subtitle: "Data controls and visibility",
    icon: ShieldCheck,
  },
  {
    key: "appearance",
    label: "Appearance & Language",
    subtitle: "Theme, language and display",
    icon: Palette,
  },
  {
    key: "help",
    label: "Help & Support",
    subtitle: "Get help and contact support",
    icon: HelpCircle,
  },
  {
    key: "delete_account",
    label: "Delete Account",
    subtitle: "Permanently delete your account",
    icon: Trash2,
    isDestructive: true,
  },
];

export default function SettingsNavigation({
  activeSection,
  onSelectSection,
}: SettingsNavigationProps) {
  return (
    <nav className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1 select-none">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.key;

        if (item.isDestructive) {
          return (
            <div key={item.key} className="pt-2">
              <button
                type="button"
                onClick={() => onSelectSection(item.key)}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition text-left cursor-pointer ${
                  isActive
                    ? "bg-red-50 text-red-600 font-bold"
                    : "hover:bg-red-50/60 text-slate-700 hover:text-red-600"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-red-100/70 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-red-600 leading-tight">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
              </button>
            </div>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelectSection(item.key)}
            className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition text-left cursor-pointer relative ${
              isActive
                ? "bg-[#eef2ff] text-[#4f46e5]"
                : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#4f46e5] rounded-r-full" />
            )}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                isActive
                  ? "bg-[#4f46e5]/10 text-[#4f46e5]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <Icon className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={`text-xs leading-tight truncate ${
                  isActive ? "font-bold text-[#4f46e5]" : "font-semibold text-slate-800"
                }`}
              >
                {item.label}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {item.subtitle}
              </div>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

