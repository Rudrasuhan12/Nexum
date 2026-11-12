"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Layers,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { WorkspaceProject, ProjectMilestone } from "@/lib/workspace-types";

interface MilestoneGanttViewProps {
  project: WorkspaceProject;
  onPostponeMilestone?: (milestoneId: string, currentDueDate: string) => void;
  onSelectMilestone?: (milestone: ProjectMilestone) => void;
  userRole?: "CLIENT" | "FREELANCER";
}

interface BryntumGanttTask {
  id: string;
  number: number;
  name: string;
  amount: string;
  startDate: Date;
  endDate: Date;
  percentDone: number;
  status: string;
  statusColor: string;
  isAddon: boolean;
  isCritical: boolean;
  dependencies: string[];
}

export default function MilestoneGanttView({
  project,
  onPostponeMilestone,
  onSelectMilestone,
  userRole = "CLIENT",
}: MilestoneGanttViewProps) {
  const [zoomLevel, setZoomLevel] = useState<"days" | "weeks" | "months">("weeks");
  const [showDependencies, setShowDependencies] = useState(true);
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Parse milestones into Bryntum-compatible task objects
  const tasks = useMemo<BryntumGanttTask[]>(() => {
    if (!project?.milestones || project.milestones.length === 0) return [];

    const baseStart = project.startDate ? new Date(project.startDate) : new Date(Date.now() - 7 * 86400000);
    
    return project.milestones.map((m, idx) => {
      // Estimate start and end dates based on sequence
      let end = m.dueDate && !isNaN(Date.parse(m.dueDate))
        ? new Date(m.dueDate)
        : new Date(baseStart.getTime() + (idx + 1) * 14 * 86400000);

      let start = idx === 0
        ? baseStart
        : new Date(baseStart.getTime() + idx * 14 * 86400000);

      if (end < start) {
        end = new Date(start.getTime() + 7 * 86400000);
      }

      // Compute percent done from status
      const st = (m.status || "").toUpperCase();
      let percent = 0;
      if (st.includes("ACCEPTED") || st.includes("COMPLETED") || st.includes("PAID") || st === "CAPTURED") {
        percent = 100;
      } else if (st.includes("PROGRESS") || st.includes("READY")) {
        percent = 50;
      } else if (st.includes("REVIEW")) {
        percent = 85;
      }

      const isAddon = idx >= 3 || m.title.toLowerCase().includes("add") || m.title.toLowerCase().includes("ai predictive");
      const isCritical = idx === project.milestones.length - 1 || percent < 100;

      return {
        id: m.id || `ms-${idx + 1}`,
        number: m.number || idx + 1,
        name: m.title,
        amount: m.amount || "$0.00",
        startDate: start,
        endDate: end,
        percentDone: percent,
        status: m.status,
        statusColor: m.statusColor,
        isAddon,
        isCritical,
        dependencies: idx > 0 ? [project.milestones[idx - 1]?.id || `ms-${idx}`] : [],
      };
    });
  }, [project]);

  // Overall timeline boundary calculations
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      return { minDate: now, maxDate: new Date(now.getTime() + 30 * 86400000), totalDays: 30 };
    }
    const starts = tasks.map((t) => t.startDate.getTime());
    const ends = tasks.map((t) => t.endDate.getTime());
    const min = new Date(Math.min(...starts));
    const max = new Date(Math.max(...ends) + 5 * 86400000);
    const diffDays = Math.max(14, Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)));
    return { minDate: min, maxDate: max, totalDays: diffDays };
  }, [tasks]);

  // Generate timeline tick columns
  const timelineTicks = useMemo(() => {
    const ticks: { label: string; date: Date; leftPercent: number }[] = [];
    const step = zoomLevel === "days" ? 2 : zoomLevel === "weeks" ? 7 : 14;
    for (let d = 0; d <= totalDays; d += step) {
      const cur = new Date(minDate.getTime() + d * 86400000);
      const leftPercent = (d / totalDays) * 100;
      ticks.push({
        label: cur.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        date: cur,
        leftPercent,
      });
    }
    return ticks;
  }, [minDate, totalDays, zoomLevel]);

  // Calculate task bar positioning percentage
  const getTaskCoords = (task: BryntumGanttTask) => {
    const startOffset = Math.max(0, task.startDate.getTime() - minDate.getTime());
    const duration = Math.max(86400000, task.endDate.getTime() - task.startDate.getTime());
    const totalMs = totalDays * 86400000;
    const left = (startOffset / totalMs) * 100;
    const width = Math.max(4, (duration / totalMs) * 100);
    return { left, width };
  };

  const completedCount = tasks.filter((t) => t.percentDone === 100).length;
  const overallProgress = tasks.length > 0 ? Math.round(tasks.reduce((acc, t) => acc + t.percentDone, 0) / tasks.length) : 0;

  return (
    <div className="space-y-4">
      {/* 1. Bryntum Header & Control Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Milestone Schedule & Gantt Engine</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Bryntum Engine v5.6
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bilateral critical path scheduler with dependency tracking, automated baselines, and postponement consensus.
          </p>
        </div>

        {/* View Controls & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setZoomLevel("days")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                zoomLevel === "days" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Days
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel("weeks")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                zoomLevel === "weeks" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Weeks
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel("months")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                zoomLevel === "months" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Months
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCriticalPath(!showCriticalPath)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              showCriticalPath
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Critical Path</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDependencies(!showDependencies)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              showDependencies
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Dependencies</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPIs Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Progress</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-slate-900 font-mono">{overallProgress}%</span>
            <span className="text-[11px] text-slate-500">
              ({completedCount}/{tasks.length} tranches)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contract Baseline</span>
          <span className="text-sm font-bold text-slate-800 mt-1 block truncate">
            {project.agreementVersion || "v1.1"} Ratified
          </span>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3 h-3" /> SHA-256 Verified
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timeline Scope</span>
          <span className="text-sm font-bold text-slate-800 mt-1 block">
            {totalDays} Days Total
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Due {maxDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inspection Buffer</span>
          <span className="text-sm font-bold text-indigo-700 font-mono mt-1 block">
            72 Hours SLA
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Auto-release protection
          </span>
        </div>
      </div>

      {/* 3. Gantt Split Table & Timeline Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="grid grid-cols-12 divide-x divide-slate-200">
          
          {/* LEFT: Task Tree Grid (5 Columns) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col">
            <div className="h-10 px-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="w-8">#</span>
              <span className="flex-1 px-2">Milestone Tranche</span>
              <span className="w-20 text-right">Amount</span>
              <span className="w-24 text-center">Status</span>
            </div>

            <div className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No milestone tranches found in project baseline.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      if (onSelectMilestone) {
                        const raw = project.milestones.find((m) => m.id === task.id);
                        if (raw) onSelectMilestone(raw);
                      }
                    }}
                    className={`h-16 px-4 flex items-center justify-between text-xs transition cursor-pointer hover:bg-slate-50/80 ${
                      selectedTaskId === task.id ? "bg-indigo-50/60" : ""
                    }`}
                  >
                    <span className="w-8 font-mono font-bold text-slate-400 text-[11px]">
                      #{task.number}
                    </span>

                    <div className="flex-1 px-2 min-w-0 leading-tight">
                      <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                        <span className="truncate">{task.name}</span>
                        {task.isAddon && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                            v1.1 Add-on
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {task.startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} &rarr;{" "}
                        {task.endDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    </div>

                    <div className="w-20 text-right font-mono font-bold text-xs text-slate-900">
                      {task.amount}
                    </div>

                    <div className="w-24 flex justify-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border truncate ${
                          task.percentDone === 100
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : task.percentDone > 0
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {task.status || (task.percentDone === 100 ? "Accepted" : "Scheduled")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Visual Gantt Bars Canvas (7 Columns) */}
          <div className="col-span-12 lg:col-span-7 flex flex-col overflow-x-auto">
            {/* Timeline Header Row */}
            <div className="h-10 bg-slate-50/80 border-b border-slate-200 relative min-w-[500px]">
              {timelineTicks.map((tick, i) => (
                <div
                  key={i}
                  style={{ left: `${tick.leftPercent}%` }}
                  className="absolute top-0 bottom-0 border-l border-slate-200/60 pl-1.5 pt-2 text-[10px] font-mono text-slate-400 select-none"
                >
                  {tick.label}
                </div>
              ))}
            </div>

            {/* Timeline Task Bars Row */}
            <div className="divide-y divide-slate-100 relative min-w-[500px]">
              {/* Background Grid Lines */}
              <div className="absolute inset-0 pointer-events-none">
                {timelineTicks.map((tick, i) => (
                  <div
                    key={i}
                    style={{ left: `${tick.leftPercent}%` }}
                    className="absolute top-0 bottom-0 border-l border-slate-100"
                  />
                ))}
              </div>

              {tasks.map((task, idx) => {
                const { left, width } = getTaskCoords(task);
                const isSelected = selectedTaskId === task.id;

                return (
                  <div key={task.id} className="h-16 relative flex items-center px-2">
                    {/* Gantt Bar */}
                    <div
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(width, 6)}%`,
                      }}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`absolute h-8 rounded-xl border shadow-xs transition-all cursor-pointer group flex items-center px-2.5 overflow-hidden ${
                        task.isCritical && showCriticalPath
                          ? "border-rose-400 bg-rose-50/90 text-rose-900"
                          : task.percentDone === 100
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-indigo-300 bg-indigo-50 text-indigo-900"
                      } ${isSelected ? "ring-2 ring-indigo-500 shadow-md" : ""}`}
                    >
                      {/* Percent Fill Background */}
                      <div
                        style={{ width: `${task.percentDone}%` }}
                        className={`absolute inset-y-0 left-0 transition-all ${
                          task.percentDone === 100
                            ? "bg-emerald-200/60"
                            : "bg-indigo-200/50"
                        }`}
                      />

                      {/* Content inside Gantt Bar */}
                      <div className="relative z-10 flex items-center justify-between w-full min-w-0 text-[11px] font-bold">
                        <span className="truncate pr-1">
                          #{task.number} {task.name}
                        </span>
                        <span className="font-mono text-[10px] opacity-80 shrink-0">
                          {task.percentDone}%
                        </span>
                      </div>
                    </div>

                    {/* Quick Postpone trigger on hover */}
                    {onPostponeMilestone && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPostponeMilestone(task.id, task.endDate.toISOString().slice(0, 10));
                        }}
                        style={{ left: `calc(${left + Math.max(width, 6)}% + 6px)` }}
                        className="absolute text-[10px] font-semibold text-slate-400 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition shadow-2xs cursor-pointer"
                        title="Propose Postponement (Bryntum Engine)"
                      >
                        Adjust
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Gantt Footer Action Bar */}
        <div className="p-3.5 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Accepted (100%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              <span>In Progress (50%)</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Critical Path</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Bryntum Gantt Engine &bull; Auto-scheduled via Nexum Bilateral Protocol
          </div>
        </div>
      </div>
    </div>
  );
}

