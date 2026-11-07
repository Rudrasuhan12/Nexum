"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  ChevronDown,
  Search,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
  Share2,
  FileText,
  Clock,
  AlertTriangle,
  Calendar,
  CreditCard,
  Home,
  FolderKanban,
  ShieldCheck,
  Check,
  Mic,
  Video,
  PhoneOff,
  Tv,
  X,
  ExternalLink,
} from "lucide-react";

export default function DualWorkspaceCanvas() {
  const [scrollProgress, setScrollProgress] = useState(0);

  // Smooth 60fps scroll listener
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          // Interpolates smoothly between 30px and 260px scroll distance
          const progress = Math.min(1, Math.max(0, (scrollY - 30) / 400));
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth GPU scale from 1.16 down to 1.00
  const centerScale = 1.16 - scrollProgress * 0.3;

  // Side cards slide in smoothly from the outer flanks
  const sideOpacity = scrollProgress;
  const leftTranslate = (1 - scrollProgress) * -50;
  const rightTranslate = (1 - scrollProgress) * 50;

  // --- INTERACTIVE STATE (Center Dashboard) ---
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    "milestones" | "overview" | "projects" | "escrow" | "audit"
  >("milestones");
  const [workflowFilter, setWorkflowFilter] = useState<
    "ALL" | "AWAITING_REVIEW" | "IN_PROGRESS" | "ACCEPTED" | "UPCOMING"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [m2Approved, setM2Approved] = useState(false);

  // --- INTERACTIVE STATE (Right Flank Card) ---
  const [rightTab, setRightTab] = useState<"meeting" | "transcript" | "consensus">("meeting");

  // Real Milestone data mirroring ClientMilestonesView (Kept strictly to M1, M2, M3 - Zero Scrollbar!)
  const allMilestones = useMemo(() => [
    {
      id: "M2",
      number: 2,
      name: "Storefront & Cart Pipeline",
      deliverable: "Visual Staging Proof & SSR Hooks",
      status: m2Approved ? "ACCEPTED" : "AWAITING_REVIEW",
      statusLabel: m2Approved ? "Accepted & Released" : "Awaiting Review",
      statusColor: m2Approved
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-amber-50 text-amber-800 border-amber-200 ring-2 ring-amber-100/60",
      paymentStatus: m2Approved ? "Captured & Released" : "Escrow Pre-Funded",
      paymentColor: m2Approved ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700",
      amount: "$1,600.00",
      freelancer: "Elena Rostova",
      role: "Lead Full-Stack Dev",
      dueDate: "Dec 14, 2026",
      hash: "sha256_#e3b0...c499",
      checks: "12/12 Automated Checks Passed",
    },
    {
      id: "M1",
      number: 1,
      name: "PostgreSQL & Auth0 Core",
      deliverable: "PR #14 Schema Migrations & RBAC",
      status: "ACCEPTED",
      statusLabel: "Accepted",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      paymentStatus: "Captured & Released",
      paymentColor: "bg-teal-50 text-teal-700",
      amount: "$1,200.00",
      freelancer: "Rohan Verma",
      role: "Database Architect",
      dueDate: "Nov 28, 2026",
      hash: "sha256_#7f8a...3b9e",
      checks: "All criteria satisfied",
    },
    {
      id: "M3",
      number: 3,
      name: "PayPal Orders v2 Escrow",
      deliverable: "Webhook Signature Listener & Rails",
      status: "IN_PROGRESS",
      statusLabel: "In Progress",
      statusColor: "bg-blue-50 text-blue-700 border-blue-200",
      paymentStatus: "Escrow Pre-Funded",
      paymentColor: "bg-indigo-50 text-indigo-700",
      amount: "$1,200.00",
      freelancer: "Elena Rostova",
      role: "Lead Full-Stack Dev",
      dueDate: "Jan 10, 2027",
      hash: "sha256_#8f2c...41a0",
      checks: "Sandbox harness passing",
    },
  ], [m2Approved]);

  // Telemetry counts
  const stats = useMemo(() => {
    const awaitingCount = m2Approved ? 0 : 1;
    const completedCount = m2Approved ? 2 : 1;
    return {
      upcomingCount: 1,
      awaitingCount,
      completedCount,
      overdueCount: 0,
    };
  }, [m2Approved]);

  // Filtered list
  const filteredMilestones = useMemo(() => {
    return allMilestones.filter((m) => {
      if (workflowFilter !== "ALL" && m.status !== workflowFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          m.name.toLowerCase().includes(q) ||
          m.deliverable.toLowerCase().includes(q) ||
          m.freelancer.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allMilestones, workflowFilter, searchQuery]);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-2 pt-0 pb-6">
      
      {/* 3-Column Stage */}
      <div className="flex items-center justify-center gap-6 2xl:gap-8 relative">
        
        {/* =========================================================
            LEFT FLANK: Top Copilot Chat + Bottom Autonomous Verifier
           ========================================================= */}
        <div
          className="hidden xl:flex flex-col justify-between w-64 shrink-0 h-[510px] py-1 transition-all duration-300 ease-out relative z-30"
          style={{
            opacity: sideOpacity,
            transform: `translateX(${leftTranslate}px)`,
            pointerEvents: scrollProgress > 0.35 ? "auto" : "none",
          }}
        >
          {/* Card 1: # shopkart-milestones */}
          <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-floating backdrop-blur-md translate-x-12">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
              <span className="ml-2 font-mono text-[10px] text-slate-400"># shopkart-milestones</span>
            </div>
            <div className="mt-2 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                  M
                </span>
                <div className="leading-tight">
                  <span className="font-semibold text-slate-800 text-[11px]">Marcus</span>
                  <span className="text-[10px] text-slate-400 ml-1">10:24</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <span className="text-cobalt font-medium">@Nexum</span> is Milestone 2 deliverable ready for escrow release?
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1.5 border-t border-slate-100">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                  N
                </span>
                <div className="leading-tight">
                  <span className="font-semibold text-slate-800 text-[11px]">Nexum AI</span>
                  <span className="rounded bg-emerald-50 px-1 py-0.2 text-[8px] font-mono text-emerald-700 font-semibold ml-1">VERIFIED</span>
                  <span className="text-[10px] text-slate-400 ml-1">10:24</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    M2 passed all 12 automated checks &amp; staging preview verified. Awaiting your 1-click cryptographic sign-off.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Autonomous Verifier Card */}
          <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-floating backdrop-blur-md font-mono text-[10px] translate-x-26 mt-auto mb-1 z-30">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FF5F56]" />
                <span className="h-2 w-2 rounded-full bg-[#FFBD2E]" />
                <span className="h-2 w-2 rounded-full bg-[#27C93F]" />
                <span className="ml-1.5 font-sans font-semibold text-[10.5px] text-slate-700">Autonomous Verifier</span>
              </div>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-700 border border-emerald-200">PASS</span>
            </div>

            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700 text-[11px] leading-snug font-sans">
              <span className="text-slate-400 font-mono mr-1">&gt;</span>
              Inspect staging deployment &amp; verify deliverable proof.
            </div>

            <div className="mt-2 space-y-1 text-slate-600 text-[9.5px]">
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Ran 3 automated checks</span>
              </div>
              <p className="pl-3 text-slate-600">✓ AST syntax tree validated (0 errors)</p>
              <p className="pl-3 text-slate-600">✓ 12 unit &amp; integration tests passing</p>
              <p className="pl-3 text-slate-600">✓ UI inspector captured visual proof</p>
            </div>

            <div className="mt-1.5 text-slate-700 text-[9.5px] leading-snug border-t border-slate-100 pt-1.5">
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>Session: demo@shopkart.com</span>
              </div>
              <p className="text-slate-500 pl-3 mt-0.5 truncate font-mono text-[8.5px]">
                Seal: sha256_#9b3e1f7a8c42...
              </p>
            </div>

            <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500 font-sans">
              <span className="text-cobalt font-bold">▶▶ auto</span>
              <span>Nexum 1.1</span>
            </div>
          </div>
        </div>

        {/* =========================================================
            CENTER COLUMN: Real Interactive Dashboard UI
           ========================================================= */}
        <div
          className="w-full max-w-[940px] shrink-0 rounded-2xl border border-slate-200/90 bg-white shadow-attio overflow-hidden transition-transform duration-500 ease-out relative z-10"
          style={{
            transform: `scale(${centerScale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Top Window Bar Chrome */}
          <div className="flex items-center justify-between border-b border-slate-200/80 bg-[#FAFAFA] px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#FF5F56] border border-black/10 inline-block" />
                <span className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-black/10 inline-block" />
                <span className="h-3 w-3 rounded-full bg-[#27C93F] border border-black/10 inline-block" />
              </div>
              <div className="h-3.5 w-[1px] bg-slate-200 mx-1" />
              
              <div className="flex items-center gap-2 rounded-md hover:bg-slate-200/60 px-2 py-1 cursor-pointer transition">
                <div className="h-4 w-4 rounded bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
                  N
                </div>
                <span className="font-heading text-xs font-bold text-slate-900">ShopKart Workspace</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center -space-x-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white ring-2 ring-white">Client</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white ring-2 ring-white">Dev</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[9px] font-semibold text-white ring-2 ring-white">AI</span>
              </div>
              <button className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-xs">
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50 transition">
                <Sparkles className="h-3 w-3 text-cobalt" />
                <span>Ask Nexum AI</span>
              </button>
            </div>
          </div>

          {/* Window Shell: Real Dashboard Sidebar + Real Dynamic View */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
            
            {/* Functional Sidebar */}
            <div className="hidden md:flex md:col-span-3 border-r border-slate-100 bg-[#FAF9F6]/70 p-3.5 flex-col justify-between text-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200/70 shadow-xs">
                  <span className="font-medium text-slate-700 flex items-center gap-1.5">
                    <Search className="h-3 w-3 text-slate-400" /> Quick Search
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">⌘K</span>
                </div>

                <div>
                  <span className="px-2 font-mono text-[9px] uppercase tracking-wider text-slate-400">Navigation</span>
                  <div className="mt-1.5 space-y-0.5 font-medium">
                    
                    {/* Sidebar Tab 1: Milestones */}
                    <button
                      type="button"
                      onClick={() => setActiveSidebarTab("milestones")}
                      className={`w-full flex items-center justify-between rounded-md px-2.5 py-1.5 transition text-left ${
                        activeSidebarTab === "milestones"
                          ? "bg-white text-slate-900 border border-slate-200/60 shadow-xs font-bold"
                          : "text-slate-600 hover:bg-white/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className={`h-3.5 w-3.5 ${activeSidebarTab === "milestones" ? "text-cobalt" : "text-slate-400"}`} /> Milestones
                      </span>
                      <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded-full ${
                        stats.awaitingCount > 0 ? "bg-amber-100 text-amber-800 font-bold" : "bg-slate-100 text-slate-500"
                      }`}>
                        {stats.awaitingCount > 0 ? "1 pending" : "3/3"}
                      </span>
                    </button>

                    {/* Sidebar Tab 2: Overview */}
                    <button
                      type="button"
                      onClick={() => setActiveSidebarTab("overview")}
                      className={`w-full flex items-center justify-between rounded-md px-2.5 py-1.5 transition text-left ${
                        activeSidebarTab === "overview"
                          ? "bg-white text-slate-900 border border-slate-200/60 shadow-xs font-bold"
                          : "text-slate-600 hover:bg-white/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Home className={`h-3.5 w-3.5 ${activeSidebarTab === "overview" ? "text-cobalt" : "text-slate-400"}`} /> Overview
                      </span>
                      <span className="rounded bg-slate-100 text-slate-500 px-1 font-mono text-[9px]">KPIs</span>
                    </button>

                    {/* Sidebar Tab 3: Projects */}
                    <button
                      type="button"
                      onClick={() => setActiveSidebarTab("projects")}
                      className={`w-full flex items-center justify-between rounded-md px-2.5 py-1.5 transition text-left ${
                        activeSidebarTab === "projects"
                          ? "bg-white text-slate-900 border border-slate-200/60 shadow-xs font-bold"
                          : "text-slate-600 hover:bg-white/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <FolderKanban className={`h-3.5 w-3.5 ${activeSidebarTab === "projects" ? "text-cobalt" : "text-slate-400"}`} /> My Projects
                      </span>
                      <span className="rounded bg-emerald-50 text-emerald-700 px-1 font-mono text-[9px]">Active</span>
                    </button>

                    {/* Sidebar Tab 4: PayPal Escrow */}
                    <button
                      type="button"
                      onClick={() => setActiveSidebarTab("escrow")}
                      className={`w-full flex items-center justify-between rounded-md px-2.5 py-1.5 transition text-left ${
                        activeSidebarTab === "escrow"
                          ? "bg-white text-slate-900 border border-slate-200/60 shadow-xs font-bold"
                          : "text-slate-600 hover:bg-white/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <CreditCard className={`h-3.5 w-3.5 ${activeSidebarTab === "escrow" ? "text-cobalt" : "text-slate-400"}`} /> PayPal Escrow
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </button>

                    {/* Sidebar Tab 5: Audit Ledger */}
                    <button
                      type="button"
                      onClick={() => setActiveSidebarTab("audit")}
                      className={`w-full flex items-center justify-between rounded-md px-2.5 py-1.5 transition text-left ${
                        activeSidebarTab === "audit"
                          ? "bg-white text-slate-900 border border-slate-200/60 shadow-xs font-bold"
                          : "text-slate-600 hover:bg-white/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className={`h-3.5 w-3.5 ${activeSidebarTab === "audit" ? "text-cobalt" : "text-slate-400"}`} /> Audit Ledger
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">SHA-256</span>
                    </button>

                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-2 border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Consensus Ratified</span>
                </div>
                <div className="font-mono text-[9px] text-slate-400 mt-0.5 truncate">
                  sha256: 7f8a...b9e4
                </div>
              </div>
            </div>

            {/* Main Interactive Content Area (Kept strictly to M3 - No Scrollbar) */}
            <div className="md:col-span-9 p-4 sm:p-5 flex flex-col justify-between bg-white overflow-hidden">
              
              {/* VIEW 1: REAL MILESTONES DASHBOARD */}
              {activeSidebarTab === "milestones" && (
                <div className="space-y-3.5">
                  
                  {/* Top Header Row with Export */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-heading text-xs font-bold text-slate-900">
                        Milestone Deliverables &amp; Escrow
                      </span>
                      <span className="text-slate-400 text-[10px]">ShopKart v1.2</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <button className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-[11px]">
                        <SlidersHorizontal className="h-3 w-3" /> Filters
                      </button>
                      <button className="flex items-center gap-1 rounded border border-slate-200 px-2 py-0.5 text-slate-700 hover:bg-slate-50 font-medium text-[11px]">
                        Export <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* 4 Interactive Dashboard Stats Cards */}
                  <div className="grid grid-cols-4 gap-2">
                    
                    {/* Card 1: Upcoming */}
                    <button
                      type="button"
                      onClick={() => setWorkflowFilter("UPCOMING")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        workflowFilter === "UPCOMING"
                          ? "border-purple-500 bg-purple-50/40 ring-1 ring-purple-200"
                          : "border-slate-200/90 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>Upcoming</span>
                        <Calendar className="h-3 w-3 text-slate-400" />
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{stats.upcomingCount}</div>
                    </button>

                    {/* Card 2: Awaiting Review (Pulsing amber alert) */}
                    <button
                      type="button"
                      onClick={() => setWorkflowFilter("AWAITING_REVIEW")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        stats.awaitingCount > 0
                          ? "border-amber-300 bg-gradient-to-br from-amber-50/80 to-white ring-1 ring-amber-200"
                          : "border-slate-200/90 bg-white hover:border-slate-300"
                      } ${workflowFilter === "AWAITING_REVIEW" ? "ring-2 ring-amber-400" : ""}`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                        <span className="flex items-center gap-1">
                          <span>Review</span>
                          {stats.awaitingCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />}
                        </span>
                        <Clock className="h-3 w-3 text-amber-600" />
                      </div>
                      <div className="text-base font-bold text-amber-900 mt-0.5">{stats.awaitingCount}</div>
                    </button>

                    {/* Card 3: Overdue */}
                    <button
                      type="button"
                      onClick={() => setWorkflowFilter("ALL")}
                      className="p-2.5 rounded-xl border border-slate-200/90 bg-white text-left hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>Overdue</span>
                        <AlertTriangle className="h-3 w-3 text-slate-400" />
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{stats.overdueCount}</div>
                    </button>

                    {/* Card 4: Accepted */}
                    <button
                      type="button"
                      onClick={() => setWorkflowFilter("ACCEPTED")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        workflowFilter === "ACCEPTED"
                          ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-200"
                          : "border-slate-200/90 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-700">
                        <span>Accepted</span>
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      </div>
                      <div className="text-base font-bold text-emerald-700 mt-0.5">{stats.completedCount}</div>
                    </button>

                  </div>

                  {/* Horizontal Filter Tabs + Live Search Box */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-medium no-scrollbar">
                      {[
                        { id: "ALL", label: "All" },
                        { id: "AWAITING_REVIEW", label: "Needs Review", count: stats.awaitingCount },
                        { id: "IN_PROGRESS", label: "In Progress" },
                        { id: "ACCEPTED", label: "Accepted", count: stats.completedCount },
                        { id: "UPCOMING", label: "Upcoming" },
                      ].map((tab) => {
                        const isActive = workflowFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setWorkflowFilter(tab.id as any)}
                            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition shrink-0 cursor-pointer ${
                              isActive
                                ? "bg-slate-900 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                              <span className={`ml-1 px-1 py-0.2 rounded-full text-[9px] ${
                                isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                              }`}>
                                {tab.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search deliverables..."
                        className="h-7 w-36 sm:w-44 pl-7 pr-6 rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-800 focus:outline-none focus:border-cobalt transition"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Real Dashboard Milestone Cards List */}
                  <div className="space-y-2 mt-2">
                    {filteredMilestones.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl border transition-all text-xs ${
                          m.status === "AWAITING_REVIEW"
                            ? "border-amber-300 bg-amber-50/20 shadow-xs"
                            : "border-slate-200/90 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {m.id}
                              </span>
                              <span className="font-heading font-bold text-slate-900 text-xs truncate">
                                {m.name}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${m.statusColor}`}>
                                {m.statusLabel}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${m.paymentColor}`}>
                                {m.paymentStatus}
                              </span>
                            </div>

                            <p className="text-slate-600 text-[11px] pl-6 font-sans">
                              {m.deliverable} • <span className="text-slate-400">{m.checks}</span>
                            </p>

                            <div className="flex items-center gap-3 pl-6 text-[10px] text-slate-400 pt-0.5">
                              <span>Dev: <strong className="text-slate-600">{m.freelancer}</strong></span>
                              <span>•</span>
                              <span>Due: {m.dueDate}</span>
                              <span>•</span>
                              <span className="font-mono">{m.hash}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 space-y-1">
                            <div className="font-mono font-bold text-slate-900 text-sm">
                              {m.amount}
                            </div>
                            
                            {/* Interactive Approve Button for Milestone 2 */}
                            {m.id === "M2" && !m2Approved && (
                              <button
                                type="button"
                                onClick={() => setM2Approved(true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs transition cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Release Escrow</span>
                              </button>
                            )}

                            {m.id === "M2" && m2Approved && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-emerald-700 bg-emerald-50 border border-emerald-200 text-[9px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Released</span>
                              </div>
                            )}

                            {m.id !== "M2" && m.status === "ACCEPTED" && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-slate-500 bg-slate-100 text-[9px]">
                                <span>Settled</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* VIEW 2: REAL PROJECT OVERVIEW */}
              {activeSidebarTab === "overview" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-heading text-xs font-bold text-slate-900">
                      Workspace Project Health &amp; Telemetry
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ● Active Sprint
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                      <span className="text-[10px] text-slate-500 font-medium">Pre-Funded Escrow</span>
                      <div className="text-lg font-black text-slate-900 font-mono mt-1">$4,000.00</div>
                      <p className="text-[9.5px] text-emerald-700 mt-0.5">PayPal Orders v2 Vault</p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                      <span className="text-[10px] text-slate-500 font-medium">Code Verification</span>
                      <div className="text-lg font-black text-slate-900 font-mono mt-1">100% PASS</div>
                      <p className="text-[9.5px] text-slate-500 mt-0.5">12 of 12 tests passed</p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                      <span className="text-[10px] text-slate-500 font-medium">Consensus Hash</span>
                      <div className="text-sm font-bold text-slate-900 font-mono mt-1.5 truncate">canonical_v1.2</div>
                      <p className="text-[9.5px] text-slate-500 mt-0.5">Dual SHA-256 seal</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <span className="font-bold text-slate-800 text-xs">Recent Bilateral Activity</span>
                    <div className="space-y-1.5 text-[11px] text-slate-600">
                      <p>• Elena Rostova deployed Staging Sandbox v1.2 with demo credentials.</p>
                      <p>• Autonomous Verifier captured visual proof and validated AST structure.</p>
                      <p>• Client Marcus Chen reviewed consensus PRD and approved Milestone 1.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: REAL MY PROJECTS */}
              {activeSidebarTab === "projects" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-heading text-xs font-bold text-slate-900">
                      Active Client Projects (3)
                    </span>
                    <button className="text-[10px] font-bold text-white bg-slate-900 px-2.5 py-1 rounded-md">
                      + New Project
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">ShopKart E-Commerce Payment Rails</span>
                        <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">4 Milestones • $4,000.00 Escrow • Dev: Elena Rostova</p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">Institutional Liquidity Provider</span>
                        <span className="text-blue-700 bg-blue-50 text-[10px] font-bold px-2 py-0.5 rounded-full">In Review</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">3 Milestones • $6,500.00 Escrow • Dev: Rohan Verma</p>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 4: REAL PAYPAL ESCROW */}
              {activeSidebarTab === "escrow" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-heading text-xs font-bold text-slate-900">
                      PayPal Orders v2 Bilateral Escrow Ledger
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Vault Secured
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Order ID:</span>
                      <span className="font-mono font-bold text-slate-900">6DE714998H998261C</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Total Pre-Funded:</span>
                      <span className="font-mono font-bold text-slate-900">$4,000.00 USD</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Released to Date:</span>
                      <span className="font-mono font-bold text-emerald-700">{m2Approved ? "$2,800.00 USD" : "$1,200.00 USD"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-1.5">
                      <span className="text-slate-500 font-semibold">Remaining in Vault:</span>
                      <span className="font-mono font-bold text-slate-900">{m2Approved ? "$1,200.00 USD" : "$2,800.00 USD"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 5: REAL AUDIT LEDGER */}
              {activeSidebarTab === "audit" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-heading text-xs font-bold text-slate-900">
                      Immutable SHA-256 Audit Trail
                    </span>
                    <span className="text-slate-400 font-mono text-[9px]">RFC 6962 Compliant</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[10px]">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-700">ACT_01: Milestone 1 Accepted</span>
                      <span className="text-slate-400">sha256_#7f8a...3b9e</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-700">ACT_02: PayPal Escrow Capture $1,200</span>
                      <span className="text-slate-400">sha256_#e3b0...c499</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-700">ACT_03: Staging Visual Proof Ratified</span>
                      <span className="text-slate-400">sha256_#9b3e...1f7a</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Input Bar */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-cobalt" />
                  <span className="font-sans text-[11px]">Ask Nexum AI anything...</span>
                </div>
                <span className="font-mono text-[9px]">Showing 3 active records</span>
              </div>

            </div>

          </div>

        </div>

        {/* =========================================================
            RIGHT FLANK: Fully Functional Meeting & Consensus Card
           ========================================================= */}
        <div
          className="hidden xl:flex flex-col w-72 shrink-0 transition-all duration-300 ease-out z-20"
          style={{
            opacity: sideOpacity,
            transform: `translateX(${rightTranslate}px)`,
            pointerEvents: scrollProgress > 0.35 ? "auto" : "none",
          }}
        >
          <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-floating backdrop-blur-md -translate-x-12">
            
            {/* Header */}
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
              <span className="ml-2 font-heading text-xs font-bold text-slate-800">
                Bilateral Review • ShopKart
              </span>
            </div>

            {/* Interactive Functional Tabs */}
            <div className="mt-2.5 flex items-center gap-3 border-b border-slate-100 pb-1.5 text-[10px] text-slate-500 font-medium">
              <button
                type="button"
                onClick={() => setRightTab("meeting")}
                className={`pb-1.5 -mb-1.5 transition font-semibold cursor-pointer ${
                  rightTab === "meeting"
                    ? "text-slate-900 border-b-2 border-slate-900 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Meeting
              </button>

              <button
                type="button"
                onClick={() => setRightTab("transcript")}
                className={`pb-1.5 -mb-1.5 transition font-semibold cursor-pointer ${
                  rightTab === "transcript"
                    ? "text-slate-900 border-b-2 border-slate-900 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                AI Transcript
              </button>

              <button
                type="button"
                onClick={() => setRightTab("consensus")}
                className={`pb-1.5 -mb-1.5 transition font-semibold cursor-pointer ${
                  rightTab === "consensus"
                    ? "text-slate-900 border-b-2 border-slate-900 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Consensus
              </button>
            </div>

            {/* TAB CONTENT 1: MEETING VIEW */}
            {rightTab === "meeting" && (
              <div className="mt-2.5 space-y-2">
                {/* Video Player */}
                <div className="relative h-36 w-full rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                  <div className="relative flex flex-col items-center">
                    <div className="h-14 w-14 rounded-full border-2 border-white/80 bg-slate-700 flex items-center justify-center text-white font-heading font-bold text-base shadow-md">
                      ER
                    </div>
                    <span className="text-[11px] text-white/90 font-medium mt-1">Elena Rostova (Lead Dev)</span>
                    <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Speaking
                    </span>
                  </div>

                  {/* Scrubber */}
                  <div className="absolute bottom-2 inset-x-3 flex items-center justify-between text-[9px] font-mono text-white/70">
                    <span>10:15</span>
                    <div className="mx-2 h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
                      <div className="h-full w-2/5 bg-cobalt rounded-full" />
                    </div>
                    <span>28:14</span>
                  </div>
                </div>

                {/* Meeting Controls & Participants */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-700">Room: nexum-shopkart</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono text-[9px]">3 in call</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-200/60">
                    <button className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs">
                      <Mic className="w-3 h-3" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs">
                      <Video className="w-3 h-3" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs">
                      <Tv className="w-3 h-3" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 shadow-2xs">
                      <PhoneOff className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: AI TRANSCRIPT VIEW */}
            {rightTab === "transcript" && (
              <div className="mt-2.5 space-y-2 text-[11px] leading-snug">
                <div>
                  <div className="flex items-center gap-1 font-semibold text-slate-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    <span>Elena (Lead Dev)</span>
                    <span className="text-[10px] text-slate-400 font-mono">1:09</span>
                  </div>
                  <p className="text-slate-600 pl-2.5 mt-0.5">
                    &quot;Pushed webhook signature verifier and deployed staging preview for Milestone 2.&quot;
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 font-semibold text-slate-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>Nexum Copilot</span>
                    <span className="text-[10px] text-slate-400 font-mono">1:15</span>
                  </div>
                  <p className="text-slate-600 pl-2.5 mt-0.5">
                    &quot;Automated checks passed 12/12. Visual proof captured. Escrow release queued.&quot;
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 font-semibold text-slate-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                    <span>Marcus (Client)</span>
                    <span className="text-[10px] text-slate-400 font-mono">1:28</span>
                  </div>
                  <p className="text-slate-600 pl-2.5 mt-0.5">
                    &quot;Staging proof looks crisp. Releasing $1,600 PayPal escrow now.&quot;
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: CONSENSUS VIEW */}
            {rightTab === "consensus" && (
              <div className="mt-2.5 space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dual SHA-256 Consensus Ratified</span>
                  </div>
                  <div className="text-[10px] text-emerald-900/80 font-mono truncate">
                    Seal: sha256_#9b3e1f7a8c42...
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Spec Version:</span>
                    <span className="font-mono font-bold text-slate-800">canonical_v1.2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Client Sign-off:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Marcus Chen
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Dev Sign-off:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Elena Rostova
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-[10.5px]">
                    <span className="text-slate-500">Escrow Action:</span>
                    <span className="font-bold text-slate-900">$1,600 Released</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}