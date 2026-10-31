"use client";

import React from "react";
import {
  FileCheck,
  CheckCircle2,
  CreditCard,
  UploadCloud,
  FileCode,
  User,
} from "lucide-react";
import { FreelancerProjectItem } from "@/lib/freelancer-projects-types";

interface ProjectActivityTabProps {
  project: FreelancerProjectItem;
}

export default function ProjectActivityTab({ project }: ProjectActivityTabProps) {
  const events = [
    {
      id: "act-1",
      title: "Milestone 2 Deliverable Submitted",
      description: "Backend APIs & PayPal order capture submitted with PR #31 and test suite results.",
      actor: "Sambit Mohanty (Freelancer)",
      timestamp: "Nov 14, 2026, 2:40 PM",
      icon: UploadCloud,
      iconColor: "text-amber-600 bg-amber-50 border-amber-200",
      badge: "In Review",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200/80",
    },
    {
      id: "act-2",
      title: "PayPal Escrow Pre-Funding Confirmed",
      description: "Order capture confirmed for ₹30,000 via PayPal Sandbox Orders v2.",
      actor: "Nexum Automated Settlement",
      timestamp: "Nov 12, 2026, 9:15 AM",
      icon: CreditCard,
      iconColor: "text-[#4f46e5] bg-indigo-50 border-indigo-200",
      badge: "Escrow Locked",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    },
    {
      id: "act-3",
      title: "Milestone 1 Accepted & Paid",
      description: "Client approved UI/UX design deliverables. ₹20,000 disbursement executed.",
      actor: `${project.client.companyName} (Client)`,
      timestamp: "Oct 24, 2026, 11:30 AM",
      icon: CheckCircle2,
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      badge: "Completed",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    },
    {
      id: "act-4",
      title: "Milestone 1 Deliverables Submitted",
      description: "Frontend repository pull request #14 and interactive demo submitted for review.",
      actor: "Sambit Mohanty (Freelancer)",
      timestamp: "Oct 22, 2026, 4:15 PM",
      icon: FileCode,
      iconColor: "text-blue-600 bg-blue-50 border-blue-200",
      badge: "Delivered",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200/80",
    },
    {
      id: "act-5",
      title: "Project Agreement v1.4 Ratified",
      description: "Bilateral agreement approved by both parties. Total value ₹80,000 fixed price.",
      actor: "Consensus Engine",
      timestamp: "Oct 10, 2026, 10:00 AM",
      icon: FileCheck,
      iconColor: "text-purple-600 bg-purple-50 border-purple-200",
      badge: "Contract Active",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200/80",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
          Project Audit Log & Consensus Activity
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable event history showing stakeholder decisions, submissions, and escrow movements.
        </p>
      </div>

      {/* Timeline */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="space-y-0">
          {events.map((ev, idx) => {
            const Icon = ev.icon;
            const isLast = idx === events.length - 1;

            return (
              <div key={ev.id} className="relative flex items-start gap-4 group">
                {/* Left rail: Centered node icon + continuous connecting vertical line */}
                <div className="flex flex-col items-center shrink-0 self-stretch">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs shrink-0 z-10 transition group-hover:scale-105 ${ev.iconColor}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 grow bg-slate-200 my-1 rounded-full group-hover:bg-slate-300 transition" />
                  )}
                </div>

                {/* Right content */}
                <div className={`flex-1 min-w-0 pt-0.5 ${!isLast ? "pb-6" : "pb-1"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {ev.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                      {ev.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{ev.actor}</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${ev.badgeColor}`}
                    >
                      {ev.badge}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
