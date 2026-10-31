"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Clock,
} from "lucide-react";
import { ProjectTask } from "@/lib/freelancer-projects-types";

interface ProjectTasksTabProps {
  tasks: ProjectTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (newTask: ProjectTask) => void;
  showToast: (msg: string) => void;
}

export default function ProjectTasksTab({
  tasks,
  onToggleTask,
  onAddTask,
  showToast,
}: ProjectTasksTabProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [newDueDate, setNewDueDate] = useState("Dec 01, 2026");

  const filteredTasks = tasks.filter((t) => {
    if (filter === "COMPLETED") return t.completed;
    if (filter === "IN_PROGRESS") return t.status === "IN_PROGRESS";
    if (filter === "TO_DO") return t.status === "TO_DO" && !t.completed;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const task: ProjectTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || "Task added by freelancer",
      status: "TO_DO",
      priority: newPriority,
      dueDate: newDueDate,
      relatedMilestoneId: "ms-shopkart-3",
      milestoneTitle: "Milestone 3: Testing & Deployment",
      completed: false,
    };

    onAddTask(task);
    setNewTitle("");
    setNewDesc("");
    setShowAddForm(false);
    showToast(`Task "${task.title}" added to project board.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Tasks & Implementation Checklist ({tasks.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal task tracking mapped to milestone deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            {["ALL", "TO_DO", "IN_PROGRESS", "COMPLETED"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`py-1 px-2.5 rounded-lg transition cursor-pointer ${
                  filter === f
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Add Task Inline Card */}
      {showAddForm && (
        <form
          onSubmit={handleCreateTask}
          className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-xs space-y-3"
        >
          <h3 className="text-xs font-bold text-slate-900">New Task</h3>
          <div>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
              required
            />
          </div>
          <div>
            <textarea
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
              <input
                type="text"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                placeholder="Due date"
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white w-32"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-1.5 px-3.5 rounded-xl bg-[#4f46e5] text-xs font-bold text-white hover:bg-[#4338ca] cursor-pointer"
              >
                Save Task
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs">
            No tasks found for this filter.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-3.5 ${
                t.completed
                  ? "bg-slate-50/70 border-slate-200/60 opacity-80"
                  : "bg-white border-slate-200 shadow-2xs hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleTask(t.id)}
                  className="mt-0.5 text-slate-400 hover:text-[#4f46e5] transition cursor-pointer"
                >
                  {t.completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-xs font-bold tracking-tight ${
                        t.completed
                          ? "line-through text-slate-400"
                          : "text-slate-900"
                      }`}
                    >
                      {t.title}
                    </p>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === "HIGH"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : t.priority === "MEDIUM"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {t.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due {t.dueDate}
                    </span>
                    <span>· {t.milestoneTitle}</span>
                  </div>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                  t.completed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : t.status === "IN_PROGRESS"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : t.status === "UNDER_REVIEW"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {t.completed ? "Completed" : t.status.replace("_", " ")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
