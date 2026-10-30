"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ChevronRight,
  Eye,
  Star,
  Send,
  Activity,
  DollarSign,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import ClientOverviewHeader from "./ClientOverviewHeader";
import { useAuth } from "@/context/AuthContext";

interface ClientOverviewProps {
  onNavigateTab: (tab: string) => void;
  onReviewMilestone?: () => void;
  onApproveAgreement?: () => void;
}

export default function ClientOverview({
  onNavigateTab,
  onReviewMilestone,
  onApproveAgreement,
}: ClientOverviewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const clientName = user?.name || "Sambit Kumar";

  // --- 1. Top 6 Summary KPI Cards Data ---
  const summaryCards = [
    {
      id: "active_projects",
      title: "Active Projects",
      value: "3",
      trend: "2 on schedule",
      trendPositive: true,
      icon: FolderKanban,
      bgIcon: "bg-[#eef2ff] text-[#4f46e5]",
      tab: "projects",
    },
    {
      id: "pending_approvals",
      title: "Pending Approvals",
      value: "2",
      trend: "Needs your review",
      trendPositive: false,
      icon: Clock,
      bgIcon: "bg-amber-50 text-amber-600",
      tab: "milestones",
    },
    {
      id: "funded_escrow",
      title: "Funds in Escrow",
      value: "$2,700",
      trend: "PayPal Orders v2 backed",
      trendPositive: true,
      icon: CreditCard,
      bgIcon: "bg-emerald-50 text-emerald-600",
      tab: "payments",
    },
    {
      id: "milestones_done",
      title: "Milestones Done",
      value: "5 / 8",
      trend: "62% total progress",
      trendPositive: true,
      icon: Layers,
      bgIcon: "bg-indigo-50 text-indigo-600",
      tab: "milestones",
    },
    {
      id: "active_talent",
      title: "Active Talent",
      value: "4",
      trend: "Verified freelancers",
      trendPositive: true,
      icon: Briefcase,
      bgIcon: "bg-sky-50 text-sky-600",
      tab: "freelancers",
    },
    {
      id: "consensus_health",
      title: "Consensus Status",
      value: "100%",
      trend: "Dual SHA-256 locked",
      trendPositive: true,
      icon: ShieldCheck,
      bgIcon: "bg-purple-50 text-purple-600",
      tab: "workspace",
    },
  ];

  // --- 2. Needs Your Attention Data (Critical Approvals) ---
  const attentionItems = [
    {
      id: "att_1",
      title: "Milestone 2 Deliverable Review",
      project: "Bilateral E-Commerce Payment Rails",
      freelancer: "Rohan Verma",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
      type: "DELIVERABLE_SUBMISSION",
      amount: "$1,500.00",
      dueNotice: "Submitted 2h ago · PayPal funds locked in escrow",
      actionText: "Review & Release Funds",
      actionType: "PRIMARY",
    },
    {
      id: "att_2",
      title: "Scope Revision Proposal (PRD #3)",
      project: "CloudMesh AI Gateway Unification",
      freelancer: "Elena Rostova",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80",
      type: "SCOPE_DELTA",
      amount: "+$400.00 delta",
      dueNotice: "Awaiting client agreement sign-off",
      actionText: "Review Scope Change",
      actionType: "SECONDARY",
    },
  ];

  // --- 3. Project Overview Data (Status of Most Relevant Projects) ---
  const activeProjects = [
    {
      id: "proj_1",
      name: "Bilateral E-Commerce Payment Rails",
      stage: "Milestone 2 of 4",
      status: "IN_PROGRESS",
      freelancer: "Rohan Verma",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
      progress: 65,
      budget: "$4,500.00",
      nextDeadline: "Nov 04, 2026",
    },
    {
      id: "proj_2",
      name: "CloudMesh AI Gateway Unification",
      stage: "Milestone 1 of 3",
      status: "IN_REVIEW",
      freelancer: "Elena Rostova",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80",
      progress: 40,
      budget: "$3,200.00",
      nextDeadline: "Nov 08, 2026",
    },
    {
      id: "proj_3",
      name: "Autonomous PRD Generation & Spec Engine",
      stage: "Drafting / Scope Intake",
      status: "PROPOSAL",
      freelancer: "Marcus Chen",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80",
      progress: 15,
      budget: "$2,800.00",
      nextDeadline: "Nov 14, 2026",
    },
  ];

  // --- 4. Upcoming Milestones Data ---
  const upcomingMilestones = [
    {
      id: "ms_1",
      title: "M2: PayPal REST v2 Webhook Ingestion Engine",
      project: "Bilateral E-Commerce Payment Rails",
      freelancer: "Rohan Verma",
      dueDate: "Submitted (Under Review)",
      amount: "$1,500.00",
      state: "SUBMITTED",
      stateColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "ms_2",
      title: "M1: AI Gateway Multi-tenant Tenant Isolation",
      project: "CloudMesh AI Gateway Unification",
      freelancer: "Elena Rostova",
      dueDate: "Due in 3 days · Nov 2",
      amount: "$1,200.00",
      state: "IN_PROGRESS",
      stateColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "ms_3",
      title: "M3: Dual SHA-256 Consensus State Machine",
      project: "Bilateral E-Commerce Payment Rails",
      freelancer: "Rohan Verma",
      dueDate: "Unlocks after M2 release",
      amount: "$1,000.00",
      state: "QUEUED",
      stateColor: "bg-slate-100 text-slate-600 border-slate-200",
    },
  ];

  // --- 5. Recommended Freelancers Data ---
  const recommendedFreelancers = [
    {
      id: "fr_1",
      name: "Marcus Chen",
      role: "Cloud Reliability & DevOps Engineer",
      skills: ["Kubernetes", "AWS", "CI/CD", "Terraform"],
      rate: "$75/hr",
      rating: "5.0 (28 jobs)",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80",
      availability: "Available now",
    },
    {
      id: "fr_2",
      name: "Priya Sharma",
      role: "UI/UX & Design Systems Architect",
      skills: ["Figma", "Design Systems", "Next.js", "Tailwind"],
      rate: "$55/hr",
      rating: "4.9 (34 jobs)",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80",
      availability: "10 hrs/week",
    },
    {
      id: "fr_3",
      name: "David K.",
      role: "Solidity & Smart Contract Auditor",
      skills: ["Solidity", "Rust", "Web3.js", "Security"],
      rate: "$90/hr",
      rating: "5.0 (19 jobs)",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&q=80",
      availability: "Available now",
    },
  ];

  // --- 6. Recent Activity & Audit Logs ---
  const recentActivities = [
    {
      id: "act_1",
      type: "SUBMISSION",
      title: "Milestone 2 deliverable package submitted",
      detail: "Rohan Verma uploaded code diff & test receipts for PayPal Webhooks",
      time: "2 hours ago",
      icon: Layers,
      color: "text-amber-500 bg-amber-50",
    },
    {
      id: "act_2",
      type: "PAYMENT",
      title: "PayPal Escrow pre-funding verified",
      detail: "Order #6DE714998H998261C captured into Sandbox escrow ($1,500.00)",
      time: "Yesterday, 4:15 PM",
      icon: CreditCard,
      color: "text-emerald-500 bg-emerald-50",
    },
    {
      id: "act_3",
      type: "AGREEMENT",
      title: "Dual approval cryptographic lock achieved",
      detail: "Both parties signed canonical spec hash #9f8c2b7e",
      time: "Oct 28, 11:30 AM",
      icon: ShieldCheck,
      color: "text-[#4f46e5] bg-[#eef2ff]",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* ==============================================================
          HERO BANNER: WELCOME, STATUS & WORKSPACE READINESS
         ============================================================== */}
      <ClientOverviewHeader
        clientName={clientName}
        companyName={user?.companyOrHandle || "Horizon Commerce LLC"}
        projectName="Bilateral E-Commerce Payment Rails"
        agreementHash="canonical_v1.2_#9f8c2b7e"
        onFindFreelancer={() => onNavigateTab("freelancers")}
        onCreateProject={() => router.push("/client/post-project")}
        onViewMilestones={() => onNavigateTab("milestones")}
      />

      {/* ==============================================================
          SECTION 1: 6 SUMMARY KPI CARDS (INSTANT UNDERSTANDING)
         ============================================================== */}
      <section aria-labelledby="section-summary-cards">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 id="section-summary-cards" className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Workspace Overview</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f46e5]" />
          </h2>
          <span className="text-[11px] font-mono text-slate-400">Live Telemetry</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigateTab(card.tab)}
                className="group p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#4f46e5]/40 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
                    {card.title}
                  </span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${card.bgIcon}`}>
                    <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                </div>

                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                    {card.value}
                  </div>
                  <div
                    className={`text-[11px] font-medium mt-1 truncate ${
                      card.trendPositive ? "text-slate-500" : "text-amber-600 font-semibold"
                    }`}
                  >
                    {card.trend}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==============================================================
          SECTION 2: NEEDS YOUR ATTENTION (APPROVALS & DECISIONS)
         ============================================================== */}
      <section aria-labelledby="section-attention">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center gap-2">
            <h2 id="section-attention" className="text-sm font-bold text-slate-900 tracking-tight">
              Needs Your Attention
            </h2>
            <span className="w-5 h-5 rounded-full bg-[#ef4444] text-white text-[10px] font-extrabold flex items-center justify-center">
              {attentionItems.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">Action required to unblock work</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {attentionItems.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                    <Image
                      src={item.avatar}
                      alt={item.freelancer}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {item.project} · <strong className="text-slate-700 font-semibold">{item.freelancer}</strong>
                    </p>
                  </div>
                </div>

                <span className="font-mono text-xs font-black text-slate-900 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg shrink-0">
                  {item.amount}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-500 truncate mr-2">
                  {item.dueNotice}
                </span>

                <button
                  type="button"
                  onClick={item.actionType === "PRIMARY" ? onReviewMilestone : onApproveAgreement}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    item.actionType === "PRIMARY"
                      ? "bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-xs"
                      : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                  }`}
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==============================================================
          SECTION 3: PROJECT OVERVIEW (STAGE & STATUS TRACKER)
         ============================================================== */}
      <section aria-labelledby="section-projects">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 id="section-projects" className="text-sm font-bold text-slate-900 tracking-tight">
            Active Project Overview
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab("projects")}
            className="text-xs font-semibold text-[#4f46e5] hover:underline flex items-center gap-1"
          >
            <span>View all projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs divide-y divide-slate-100">
          {activeProjects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => router.push(`/client/projects/${proj.id}`)}
              className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition cursor-pointer group"
            >
              <div className="flex items-start gap-3.5 min-w-0 md:w-5/12">
                <div className="w-9 h-9 rounded-xl bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-[#4f46e5] transition-colors">
                    {proj.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{proj.stage}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Image
                        src={proj.avatar}
                        alt={proj.freelancer}
                        width={16}
                        height={16}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span>{proj.freelancer}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="md:w-3/12 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Completion</span>
                  <span className="font-mono font-bold text-slate-800">{proj.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4f46e5] transition-all duration-300"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>

              {/* Budget & Due Date */}
              <div className="flex items-center justify-between md:justify-end gap-5 md:w-4/12 text-right">
                <div>
                  <div className="font-mono text-xs font-black text-slate-900">{proj.budget}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Due {proj.nextDeadline}</div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#4f46e5] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==============================================================
          GRID: SECTION 4 (UPCOMING MILESTONES) & SECTION 5 (RECOMMENDED TALENT)
         ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION 4: UPCOMING MILESTONES (7 COLS) */}
        <section className="lg:col-span-7 space-y-3" aria-labelledby="section-milestones">
          <div className="flex items-center justify-between px-0.5">
            <h2 id="section-milestones" className="text-sm font-bold text-slate-900 tracking-tight">
              Upcoming Milestones
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab("milestones")}
              className="text-xs font-semibold text-[#4f46e5] hover:underline"
            >
              Milestone Schedule &rarr;
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs divide-y divide-slate-100">
            {upcomingMilestones.map((ms) => (
              <div
                key={ms.id}
                onClick={() => onNavigateTab("milestones")}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition cursor-pointer"
              >
                <div className="min-w-0 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {ms.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {ms.project} · {ms.freelancer}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-xs font-bold text-slate-900">{ms.amount}</div>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border ${ms.stateColor}`}>
                    {ms.dueDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: RECOMMENDED FREELANCERS (5 COLS) */}
        <section className="lg:col-span-5 space-y-3" aria-labelledby="section-freelancers">
          <div className="flex items-center justify-between px-0.5">
            <h2 id="section-freelancers" className="text-sm font-bold text-slate-900 tracking-tight">
              Recommended Talent
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab("freelancers")}
              className="text-xs font-semibold text-[#4f46e5] hover:underline"
            >
              Browse all &rarr;
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
            {recommendedFreelancers.map((fr) => (
              <div
                key={fr.id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-200">
                    <Image
                      src={fr.avatar}
                      alt={fr.name}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{fr.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{fr.role}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] text-slate-600 font-semibold">{fr.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-slate-900">{fr.rate}</div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("freelancers")}
                    className="mt-1 px-2.5 py-1 rounded-lg bg-[#eef2ff] hover:bg-[#e0e7ff] text-[#4f46e5] font-bold text-[10.5px] transition cursor-pointer"
                  >
                    Invite
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* ==============================================================
          SECTION 6: RECENT ACTIVITY & AUDIT TIMELINE
         ============================================================== */}
      <section aria-labelledby="section-activity">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#4f46e5]" />
            <h2 id="section-activity" className="text-sm font-bold text-slate-900 tracking-tight">
              Recent Activity & Ledger Proof
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Immutable audit timeline</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs divide-y divide-slate-100">
          {recentActivities.map((act) => {
            const Icon = act.icon;
            return (
              <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${act.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900">{act.title}</p>
                    <span className="text-[11px] text-slate-400 shrink-0 font-mono">{act.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{act.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

