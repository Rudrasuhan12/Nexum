"use client";

import React, { useMemo } from "react";
import ProjectFilterBar from "./ProjectFilterBar";
import ProjectCard from "./ProjectCard";
import {
  FreelancerProjectItem,
  ProjectSummaryKPIs,
} from "@/lib/freelancer-projects-types";

interface ProjectDirectoryProps {
  projects: FreelancerProjectItem[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  kpis: ProjectSummaryKPIs;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export default function ProjectDirectory({
  projects,
  selectedProjectId,
  onSelectProject,
  selectedStatus,
  onSelectStatus,
  kpis,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: ProjectDirectoryProps) {
  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        if (selectedStatus !== "ALL" && p.state !== selectedStatus) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchClient = p.client.companyName.toLowerCase().includes(q);
          const matchTags = p.techTags.some((t) => t.toLowerCase().includes(q));
          return matchTitle || matchClient || matchTags;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "PROGRESS") {
          return b.progressPercent - a.progressPercent;
        }
        if (sortBy === "DEADLINE") {
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (sortBy === "OLDEST") {
          return a.startDate.localeCompare(b.startDate);
        }
        // Default: NEWEST
        return b.startDate.localeCompare(a.startDate);
      });
  }, [projects, selectedStatus, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      <ProjectFilterBar
        selectedStatus={selectedStatus}
        onSelectStatus={onSelectStatus}
        kpis={kpis}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
      />

      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200/90 text-slate-500">
            <p className="text-sm font-semibold">No projects match your filter.</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search terms or status selection.
            </p>
          </div>
        ) : (
          filteredProjects.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              isSelected={proj.id === selectedProjectId}
              onSelect={() => onSelectProject(proj.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

