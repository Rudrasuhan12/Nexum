"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck,
  CreditCard,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ClientOverviewHeaderProps {
  clientName: string;
  companyName: string;
  projectName: string;
  agreementHash: string;
  onFindFreelancer?: () => void;
  onCreateProject?: () => void;
  onViewMilestones?: () => void;
}

export default function ClientOverviewHeader({
  clientName,
  companyName,
  projectName,
  agreementHash,
  onFindFreelancer,
  onCreateProject,
  onViewMilestones,
}: ClientOverviewHeaderProps) {
  const { user } = useAuth();
  const [hiringStatus, setHiringStatus] = useState<"Actively hiring" | "Fully staffed" | "Reviewing proposals">("Actively hiring");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Client workspace readiness / project onboarding completeness
  const workspaceReadiness = 85;

  return (
    <div className="relative w-full rounded-[24px] sm:rounded-[28px] overflow-hidden bg-gradient-to-r from-[#4338ca] via-[#4f46e5] to-[#6366f1] text-white p-5 sm:p-7 shadow-[0_12px_32px_rgba(79,70,229,0.22)] border border-white/15 select-none">
      {/* Background ambient lighting and subtle decorative grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/10 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* ==============================================================
            LEFT: CLIENT AVATAR + GREETING + HIRING STATUS PILL
           ============================================================== */}
        <div className="flex items-center gap-4">
          {/* Avatar with White Ring & Glow */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 border-2 border-white/80 shadow-md ring-4 ring-white/20">
            <Image
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"}
              alt={clientName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-heading leading-tight flex items-center gap-2">
              <span>Welcome back, {clientName.split(" ")[0]}!</span>
            </h1>

            <p className="text-xs sm:text-[13px] text-white/85 font-normal leading-relaxed">
              Let&apos;s build and fund verified milestones today.
            </p>

            {/* Hiring Status Pill (Microsoft Teams / Banner Style) */}
            <div className="relative inline-block pt-0.5">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-[11px] font-semibold text-white transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{hiringStatus}</span>
                <ChevronDown className={`w-3 h-3 text-white/80 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Status Dropdown */}
              {isStatusDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-44 rounded-xl border border-white/20 bg-slate-900/95 backdrop-blur-xl p-1 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                  {(["Actively hiring", "Reviewing proposals", "Fully staffed"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setHiringStatus(st);
                        setIsStatusDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/15 transition flex items-center justify-between"
                    >
                      <span>{st}</span>
                      {hiringStatus === st && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==============================================================
            CENTER: CLIENT WORKSPACE READINESS CARD (85%)
           ============================================================== */}
        <div className="w-full lg:w-auto min-w-[240px] max-w-[290px] rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-3.5 space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="text-white/80 font-medium">Workspace Readiness</span>
            <span className="font-mono text-white text-[13px]">{workspaceReadiness}%</span>
          </div>

          {/* Progress Bar with vibrant emerald fill */}
          <div className="w-full h-2 rounded-full bg-black/25 overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-500 shadow-sm"
              style={{ width: `${workspaceReadiness}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <button
              type="button"
              onClick={onCreateProject}
              className="inline-flex items-center gap-1 font-semibold text-white/95 hover:text-white hover:underline cursor-pointer group"
            >
              <span>Post a New Project</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <span className="text-[10px] font-mono text-emerald-300 font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded">
              Ready
            </span>
          </div>
        </div>

        {/* ==============================================================
            RIGHT: CLIENT ACTION PILLS & WORKFLOW STEPPERS
           ============================================================== */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          {/* Action 1: Find Freelancers */}
          <button
            type="button"
            onClick={onFindFreelancer}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-98 backdrop-blur-md border border-white/25 text-white font-semibold text-xs transition shadow-xs cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </div>
            <span>Find Freelancers</span>
          </button>

          {/* Action 2: Review Milestones */}
          <button
            type="button"
            onClick={onViewMilestones}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-98 backdrop-blur-md border border-white/25 text-white font-semibold text-xs transition shadow-xs cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </div>
            <span>Milestones</span>
          </button>

          {/* Action 3: Post a New Project (Solid White Button) */}
          <button
            type="button"
            onClick={onCreateProject}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#4f46e5] font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Post a New Project</span>
          </button>
        </div>

      </div>
    </div>
  );
}
