"use client";

import React, { useEffect, useState } from "react";
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

  // Attio's exact inward motion: smooth GPU scale from 1.06 down to 1.00
  const centerScale = 1.16 - scrollProgress * 0.3;

  // Side cards slide in smoothly from the outer flanks
  const sideOpacity = scrollProgress;
  const leftTranslate = (1 - scrollProgress) * -50;
  const rightTranslate = (1 - scrollProgress) * 50;

  // 5 Clean columns matching Attio's density (No horizontal scrollbar!)
  const milestones = [
    {
      id: "M1",
      name: "PostgreSQL & Auth0 Core",
      deliverable: "PR #14 Schema Migrations",
      state: "Accepted",
      stateColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      amount: "$1,200.00",
      amountColor: "bg-teal-50 text-teal-700",
      hash: "7f8a...3b9e",
    },
    {
      id: "M2",
      name: "Storefront & Cart Pipeline",
      deliverable: "Catalog SSR + Cart Hook",
      state: "In Progress",
      stateColor: "bg-blue-50 text-blue-700 border-blue-200",
      amount: "$1,600.00",
      amountColor: "bg-blue-50 text-blue-700",
      hash: "e3b0...c499",
    },
    {
      id: "M3",
      name: "PayPal Orders v2 Capture",
      deliverable: "Webhook Signature Listener",
      state: "Queued",
      stateColor: "bg-slate-100 text-slate-600 border-slate-200",
      amount: "$1,200.00",
      amountColor: "bg-slate-100 text-slate-700",
      hash: "8f2c...41a0",
    },
    {
      id: "M4",
      name: "Multi-Currency Engine",
      deliverable: "Section 14 Follow-on Fork",
      state: "Proposed",
      stateColor: "bg-purple-50 text-purple-700 border-purple-200",
      amount: "+$800.00",
      amountColor: "bg-purple-50 text-purple-700",
      hash: "9ca2...7d11",
    },
    {
      id: "M5",
      name: "Reconciliation Daemon",
      deliverable: "Idempotent Retry Guard",
      state: "Ready",
      stateColor: "bg-amber-50 text-amber-700 border-amber-200",
      amount: "$600.00",
      amountColor: "bg-amber-50 text-amber-700",
      hash: "f120...66b2",
    },
    {
      id: "M6",
      name: "OECD Transparency Report",
      deliverable: "Audit Ledger Export JSON",
      state: "Accepted",
      stateColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      amount: "$400.00",
      amountColor: "bg-teal-50 text-teal-700",
      hash: "a87b...019e",
    },
    {
      id: "M7",
      name: "Automated Dispute Hold",
      deliverable: "Freeze Progression Trigger",
      state: "In Progress",
      stateColor: "bg-blue-50 text-blue-700 border-blue-200",
      amount: "$500.00",
      amountColor: "bg-blue-50 text-blue-700",
      hash: "34cc...89aa",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] px-2 pt-0 pb-6">
      
      {/* 3-Column Stage */}
      <div className="flex items-center justify-center gap-6 2xl:gap-8 relative">
        
        {/* =========================================================
            LEFT FLANK: Top Card + Bottom Dark Terminal
           ========================================================= */}
        <div
          className="hidden xl:flex flex-col justify-between w-64 shrink-0 h-[510px] py-1 transition-all duration-300 ease-out relative z-30"
          style={{
            opacity: sideOpacity,
            transform: `translateX(${leftTranslate}px)`,
            pointerEvents: scrollProgress > 0.35 ? "auto" : "none",
          }}
        >
          {/* Card 1: # pipeline */}
          <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-floating backdrop-blur-md translate-x-12">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
              <span className="ml-2 font-mono text-[10px] text-slate-400"># pipeline</span>
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
                    <span className="text-cobalt font-medium">@Attio</span> what deals should I focus on today?
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1.5 border-t border-slate-100">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-white">
                  A
                </span>
                <div className="leading-tight">
                  <span className="font-semibold text-slate-800 text-[11px]">Attio</span>
                  <span className="rounded bg-slate-100 px-1 py-0.2 text-[8px] font-mono text-slate-500 ml-1">APP</span>
                  <span className="text-[10px] text-slate-400 ml-1">10:24</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    GreenLeaf (verbal yes, no quote out) and Ramp (stalled in Legal 5d).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Dark Terminal (Shifted on top of the sidebar) */}
          <div className="flex flex-col rounded-2xl border border-slate-800/90 bg-[#0C1017] p-3 shadow-terminal backdrop-blur-md font-mono text-[10px] translate-x-26 mt-auto mb-1 z-30">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <span className="h-2 w-2 rounded-full bg-[#FF5F56]" />
              <span className="h-2 w-2 rounded-full bg-[#FFBD2E]" />
              <span className="h-2 w-2 rounded-full bg-[#27C93F]" />
            </div>

            <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-200 text-[11px] leading-snug font-sans">
              <span className="text-slate-400 font-mono mr-1">&gt;</span>
              Find yesterday&apos;s demo call and create the right follow-up task.
            </div>

            <div className="mt-2 space-y-0.5 text-slate-400 text-[9.5px]">
              <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>Ran 3 commands</span>
              </div>
              <p className="pl-3 text-slate-400">└ search-call-recordings-by-metadata</p>
              <p className="pl-3 text-slate-400">└ get-call-recording</p>
              <p className="pl-3 text-slate-400">└ create-task</p>
            </div>

            <div className="mt-1.5 text-slate-300 text-[9.5px] leading-snug">
              <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>Pulled the transcript</span>
              </div>
              <p className="text-slate-400 pl-3 mt-0.5">
                flagged a pricing objection, and queued the AE&apos;s follow-up.
              </p>
            </div>

            <div className="mt-1 text-slate-500 text-[9px]">
              • Churned (41s • ↓ 13k tokens)
            </div>

            <div className="mt-1 text-slate-600 text-[10px] font-mono">&gt;</div>

            <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center gap-2 text-[9px] text-slate-400 font-sans">
              <span className="text-orange-500 font-bold">▶▶ auto</span>
              <span>Opus 4.8 • 1M context</span>
            </div>
          </div>
        </div>

        {/* =========================================================
            CENTER COLUMN: Fixed Width (No Squeezing, No Scrollbar)
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
                <div className="h-4 w-4 rounded bg-ink flex items-center justify-center text-white text-[10px] font-bold">
                  N
                </div>
                <span className="font-heading text-xs font-bold text-ink">Basepoint</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center -space-x-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white ring-2 ring-white">US</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white ring-2 ring-white">IN</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-semibold text-slate-700 ring-2 ring-white">+1</span>
              </div>
              <button className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium">
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <button className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50">
                <Sparkles className="h-3 w-3 text-cobalt" />
                <span>Ask Attio</span>
              </button>
            </div>
          </div>

          {/* Window Shell: Left Sidebar + Clean 5-Column Data Table */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
            
            {/* Sidebar */}
            <div className="hidden md:flex md:col-span-3 border-r border-slate-100 bg-[#FAF9F6]/70 p-3.5 flex-col justify-between text-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200/70 shadow-xs">
                  <span className="font-medium text-slate-700 flex items-center gap-1.5">
                    <Search className="h-3 w-3 text-slate-400" /> Quick Actions
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">⌘K</span>
                </div>

                <div>
                  <span className="px-2 font-mono text-[9px] uppercase tracking-wider text-slate-400">Workspace</span>
                  <div className="mt-1.5 space-y-0.5 font-medium">
                    <div className="flex items-center justify-between rounded-md bg-white px-2.5 py-1.5 text-slate-900 border border-slate-200/60 shadow-xs">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-cobalt" /> Milestones
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">7/7</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-slate-600 hover:bg-white/80">
                      <span className="flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-slate-400" /> Consensus PRD
                      </span>
                      <span className="rounded bg-emerald-50 text-emerald-700 px-1 font-mono text-[9px]">v1.2</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-slate-600 hover:bg-white/80">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-slate-400" /> Change Engine
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    </div>
                    <div className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-slate-600 hover:bg-white/80">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400" /> Audit Ledger
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-2 border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Consensus Reached</span>
                </div>
                <div className="font-mono text-[9px] text-slate-400 mt-0.5 truncate">
                  sha256: 7f8a...b9e4
                </div>
              </div>
            </div>

            {/* Main Data Table Area (No horizontal scrollbar!) */}
            <div className="md:col-span-9 p-4 sm:p-5 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-heading text-xs font-bold text-slate-900">
                      Milestone Ledger
                    </span>
                    <span className="text-slate-400 text-[11px]">ⓘ</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-[11px]">
                      <SlidersHorizontal className="h-3 w-3" /> Settings
                    </button>
                    <button className="flex items-center gap-1 rounded border border-slate-200 px-2 py-0.5 text-slate-700 hover:bg-slate-50 font-medium text-[11px]">
                      Export <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 text-xs text-slate-600 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-medium text-slate-800 text-[11px]">
                      <Layers className="h-3 w-3 text-cobalt" /> Top Milestones <ChevronDown className="h-3 w-3" />
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <ArrowUpDown className="h-3 w-3" /> Sorted by Date
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-700">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 5 Proportional Columns: 100% Fit with ZERO scrollbar */}
                <table className="w-full text-left font-mono text-[11px] mt-1.5 table-fixed">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px]">
                      <th className="pb-2 pl-1 w-[32%]">Milestone</th>
                      <th className="pb-2 w-[30%]">Deliverable Target</th>
                      <th className="pb-2 w-[16%]">State</th>
                      <th className="pb-2 w-[12%]">Amount</th>
                      <th className="pb-2 pr-1 w-[10%] text-right">Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {milestones.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        {/* 1. Milestone */}
                        <td className="py-2.5 pl-1 font-sans font-semibold text-slate-900 truncate">
                          <span className="inline-block h-3.5 w-3.5 rounded bg-slate-100 border border-slate-200 text-center text-[8px] font-mono font-bold text-slate-600 mr-1.5 leading-none pt-0.5">
                            {m.id}
                          </span>
                          <span>{m.name}</span>
                        </td>

                        {/* 2. Deliverable */}
                        <td className="py-2.5 text-slate-600 font-sans text-xs truncate">
                          {m.deliverable}
                        </td>

                        {/* 3. State */}
                        <td className="py-2.5">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold border ${m.stateColor}`}>
                            {m.state}
                          </span>
                        </td>

                        {/* 4. Amount */}
                        <td className="py-2.5">
                          <span className={`inline-block rounded px-1.5 py-0.5 font-bold ${m.amountColor}`}>
                            {m.amount}
                          </span>
                        </td>

                        {/* 5. Hash */}
                        <td className="py-2.5 pr-1 text-slate-400 text-[10px] text-right truncate">
                          {m.hash}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-cobalt" />
                  <span className="font-sans text-[11px]">Ask Attio anything...</span>
                </div>
                <span className="font-mono text-[9px]">Showing 7 verified records</span>
              </div>
            </div>

          </div>

        </div>

        {/* =========================================================
            RIGHT FLANK: Demo Video & Transcript Card
           ========================================================= */}
        <div
          className="hidden xl:flex flex-col w-72 shrink-0 transition-all duration-300 ease-out z-20"
          style={{
            opacity: sideOpacity,
            transform: `translateX(${rightTranslate}px)`,
            pointerEvents: scrollProgress > 0.35 ? "auto" : "none",
          }}
        >
          {/* Right Card Inner Wrapper */}
          <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-floating backdrop-blur-md -translate-x-12">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
              <span className="ml-2 font-heading text-xs font-bold text-slate-800">
                Product Demo w/ GreenLeaf
              </span>
            </div>

            {/* Video Player */}
            <div className="relative mt-2 h-36 w-full rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              <div className="relative flex flex-col items-center">
                <div className="h-14 w-14 rounded-full border-2 border-white/80 bg-slate-700 flex items-center justify-center text-white font-heading font-bold text-base shadow-md">
                  HL
                </div>
                <span className="text-[11px] text-white/90 font-medium mt-1">Elena Rostova (Lead Dev)</span>
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

            {/* Tabs */}
            <div className="mt-2.5 flex items-center gap-3 border-b border-slate-100 pb-1.5 text-[10px] text-slate-500 font-medium">
              <span>Meeting</span>
              <span className="text-slate-900 font-semibold border-b-2 border-ink pb-1.5 -mb-1.5">Transcript</span>
              <span>Speakers</span>
            </div>

            {/* Transcript */}
            <div className="mt-2.5 space-y-2 text-[11px] leading-snug">
              <div>
                <div className="flex items-center gap-1 font-semibold text-slate-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>Sam</span>
                  <span className="text-[10px] text-slate-400 font-mono">1:09</span>
                </div>
                <p className="text-slate-600 pl-2.5 mt-0.5">
                  &quot;Yep — we&apos;ll map it during onboarding, and I&apos;ll include a migration checklist.&quot;
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1 font-semibold text-slate-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                  <span>Ashley</span>
                  <span className="text-[10px] text-slate-400 font-mono">1:23</span>
                </div>
                <p className="text-slate-600 pl-2.5 mt-0.5">
                  &quot;Love it. Looking forward to finally getting off spreadsheets.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}