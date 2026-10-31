"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  FileCode,
  FileText,
  Send,
  Layers,
} from "lucide-react";

interface Milestone {
  id: string;
  number: number;
  title: string;
  description: string;
  amount: string;
  dueDate: string;
  status: "accepted" | "in_review" | "upcoming";
  statusLabel: string;
  statusColor: string;
  paymentOrder?: string;
}

const MILESTONES: Milestone[] = [
  {
    id: "m1",
    number: 1,
    title: "Project Intake & Architecture PRD",
    description: "Detailed system architecture, sequence diagrams, and PayPal REST v2 webhook contract specifications.",
    amount: "$1,200.00 USD",
    dueDate: "Oct 26, 2026",
    status: "accepted",
    statusLabel: "Accepted & Released",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paymentOrder: "PayPal Order #4AB912048C881923K",
  },
  {
    id: "m2",
    number: 2,
    title: "PayPal REST v2 Orders Webhook Ingestion Engine",
    description: "Webhook listener with SHA-256 signature verification, 30s idempotency deduplication cache, and Orders v2 reconciliation.",
    amount: "$1,500.00 USD",
    dueDate: "Nov 08, 2026",
    status: "in_review",
    statusLabel: "In Client Review",
    statusColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "m3",
    number: 3,
    title: "Failover Simulator & Chaos Telemetry",
    description: "Automated network dropout simulator, retry queue exponential backoff, and state consensus audit logger.",
    amount: "$1,800.00 USD",
    dueDate: "Nov 18, 2026",
    status: "upcoming",
    statusLabel: "Upcoming / Queued",
    statusColor: "bg-slate-100 text-slate-600 border-slate-200",
  },
  {
    id: "m4",
    number: 4,
    title: "Production Deployment, Observability & QA Signoff",
    description: "Multi-region deployment, health check alarms, integration test suite passing, and client operational signoff.",
    amount: "$1,200.00 USD",
    dueDate: "Nov 24, 2026",
    status: "upcoming",
    statusLabel: "Upcoming / Queued",
    statusColor: "bg-slate-100 text-slate-600 border-slate-200",
  },
];

interface FreelancerProjectsMilestonesViewProps {
  onSubmitDeliverableClick: () => void;
  onNavigateTab: (tab: string) => void;
  showToast?: (msg: string) => void;
}

export default function FreelancerProjectsMilestonesView({
  onSubmitDeliverableClick,
  onNavigateTab,
}: FreelancerProjectsMilestonesViewProps) {
  return (
    <div className="space-y-8">
      {/* Contract Brief Card */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs mb-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Active Contract</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Agreement v1.2 Active
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Bilateral E-Commerce Payment Rails
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: Horizon Commerce LLC (Alex Rivera) · Contract Total: $5,700.00 USD
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSubmitDeliverableClick}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Deliverables</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("workspace")}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
            >
              Open Workspace
            </button>
          </div>
        </div>

        {/* Agreed Scope Summary */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 text-xs text-slate-600 leading-relaxed space-y-1">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
            Agreed Scope of Work:
          </div>
          <p>
            Build, test, and deploy resilient bilateral webhook settlement infrastructure for PayPal REST Orders v2. Includes cryptographically verified payload signatures, duplicate event deduplication within a 30s sliding window, timeout recovery, and bilateral state machine release guarantees.
          </p>
        </div>
      </section>

      {/* Milestone Roadmap */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Milestones & Deliverable Roadmap</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            4 Milestones · <strong>$5,700.00 USD Total</strong>
          </span>
        </div>

        <div className="space-y-3">
          {MILESTONES.map((m) => (
            <div
              key={m.id}
              className={`rounded-2xl border p-5 sm:p-6 shadow-xs transition ${
                m.status === "in_review"
                  ? "border-amber-200 bg-amber-50/20"
                  : m.status === "accepted"
                  ? "border-emerald-200/80 bg-white"
                  : "border-slate-200/90 bg-white"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-full border grid place-items-center shrink-0 mt-0.5 ${
                      m.status === "accepted"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                        : m.status === "in_review"
                        ? "bg-amber-50 border-amber-200 text-amber-600"
                        : "bg-slate-100 border-slate-200 text-slate-400"
                    }`}
                  >
                    {m.status === "accepted" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : m.status === "in_review" ? (
                      <Clock className="w-4 h-4 animate-pulse" />
                    ) : (
                      <span className="text-xs font-bold">{m.number}</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">
                        Milestone {m.number}: {m.title}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${m.statusColor}`}
                      >
                        {m.statusLabel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {m.description}
                    </p>

                    {m.paymentOrder && (
                      <div className="text-[11px] text-emerald-700 font-mono pt-0.5">
                        {m.paymentOrder} · Dual SHA-256 Consensus Validated
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono shrink-0 pl-11 sm:pl-0">
                  <div className="text-sm font-bold text-slate-900">{m.amount}</div>
                  <div className="text-[11px] text-slate-400">Due {m.dueDate}</div>
                </div>
              </div>

              {/* In Review details */}
              {m.status === "in_review" && (
                <div className="mt-4 pt-3 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <a
                      href="https://github.com/proofloop/gateway/pull/42"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 font-semibold underline flex items-center gap-1"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>PR #42 (All checks passing)</span>
                    </a>
                    <span className="text-slate-300">·</span>
                    <a
                      href="https://www.loom.com/share/proofloop-milestone2-demo"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 hover:text-purple-700 font-semibold underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Loom Walkthrough</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={onSubmitDeliverableClick}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs self-start sm:self-auto"
                  >
                    Update Artifacts
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Revision Requests Log */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Revision Requests & Feedback Log
        </h3>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No pending revision requests. All deliverables accepted on first pass.</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">100% Quality Score</span>
        </div>
      </section>
    </div>
  );
}
