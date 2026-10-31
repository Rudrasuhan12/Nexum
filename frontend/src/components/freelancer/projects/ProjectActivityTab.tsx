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
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {events.map((ev) => {
            const Icon = ev.icon;
            return (
              <div key={ev.id} className="relative group">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 top-0 w-6 h-6 rounded-full border flex items-center justify-center -translate-x-1/2 ${ev.iconColor}`}
                >
                  <Icon className="w-3 h-3" />
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900">
                      {ev.title}
                    </p>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {ev.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {ev.actor}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
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
