"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  DollarSign,
  ChevronRight,
  User,
  Sparkles,
  ArrowUpDown,
  RotateCcw,
  ShieldCheck,
  FileText,
  CreditCard,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  FolderKanban,
} from "lucide-react";

export type ProjectLifecycleStatus =
  | "ALL"
  | "DRAFT"
  | "FINDING_FREELANCERS"
  | "NEGOTIATION"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "COMPLETED"
  | "DISPUTED";

export interface ProjectCardData {
  id: string;
  name: string;
  description: string;
  status: ProjectLifecycleStatus;
  statusLabel: string;
  statusColor: string;
  stageSummary: string;
  nextAction: {
    label: string;
    description: string;
    type: "ACTION_REQUIRED" | "AWAITING_REPLY" | "RESUME" | "VIEW";
    urgent?: boolean;
  };
  lastUpdated: string;
  updatedTimestamp: number;
  createdAtTimestamp: number;
  nextMilestoneDueTimestamp: number | null;
  freelancer?: {
    name: string;
    role: string;
    avatar: string;
  };
  nextMilestone?: {
    title: string;
    dueDate: string;
    amount: string;
  };
  totalBudget?: string;
  needsAction: boolean;
  hasDeltaChange?: boolean;
}

const STABLE_NOW = 1793365200000;

const INITIAL_PROJECTS: ProjectCardData[] = [
  {
    id: "proj_1",
    name: "Bilateral E-Commerce Payment Rails",
    description: "Milestone-governed PayPal Orders v2 integration with Dual SHA-256 state machine and reconciliation retry engine.",
    status: "IN_REVIEW",
    statusLabel: "In Review",
    statusColor: "bg-amber-50 text-amber-800 border-amber-200/80",
    stageSummary: "Milestone 2 deliverable package submitted with full test assert logs.",
    nextAction: {
      label: "Review Deliverable & Release Funds",
      description: "Review automated tests & approve release of $1,500.00 from Sandbox escrow.",
      type: "ACTION_REQUIRED",
      urgent: true,
    },
    lastUpdated: "2 hours ago",
    updatedTimestamp: STABLE_NOW - 2 * 3600 * 1000,
    createdAtTimestamp: STABLE_NOW - 14 * 86400 * 1000,
    nextMilestoneDueTimestamp: STABLE_NOW + 1 * 86400 * 1000,
    freelancer: {
      name: "Rohan Verma",
      role: "Payment Rails Specialist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
    },
    nextMilestone: {
      title: "M2: PayPal Webhook Ingestion Engine",
      dueDate: "Submitted (Review Due Today)",
      amount: "$1,500.00",
    },
    totalBudget: "$4,500.00",
    needsAction: true,
  },
  {
    id: "proj_2",
    name: "CloudMesh AI Gateway Unification",
    description: "Unified streaming API across 4 LLM providers with semantic pgvector caching, row-level isolation & rate limiters.",
    status: "IN_PROGRESS",
    statusLabel: "In Progress",
    statusColor: "bg-blue-50 text-blue-700 border-blue-200/80",
    stageSummary: "M1 active. Elena Rostova proposed PRD #3 scope delta for streaming circuit breaker.",
    nextAction: {
      label: "Review Scope Change Delta",
      description: "Approve proposed +$400 scope addition to maintain consensus lock.",
      type: "ACTION_REQUIRED",
      urgent: true,
    },
    lastUpdated: "5 hours ago",
    updatedTimestamp: STABLE_NOW - 5 * 3600 * 1000,
    createdAtTimestamp: STABLE_NOW - 7 * 86400 * 1000,
    nextMilestoneDueTimestamp: STABLE_NOW + 3 * 86400 * 1000,
    freelancer: {
      name: "Elena Rostova",
      role: "Full-Stack AI Architect",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80",
    },
    nextMilestone: {
      title: "M1: AI Provider Gateway Isolation",
      dueDate: "Nov 02, 2026",
      amount: "$1,200.00",
    },
    totalBudget: "$3,600.00",
    needsAction: true,
    hasDeltaChange: true,
  },
  {
    id: "proj_3",
    name: "Autonomous PRD Generation & Spec Engine",
    description: "LLM-assisted requirements intake engine generating canonical acceptance criteria and bilateral deliverable boundaries.",
    status: "NEGOTIATION",
    statusLabel: "Negotiation",
    statusColor: "bg-purple-50 text-purple-700 border-purple-200/80",
    stageSummary: "Counter-offer v1.3 submitted by Marcus Chen ($2,800 total across 3 milestones).",
    nextAction: {
      label: "Review Proposed Terms & Sign Off",
      description: "Both parties must digitally sign canonical agreement v1.3.",
      type: "ACTION_REQUIRED",
      urgent: false,
    },
    lastUpdated: "Yesterday, 3:30 PM",
    updatedTimestamp: STABLE_NOW - 26 * 3600 * 1000,
    createdAtTimestamp: STABLE_NOW - 4 * 86400 * 1000,
    nextMilestoneDueTimestamp: STABLE_NOW + 10 * 86400 * 1000,
    freelancer: {
      name: "Marcus Chen",
      role: "Cloud Reliability & DevOps",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80",
    },
    nextMilestone: {
      title: "M1: Intake & Scope Extraction",
      dueDate: "Nov 12, 2026",
      amount: "$900.00",
    },
    totalBudget: "$2,800.00",
    needsAction: false,
  },
  {
    id: "proj_4",
    name: "Enterprise Multi-Tenant Design System",
    description: "Accessible Figma component kit with Tailwind CSS & Radix UI code mappings for cross-platform consistency.",
    status: "FINDING_FREELANCERS",
    statusLabel: "Finding Freelancers",
    statusColor: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    stageSummary: "Approved brief published. 4 verified candidate profiles invited for review.",
    nextAction: {
      label: "Evaluate Candidate Proposals",
      description: "3 proposals received from verified UI/UX design architects.",
      type: "VIEW",
      urgent: false,
    },
    lastUpdated: "2 days ago",
    updatedTimestamp: STABLE_NOW - 48 * 3600 * 1000,
    createdAtTimestamp: STABLE_NOW - 5 * 86400 * 1000,
    nextMilestoneDueTimestamp: null,
    totalBudget: "$2,500.00",
    needsAction: false,
  },
  {
    id: "proj_5",
    name: "Zero-Knowledge KYC Verification Module",
    description: "Client privacy module proving accreditation without revealing sensitive tax identification documents.",
    status: "DRAFT",
    statusLabel: "Draft",
    statusColor: "bg-slate-100 text-slate-700 border-slate-200",
    stageSummary: "AI intake 60% complete. Resume prompt session to generate acceptance criteria.",
    nextAction: {
      label: "Resume AI Project Intake",
      description: "Complete 3 remaining technical questions to lock milestone scope.",
      type: "RESUME",
      urgent: false,
    },
    lastUpdated: "3 days ago",
    updatedTimestamp: STABLE_NOW - 72 * 3600 * 1000,
    createdAtTimestamp: STABLE_NOW - 3 * 86400 * 1000,
    nextMilestoneDueTimestamp: null,
    needsAction: false,
  },
  {
    id: "proj_6",
    name: "Cross-Border Tax & VAT Engine Integration",
    description: "Automated real-time European VAT calculator & invoice generation adhering to EU DAC7 reporting standards.",
    status: "COMPLETED",
    statusLabel: "Completed",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    stageSummary: "All 4 milestones accepted, verified & released via PayPal Order captures.",
    nextAction: {
      label: "View Final Proof & Audit Trail",
      description: "Cryptographic consensus report and tax receipts are archived.",
      type: "VIEW",
      urgent: false,
    },
    lastUpdated: "1 week ago",
    updatedTimestamp: STABLE_NOW - 168 * 3600 * 1000,
    createdAtTimestamp: STABLE_NOW - 30 * 86400 * 1000,
    nextMilestoneDueTimestamp: null,
    freelancer: {
      name: "Priya Sharma",
      role: "FinTech Compliance Engineer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80",
    },
    totalBudget: "$5,200.00",
    needsAction: false,
  },
  {
    id: "proj_7",
    name: "High-Frequency WebSocket Auction Relay",
    description: "Real-time bidding pipeline over Redis Pub/Sub with millisecond timestamp ordering.",
    status: "IN_PROGRESS",
    statusLabel: "In Progress",
    statusColor: "bg-blue-50 text-blue-700 border-blue-200/80",
    stageSummary: "Milestone 1 completed. Milestone 2 in engineering progress.",
    nextAction: {
      label: "Track Milestone Progress",
      description: "Sprint review scheduled for Nov 06.",
      type: "VIEW",
      urgent: false,
    },
    lastUpdated: "4 days ago",
    updatedTimestamp: STABLE_NOW - 96 * 3600 * 1000,
    createdAtTimestamp: STABLE_NOW - 12 * 86400 * 1000,
    nextMilestoneDueTimestamp: STABLE_NOW + 6 * 86400 * 1000,
    freelancer: {
      name: "David K.",
      role: "Distributed Systems Architect",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&q=80",
    },
    nextMilestone: {
      title: "M2: Socket.IO Server Sharding",
      dueDate: "Nov 06, 2026",
      amount: "$1,800.00",
    },
    totalBudget: "$3,600.00",
    needsAction: false,
  },
  {
    id: "proj_8",
    name: "Mobile React Native Sandbox Client",
    description: "Cross-platform iOS and Android interface with biometric sign-in and push notifications.",
    status: "DISPUTED",
    statusLabel: "Disputed",
    statusColor: "bg-rose-50 text-rose-700 border-rose-200/80",
    stageSummary: "Deliverable rejected for missing offline sync requirement. Resolution mediation active.",
    nextAction: {
      label: "Review Mediation Terms",
      description: "Compare delivered criteria vs approved PRD to resolve dispute.",
      type: "ACTION_REQUIRED",
      urgent: true,
    },
    lastUpdated: "5 days ago",
    updatedTimestamp: STABLE_NOW - 120 * 3600 * 1000,
    createdAtTimestamp: STABLE_NOW - 20 * 86400 * 1000,
    nextMilestoneDueTimestamp: null,
    totalBudget: "$2,200.00",
    needsAction: true,
  },
];

interface ClientProjectsViewProps {
  onOpenProjectWorkspace?: (projectId: string, initialTab?: string) => void;
  onCreateNewProject?: () => void;
}

export default function ClientProjectsView({
  onOpenProjectWorkspace,
  onCreateNewProject,
}: ClientProjectsViewProps) {
  const router = useRouter();

  const handleOpenProject = (id: string) => {
    if (onOpenProjectWorkspace) {
      onOpenProjectWorkspace(id);
    } else {
      router.push(`/client/projects/${id}`);
    }
  };

  const handlePostProject = () => {
    if (onCreateNewProject) {
      onCreateNewProject();
    } else {
      router.push("/client/post-project");
    }
  };

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ProjectLifecycleStatus>("ALL");
  const [onlyNeedsAction, setOnlyNeedsAction] = useState(false);
  const [sortBy, setSortBy] = useState<"recently_updated" | "recently_created" | "next_due">("recently_updated");

  // Summary counts matching your image stats
  const totalCount = INITIAL_PROJECTS.length;
  const inProgressCount = INITIAL_PROJECTS.filter((p) => p.status === "IN_PROGRESS" || p.status === "IN_REVIEW").length;
  const needsActionCount = INITIAL_PROJECTS.filter((p) => p.needsAction).length;

  // Filter & Search Logic
  const filteredProjects = useMemo(() => {
    return INITIAL_PROJECTS.filter((proj) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = proj.name.toLowerCase().includes(q);
        const matchesDesc = proj.description.toLowerCase().includes(q);
        const matchesFreelancer = proj.freelancer?.name.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesFreelancer) return false;
      }

      // 2. Lifecycle Status Filter
      if (activeFilter !== "ALL" && proj.status !== activeFilter) {
        return false;
      }

      // 3. Quick Filter: Needs Action
      if (onlyNeedsAction && !proj.needsAction) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "recently_updated") {
        return b.updatedTimestamp - a.updatedTimestamp;
      }
      if (sortBy === "recently_created") {
        return b.createdAtTimestamp - a.createdAtTimestamp;
      }
      if (sortBy === "next_due") {
        const dueA = a.nextMilestoneDueTimestamp ?? Infinity;
        const dueB = b.nextMilestoneDueTimestamp ?? Infinity;
        return dueA - dueB;
      }
      return 0;
    });
  }, [searchQuery, activeFilter, onlyNeedsAction, sortBy]);

  const filterTabs: { id: ProjectLifecycleStatus; label: string; count?: number }[] = [
    { id: "ALL", label: "All Projects", count: totalCount },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "IN_REVIEW", label: "In Review" },
    { id: "NEGOTIATION", label: "Negotiation" },
    { id: "FINDING_FREELANCERS", label: "Finding Freelancers" },
    { id: "DRAFT", label: "Drafts" },
    { id: "COMPLETED", label: "Completed" },
    { id: "DISPUTED", label: "Disputed" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ==============================================================
          TOP STATS SUMMARY BAR (Exactly matching reference image)
         ============================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-8 sm:gap-14">
          {/* Stat 1: All Projects */}
          <button
            type="button"
            onClick={() => {
              setActiveFilter("ALL");
              setOnlyNeedsAction(false);
            }}
            className="text-left group cursor-pointer"
          >
            <div className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
              All Projects
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading mt-0.5">
              {totalCount}
            </div>
          </button>

          {/* Stat 2: In Progress */}
          <button
            type="button"
            onClick={() => {
              setActiveFilter("IN_PROGRESS");
              setOnlyNeedsAction(false);
            }}
            className="text-left group cursor-pointer"
          >
            <div className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
              In Progress
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading mt-0.5">
              {inProgressCount}
            </div>
          </button>

          {/* Stat 3: Needs Action (Highlighted red when pending) */}
          <button
            type="button"
            onClick={() => setOnlyNeedsAction((prev) => !prev)}
            className="text-left group cursor-pointer"
          >
            <div className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors flex items-center gap-1.5">
              <span>Needs Action</span>
              {needsActionCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
              )}
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight font-heading mt-0.5 ${
              onlyNeedsAction ? "text-[#4f46e5]" : "text-slate-900"
            }`}>
              {needsActionCount}
            </div>
          </button>
        </div>

        {/* Primary Action Button: Post a New Project */}
        <button
          type="button"
          onClick={handlePostProject}
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] active:scale-98 text-white font-bold text-xs sm:text-[13px] shadow-[0_4px_16px_rgba(79,70,229,0.22)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.32)] transition-all cursor-pointer group"
        >
          <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
          <span>Post a New Project</span>
        </button>
      </div>

      {/* ==============================================================
          HORIZONTAL LIFECYCLE FILTER BAR & SEARCH CONTROLS
         ============================================================== */}
      <div className="space-y-3">
        {/* Search & Sort Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name, description, or contractor..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5] transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filter Pill: Needs Action & Sort Dropdown */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setOnlyNeedsAction(!onlyNeedsAction)}
              className={`h-10 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                onlyNeedsAction
                  ? "bg-rose-50 text-rose-700 border-rose-300 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${onlyNeedsAction ? "bg-rose-500" : "bg-slate-300"}`} />
              <span>Needs Attention ({needsActionCount})</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "recently_updated" | "recently_created" | "next_due"
                  )
                }
                aria-label="Sort projects"
                className="h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-[#4f46e5] cursor-pointer shadow-2xs appearance-none"
              >
                <option value="recently_updated">Sort: Recently Updated</option>
                <option value="recently_created">Sort: Recently Created</option>
                <option value="next_due">Sort: Next Milestone Due</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Scrollable Horizontal Lifecycle Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-[#4f46e5] text-white border-[#4f46e5] shadow-xs"
                    : "bg-white text-slate-600 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==============================================================
          PROJECT CARDS LIST (Answers the 5 core client questions)
         ============================================================== */}
      {filteredProjects.length === 0 ? (
        /* Empty State */
        <div className="p-10 rounded-2xl border border-dashed border-slate-200 bg-white text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center mx-auto font-bold">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery || activeFilter !== "ALL" || onlyNeedsAction
              ? "No projects match these filters"
              : "Your next project starts with an idea"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || activeFilter !== "ALL" || onlyNeedsAction
              ? "Try adjusting your search query, clearing status filters, or turning off the needs-action filter."
              : "Describe what you want to build and Nexum's AI Intake will generate a binding PRD and milestone breakdown for you."}
          </p>

          <div className="pt-2">
            {searchQuery || activeFilter !== "ALL" || onlyNeedsAction ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("ALL");
                  setOnlyNeedsAction(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#4f46e5] bg-[#eef2ff] hover:bg-[#e0e7ff] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePostProject}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#4f46e5] hover:bg-[#4338ca] shadow-xs transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Post a New Project</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleOpenProject(project.id)}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-[#4f46e5]/40 hover:shadow-xs transition-all duration-200 cursor-pointer space-y-4 group"
            >
              {/* Row 1: Title, Status Badge, Budget & Last Activity */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight group-hover:text-[#4f46e5] transition-colors truncate">
                      {project.name}
                    </h3>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${project.statusColor}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{project.statusLabel}</span>
                    </span>

                    {/* Scope Delta Warning */}
                    {project.hasDeltaChange && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Scope Delta Pending</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                    {project.description}
                  </p>
                </div>

                {/* Right Metadata: Budget & Timestamp */}
                <div className="text-left sm:text-right shrink-0">
                  {project.totalBudget ? (
                    <div className="font-mono text-sm sm:text-base font-black text-slate-900">
                      {project.totalBudget} <span className="text-[10px] text-slate-400 font-sans font-medium">USD</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Budget Pending</span>
                  )}
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center sm:justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Updated {project.lastUpdated}</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Where it stands (Summary) & Assigned Contractor */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-3 border-t border-slate-100 text-xs">
                {/* Stage Summary */}
                <div className="md:col-span-7 flex items-center gap-2 text-slate-600">
                  <span className="font-semibold text-slate-800 shrink-0">Stage:</span>
                  <span className="truncate">{project.stageSummary}</span>
                </div>

                {/* Assigned Freelancer */}
                <div className="md:col-span-5 flex items-center sm:justify-end gap-2 text-slate-600">
                  {project.freelancer ? (
                    <>
                      <span className="text-slate-400 text-[11px]">Contractor:</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Image
                          src={project.freelancer.avatar}
                          alt={project.freelancer.name}
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>{project.freelancer.name}</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-400 text-[11px] italic">No contractor assigned yet</span>
                  )}
                </div>
              </div>

              {/* Row 3: What Needs To Happen Next (One Clear Action Callout) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      project.nextAction.urgent
                        ? "bg-rose-100 text-rose-700"
                        : "bg-indigo-100 text-[#4f46e5]"
                    }`}
                  >
                    {project.nextAction.urgent ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-snug">
                      Next Step: {project.nextAction.label}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5 truncate">
                      {project.nextAction.description}
                    </p>
                  </div>
                </div>

                {/* Action CTA Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenProject(project.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition shrink-0 flex items-center justify-center gap-1.5 shadow-2xs ${
                    project.nextAction.urgent
                      ? "bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200"
                  }`}
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

