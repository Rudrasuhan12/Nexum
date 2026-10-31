"use client";

import React, { useState } from "react";
import { Trash2, ArrowUpRight } from "lucide-react";
import { SavedProject } from "@/lib/freelancer-settings-types";
import { INITIAL_SAVED_PROJECTS } from "@/lib/freelancer-settings-data";

interface SavedProjectsSectionProps {
  showToast: (msg: string) => void;
  onOpenProject?: (project: SavedProject) => void;
}

export default function SavedProjectsSection({
  showToast,
  onOpenProject,
}: SavedProjectsSectionProps) {
  const [projects, setProjects] = useState<SavedProject[]>(INITIAL_SAVED_PROJECTS);

  const handleRemove = (id: string, title: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    showToast(`Removed "${title}" from saved projects.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Saved Projects
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review and manage project briefs and client opportunities you bookmarked.
        </p>
      </div>

      <div className="space-y-3.5">
        {projects.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/90 text-xs text-slate-400">
            No saved projects. Browse verified opportunities in Find Projects.
          </div>
        ) : (
          projects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {proj.title}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {proj.clientCompany} · Saved {proj.savedDate}
                  </p>
                </div>
                <div className="text-sm font-extrabold text-slate-900 font-mono">
                  {proj.budget}
                </div>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {proj.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[11px]"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleRemove(proj.id, proj.title)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-600 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenProject) {
                      onOpenProject(proj);
                    } else {
                      showToast(`Opening proposal workflow for ${proj.title}...`);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#4f46e5] hover:text-[#4338ca] transition cursor-pointer"
                >
                  <span>Open Brief</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
