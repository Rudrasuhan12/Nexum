"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, MessageSquare, ExternalLink } from "lucide-react";
import { DemoUser } from "@/lib/auth-types";
import FreelancerWorkspaceChatsMode from "./workspace/FreelancerWorkspaceChatsMode";
import FreelancerWorkspaceNexumAIMode from "./workspace/FreelancerWorkspaceNexumAIMode";
import HowMediationWorksModal from "@/components/client/workspace/HowMediationWorksModal";

interface FreelancerWorkspaceViewProps {
  freelancer?: DemoUser;
  client?: DemoUser;
  showToast?: (msg: string) => void;
}

export default function FreelancerWorkspaceView({
  showToast,
}: FreelancerWorkspaceViewProps) {
  void showToast;
  const [mode, setMode] = useState<"chats" | "ai">("chats");
  const [isMediationHelpOpen, setIsMediationHelpOpen] = useState(false);
  const [aiScope, setAiScope] = useState<string>("All my client contracts");

  return (
    <div className="space-y-4">
      {/* Top Bar with Mode Toggle & Dedicated Page Link */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Centered Mode Toggle Pills */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-2xs self-start sm:self-auto">
          {/* Nexum AI Mode Button */}
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === "ai"
                ? "bg-white text-[#4f46e5] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4f46e5]" />
            <span>Nexum AI Mode</span>
          </button>

          {/* Chats Mode Button */}
          <button
            type="button"
            onClick={() => setMode("chats")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === "chats"
                ? "bg-white text-[#4f46e5] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Client Chats Mode</span>
            <span className="w-4.5 h-4.5 rounded-full bg-[#ef4444] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs ml-0.5">
              2
            </span>
          </button>
        </div>

        {/* Link to Dedicated Fullscreen Page */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMediationHelpOpen(true)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            How Mediation Works
          </button>
          <span className="text-slate-300">•</span>
          <Link
            href="/freelancer/workspace"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#4f46e5] hover:underline"
          >
            <span>Open Dedicated Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="h-[750px] rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs flex">
        {mode === "chats" ? (
          <FreelancerWorkspaceChatsMode
            onSwitchToAIMode={(scope) => {
              if (scope) setAiScope(scope);
              setMode("ai");
            }}
            onOpenMediationHelp={() => setIsMediationHelpOpen(true)}
          />
        ) : (
          <FreelancerWorkspaceNexumAIMode
            onOpenInChats={() => setMode("chats")}
            initialScope={aiScope}
          />
        )}
      </div>

      {/* Mediation Help Modal */}
      <HowMediationWorksModal
        isOpen={isMediationHelpOpen}
        onClose={() => setIsMediationHelpOpen(false)}
      />
    </div>
  );
}
