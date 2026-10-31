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
  filteredProjects?: FreelancerProjectItem[];
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
  filteredProjects: externalFilteredProjects,
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
  // Filter and sort projects if not pre-computed externally
  const computedFilteredProjects = useMemo(() => {
    if (externalFilteredProjects) {
      return externalFilteredProjects;
    }
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
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === "OLDEST") {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }
        // Default: NEWEST
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });
  }, [externalFilteredProjects, projects, selectedStatus, searchQuery, sortBy]);

  const displayProjects = externalFilteredProjects || computedFilteredProjects;

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
        {displayProjects.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200/90 text-slate-500">
            <p className="text-sm font-semibold">No projects match your filter.</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search terms or status selection.
            </p>
          </div>
        ) : (
          displayProjects.map((proj) => (
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
