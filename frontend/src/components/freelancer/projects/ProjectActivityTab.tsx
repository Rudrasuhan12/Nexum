"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  CheckCircle2,
  CreditCard,
  UploadCloud,
  FileCode,
  User,
  History,
  AlertCircle,
  FileText,
} from "lucide-react";
import { FreelancerProjectItem } from "@/lib/freelancer-projects-types";
import { fetchProjectActivity } from "@/lib/api-client";

interface ProjectActivityTabProps {
  project: FreelancerProjectItem;
}

interface ActivityEventUI {
  id: string;
  title: string;
  description: string;
  actor: string;
  timestamp: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badge: string;
  badgeColor: string;
}

function formatActionTitle(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapAuditToUI(ev: {
  id: string;
  action: string;
  objectType: string;
  objectId: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  metadata?: any;
}): ActivityEventUI {
  const action = ev.action.toUpperCase();
  let title = formatActionTitle(action);
  let description = `${ev.objectType} ${ev.objectId}`;
  let icon = FileText;
  let iconColor = "text-slate-600 bg-slate-50 border-slate-200";
  let badge = ev.actorRole || "EVENT";
  let badgeColor = "bg-slate-50 text-slate-700 border-slate-200";

  if (action.includes("MILESTONE_ACCEPTED") || action.includes("DELIVERABLE_ACCEPTED")) {
    title = "Milestone Accepted";
    description = ev.metadata?.title
      ? `Milestone "${ev.metadata.title}" approved by client.`
      : "Milestone deliverable was reviewed and approved.";
    icon = CheckCircle2;
    iconColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
    badge = "Completed";
    badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  } else if (action.includes("MILESTONE_SUBMITTED") || action.includes("DELIVERABLE_SUBMITTED")) {
    title = "Milestone Deliverable Submitted";
    description = ev.metadata?.title
      ? `Deliverables for "${ev.metadata.title}" submitted for client review.`
      : "Milestone deliverables submitted for stakeholder verification.";
    icon = UploadCloud;
    iconColor = "text-amber-600 bg-amber-50 border-amber-200";
    badge = "In Review";
    badgeColor = "bg-amber-50 text-amber-700 border-amber-200/80";
  } else if (action.includes("PAYMENT") || action.includes("CAPTURE") || action.includes("ESCROW")) {
    title = formatActionTitle(action);
    description = ev.metadata?.amountMinor
      ? `Escrow transaction of $${(ev.metadata.amountMinor / 100).toFixed(2)} recorded.`
      : "Payment movement processed through settlement engine.";
    icon = CreditCard;
    iconColor = "text-[#4f46e5] bg-indigo-50 border-indigo-200";
    badge = "Escrow";
    badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200/80";
  } else if (action.includes("TASK")) {
    title = formatActionTitle(action);
    description = ev.metadata?.title ? `Task: "${ev.metadata.title}"` : "Workspace task was modified.";
    icon = FileCode;
    iconColor = "text-blue-600 bg-blue-50 border-blue-200";
    badge = "Task";
    badgeColor = "bg-blue-50 text-blue-700 border-blue-200/80";
  } else if (action.includes("AGREEMENT") || action.includes("RATIFIED")) {
    title = formatActionTitle(action);
    description = "Bilateral agreement ratified and recorded in persistent store.";
    icon = FileCheck;
    iconColor = "text-purple-600 bg-purple-50 border-purple-200";
    badge = "Contract";
    badgeColor = "bg-purple-50 text-purple-700 border-purple-200/80";
  }

  const dateObj = new Date(ev.timestamp);
  const formattedTime = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : ev.timestamp;

  return {
    id: ev.id,
    title,
    description,
    actor: ev.actor,
    timestamp: formattedTime,
    icon,
    iconColor,
    badge,
    badgeColor,
  };
}

export default function ProjectActivityTab({ project }: ProjectActivityTabProps) {
  const [events, setEvents] = useState<ActivityEventUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadActivity() {
      setIsLoading(true);
      try {
        const res = await fetchProjectActivity(project.id);
        if (mounted) {
          if (res.success && Array.isArray(res.activity)) {
            setEvents(res.activity.map(mapAuditToUI));
          } else {
            setEvents([]);
          }
        }
      } catch {
        if (mounted) setEvents([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    if (project.id) {
      loadActivity();
    }
    return () => {
      mounted = false;
    };
  }, [project.id]);

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

      {/* Timeline or Empty State */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading project activity history...
          </div>
        ) : events.length === 0 ? (
          <div className="py-10 text-center">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">No activity recorded yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Audit events will appear here as project agreements, tasks, milestone submissions, and escrow captures take place.
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
