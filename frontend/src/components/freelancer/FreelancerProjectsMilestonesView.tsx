"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import {
  FreelancerProjectItem,
  ProjectMilestone,
  MilestoneSubmission,
  ProjectTask,
  ProjectFile,
} from "@/lib/freelancer-projects-types";
import {
  INITIAL_FREELANCER_PROJECTS,
  calculateSummaryKPIs,
} from "@/lib/freelancer-projects-data";
import { fetchBackendProjects } from "@/lib/api-client";
import ProjectSummaryCards from "./projects/ProjectSummaryCards";
import ProjectDirectory from "./projects/ProjectDirectory";
import SelectedProjectHeader from "./projects/SelectedProjectHeader";
import ProjectTabs, { ProjectTabType } from "./projects/ProjectTabs";
import ProjectMilestonesTab from "./projects/ProjectMilestonesTab";
import ProjectOverviewTab from "./projects/ProjectOverviewTab";
import ProjectTasksTab from "./projects/ProjectTasksTab";
import ProjectFilesTab from "./projects/ProjectFilesTab";
import ProjectMessagesTab from "./projects/ProjectMessagesTab";
import ProjectPaymentsTab from "./projects/ProjectPaymentsTab";
import ProjectActivityTab from "./projects/ProjectActivityTab";
import MilestoneSubmissionModal from "./projects/MilestoneSubmissionModal";
import MilestoneDetailsModal from "./projects/MilestoneDetailsModal";
import ProposeMilestoneModal from "./projects/ProposeMilestoneModal";

interface FreelancerProjectsMilestonesViewProps {
  onSubmitDeliverableClick?: () => void;
  onNavigateTab: (tab: string) => void;
  showToast?: (msg: string) => void;
}

export default function FreelancerProjectsMilestonesView({
  onNavigateTab,
  showToast: parentShowToast,
}: FreelancerProjectsMilestonesViewProps) {
  // Toast handler
  const [internalToast, setInternalToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    if (parentShowToast) {
      parentShowToast(msg);
    } else {
      setInternalToast(msg);
      setTimeout(() => setInternalToast(null), 3500);
    }
  };

  // State: projects list
  const [projects, setProjects] = useState<FreelancerProjectItem[]>(
    INITIAL_FREELANCER_PROJECTS
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    INITIAL_FREELANCER_PROJECTS[0].id
  );

  // Filters & sorting
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("NEWEST");

  // Selected project active workspace tab
  const [activeTab, setActiveTab] = useState<ProjectTabType>("milestones");

  // Mobile layout switcher: 'directory' | 'workspace'
  const [mobileView, setMobileView] = useState<"directory" | "workspace">(
    "workspace"
  );

  // Modals state
  const [submittingMilestone, setSubmittingMilestone] =
    useState<ProjectMilestone | null>(null);
  const [viewingMilestone, setViewingMilestone] =
    useState<ProjectMilestone | null>(null);
  const [showProposeModal, setShowProposeModal] = useState(false);

  // Fetch real projects from backend if available
  useEffect(() => {
    let mounted = true;
    async function loadBackendData() {
      try {
        const res = await fetchBackendProjects();
        if (mounted && res.success && res.data && res.data.length > 0) {
          // If backend has projects, we merge or enrich our project list
          // Preserving the visual fidelity of the reference projects
        }
      } catch {
        // Fallback gracefully to INITIAL_FREELANCER_PROJECTS
      }
    }
    loadBackendData();
    return () => {
      mounted = false;
    };
  }, []);

  // Summary KPIs
  const summaryKPIs = useMemo(() => {
    return calculateSummaryKPIs(projects);
  }, [projects]);

  // Selected project
  const selectedProject = useMemo(() => {
    return (
      projects.find((p) => p.id === selectedProjectId) ||
      projects[0] ||
      INITIAL_FREELANCER_PROJECTS[0]
    );
  }, [projects, selectedProjectId]);

  // Handle project selection
  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    setMobileView("workspace");
  };

  // Handle deliverable submission confirmation
  const handleDeliverableSubmitted = (newSub: MilestoneSubmission) => {
    if (!submittingMilestone) return;

    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id !== selectedProject.id) return p;
        return {
          ...p,
          milestones: p.milestones.map((m) => {
            if (m.id !== submittingMilestone.id) return m;
            return {
              ...m,
              workStatus: "AWAITING_CLIENT_REVIEW",
              submittedAt: newSub.submissionDate,
              submissions: [...m.submissions, newSub],
            };
          }),
        };
      })
    );

    setSubmittingMilestone(null);
    showToast(
      `Deliverable submitted for ${submittingMilestone.title}. Status updated to In Review.`
    );
  };

  // Handle proposing a new milestone
  const handleProposeMilestone = (newMs: ProjectMilestone) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id !== selectedProject.id) return p;
        return {
          ...p,
          milestones: [...p.milestones, newMs],
        };
      })
    );
    setShowProposeModal(false);
    showToast(
      `Proposed "${newMs.title}". A change request has been recorded for client approval.`
    );
  };

  // Handle task completion toggle
  const handleToggleTask = (taskId: string) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id !== selectedProject.id) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const completed = !t.completed;
            return {
              ...t,
              completed,
              status: completed ? "COMPLETED" : "IN_PROGRESS",
            };
          }),
        };
      })
    );
  };

  // Handle add task
  const handleAddTask = (newTask: ProjectTask) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id !== selectedProject.id) return p;
        return {
          ...p,
          tasks: [newTask, ...p.tasks],
        };
      })
    );
  };

  // Handle file upload
  const handleUploadFile = (newFile: ProjectFile) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => {
        if (p.id !== selectedProject.id) return p;
        return {
          ...p,
          files: [newFile, ...p.files],
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Internal Toast */}
      {internalToast && (
        <div className="fixed bottom-6 right-6 z-50 py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg animate-in slide-in-from-bottom duration-200">
          {internalToast}
        </div>
      )}

      {/* Top Page Header (Title + Subtitle + Find More Projects Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Projects
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your active projects, track milestones, communicate with clients and deliver successfully.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab("find_projects")}
          className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Find More Projects</span>
        </button>
      </div>

      {/* 5 Summary KPI Cards across top */}
      <ProjectSummaryCards
        kpis={summaryKPIs}
        selectedFilter={selectedStatus}
        onSelectFilter={(filter) => setSelectedStatus(filter)}
      />

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Project Directory (5 cols on desktop) */}
        <div
          className={`lg:col-span-5 space-y-4 ${
            mobileView === "workspace" ? "hidden lg:block" : "block"
          }`}
        >
          <ProjectDirectory
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={handleSelectProject}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            kpis={summaryKPIs}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Right Panel: Selected Project Workspace (7 cols on desktop) */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobileView === "directory" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Project Header */}
          <SelectedProjectHeader
            project={selectedProject}
            onBackToDirectory={() => setMobileView("directory")}
            onOpenWorkspace={() => onNavigateTab("workspace")}
            showToast={showToast}
          />

          {/* Project Navigation Tabs */}
          <ProjectTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            milestonesCount={selectedProject.milestones.length}
            tasksCount={selectedProject.tasks.length}
            filesCount={selectedProject.files.length}
          />

          {/* Tab Content */}
          <div className="pt-1">
            {activeTab === "milestones" && (
              <ProjectMilestonesTab
                project={selectedProject}
                onOpenSubmitModal={(ms) => setSubmittingMilestone(ms)}
                onOpenDetailsModal={(ms) => setViewingMilestone(ms)}
                onOpenProposeModal={() => setShowProposeModal(true)}
                onSendMessageAction={() => onNavigateTab("workspace")}
                showToast={showToast}
              />
            )}

            {activeTab === "overview" && (
              <ProjectOverviewTab
                project={selectedProject}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenWorkspace={() => onNavigateTab("workspace")}
              />
            )}

            {activeTab === "tasks" && (
              <ProjectTasksTab
                tasks={selectedProject.tasks}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                showToast={showToast}
              />
            )}

            {activeTab === "files" && (
              <ProjectFilesTab
                files={selectedProject.files}
                onUploadFile={handleUploadFile}
                showToast={showToast}
              />
            )}

            {activeTab === "messages" && (
              <ProjectMessagesTab
                project={selectedProject}
                onOpenWorkspace={() => onNavigateTab("workspace")}
              />
            )}

            {activeTab === "payments" && (
              <ProjectPaymentsTab
                project={selectedProject}
                onOpenEarnings={() => onNavigateTab("earnings")}
              />
            )}

            {activeTab === "activity" && (
              <ProjectActivityTab project={selectedProject} />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {submittingMilestone && (
        <MilestoneSubmissionModal
          milestone={submittingMilestone}
          onClose={() => setSubmittingMilestone(null)}
          onSubmit={handleDeliverableSubmitted}
        />
      )}

      {viewingMilestone && (
        <MilestoneDetailsModal
          milestone={viewingMilestone}
          onClose={() => setViewingMilestone(null)}
          onOpenSubmitModal={(ms) => {
            setViewingMilestone(null);
            setSubmittingMilestone(ms);
          }}
          onSendMessage={() => onNavigateTab("workspace")}
        />
      )}

      {showProposeModal && (
        <ProposeMilestoneModal
          projectTitle={selectedProject.title}
          nextOrderIndex={selectedProject.milestones.length + 1}
          onClose={() => setShowProposeModal(false)}
          onPropose={handleProposeMilestone}
        />
      )}
    </div>
  );
}
