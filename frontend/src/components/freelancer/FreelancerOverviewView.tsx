"use client";

import React from "react";
import Image from "next/image";
import {
  DollarSign,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Lock,
  Layers,
  TrendingUp,
  Inbox,
  ArrowRight,
  ExternalLink,
  Send,
  FileCode,
  FileText,
  Sparkles,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { DemoUser } from "@/lib/auth-types";

interface FreelancerOverviewViewProps {
  freelancer: DemoUser;
  client: DemoUser;
  onNavigateTab: (tab: string) => void;
  onSubmitDeliverableClick: () => void;
  onReviewLeadClick: () => void;
}

export default function FreelancerOverviewView({
  freelancer,
  client,
  onNavigateTab,
  onSubmitDeliverableClick,
  onReviewLeadClick,
}: FreelancerOverviewViewProps) {
  return (
    <div className="space-y-8">
      {/* ==============================================================
          HERO PROFILE & IMMUTABLE AGREEMENT BANNER
         ============================================================== */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: User Info */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-slate-200 shadow-xs shrink-0">
              <Image
                src={freelancer.avatar}
                alt={freelancer.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {freelancer.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200">
                  {freelancer.companyOrHandle || "@sambit_dev"}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Verified Level 3 Escrow</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 mb-2">
                {freelancer.title || "Senior Full Stack & Escrow Systems Engineer"} · {freelancer.location || "Bangalore, India"}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600">
                <span className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                  <DollarSign className="w-3.5 h-3.5" />
                  <strong>$65.00 USD/hr</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>35 hrs/wk Available</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">Timezone: UTC+5:30 (IST)</span>
              </div>
            </div>
          </div>

          {/* Right: Immutable Dual-Approved Agreement Hash Badge */}
          <div className="flex flex-col items-start lg:items-end gap-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-right">
            <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              Active Agreement Hash
            </div>
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-indigo-700">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>canonical_v1.2_#9f8c2b7e</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <span>Client: <strong className="text-slate-800">{client.name}</strong></span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-700 font-bold">Dual Approved ✓</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          KEY KPI METRIC CARDS (4 Cards)
         ============================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
            <span className="font-semibold">Total Earned (Paid Out)</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">$2,700.00</div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+$1,200.00 from Milestone 1</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
            <span className="font-semibold">Locked in Escrow</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Lock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">$1,500.00</div>
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 mt-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Milestone 2 awaiting client review</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
            <span className="font-semibold">Milestone Pipeline</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">2 / 4</div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 font-medium">
            <span className="text-purple-700 font-bold">50% Complete</span>
            <span>· 1 In Review, 2 Queued</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-3">
            <span className="font-semibold">On-Time Acceptance</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">100%</div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">
            5 of 5 accepted · 0 dispute holds
          </div>
        </div>
      </section>

      {/* ==============================================================
          TASKS REQUIRING ATTENTION (PRIORITY ACTION CARD)
         ============================================================== */}
      <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/30 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Tasks Requiring Attention
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                  2 Pending Actions
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Milestone 2 deliverable awaiting client review & 1 counteroffer response needed
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Alex Rivera reviewed your pull request. Make sure SHA-256 criteria receipts are logged in the consensus state machine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onSubmitDeliverableClick}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Update Deliverables
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("proposals")}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              View Proposals
            </button>
          </div>
        </div>
      </section>

      {/* ==============================================================
          ACTIVE PROJECT SPOTLIGHT
         ============================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Active Project: Bilateral E-Commerce Payment Rails</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Funded in Escrow
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Client: {client.name} ({client.companyOrHandle}) · Target Completion: Nov 24, 2026
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab("workspace")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition cursor-pointer shadow-2xs"
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              <span>Open Workspace</span>
            </button>
            <button
              type="button"
              onClick={onSubmitDeliverableClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Deliverables</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/20 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                <span>Current Stage · Milestone 2</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                PayPal REST v2 Orders Webhook Ingestion Engine
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Awaiting Client Approval
              </span>
              <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-100 text-slate-900 border border-slate-200">
                $1,500.00 USD
              </span>
            </div>
          </div>

          {/* Testable Criteria Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>SHA-256 Signature Verify</span>
                <span className="text-emerald-700 text-xs">✓ Pass</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Verifies signature header against PayPal Sandbox public cert.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>30s Idempotent Window</span>
                <span className="text-emerald-700 text-xs">✓ Pass</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Duplicate webhook replay returns HTTP 200 without double-capture.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Timeout Self-Recovery</span>
                <span className="text-emerald-700 text-xs">✓ Pass</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Orders v2 GET reconciliation resumes state machine gracefully.
              </p>
            </div>
          </div>

          {/* Submitted Links */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 text-xs font-mono shadow-2xs">
            <div className="space-y-1">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Submitted Artifacts</div>
              <div className="flex flex-wrap items-center gap-3 text-slate-700">
                <a
                  href="https://github.com/proofloop/gateway/pull/42"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold underline underline-offset-2"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Pull Request #42</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-300">·</span>
                <a
                  href="https://www.loom.com/share/proofloop-milestone2-demo"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-purple-600 hover:text-purple-700 font-semibold underline underline-offset-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Loom Walkthrough (4m 20s)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="text-right">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Payment Release Trigger</div>
              <div className="text-amber-800 font-bold text-[11px]">
                Funds release on Alex Rivera acceptance
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          RECOMMENDED PROJECTS FOR YOU (OPPORTUNITY INBOX)
         ============================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Recommended Projects for You
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              1 New Lead
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("find_projects")}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span>Browse all projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xs hover:border-purple-300 transition">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>96% AI Match</span>
              </span>
              <span className="text-xs text-slate-500">· Stated Budget Fit: High</span>
              <span className="text-xs text-slate-500">· Timeline: 3 Weeks</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Pre-Funded Escrow
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Enterprise Smart Escrow Integration for Solana Pay
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Client is building cross-border payment settlement rails requiring verifiable bilateral state machines and webhook ingest recovery. Matches your TypeScript & PayPal/Escrow skill graph.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 pt-1">
              <span>Client: <strong className="text-slate-900">FinTech Labs Inc.</strong></span>
              <span>Budget: <strong className="text-slate-900">$3,200 – $4,800 USD</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onReviewLeadClick}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
            >
              Review Scope & Quote &rarr;
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("proposals")}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition border border-slate-300 cursor-pointer shadow-2xs"
            >
              View Counteroffers
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
