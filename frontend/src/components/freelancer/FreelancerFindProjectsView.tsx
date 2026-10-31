"use client";

import React, { useState } from "react";
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Send,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface ProjectOpportunity {
  id: string;
  title: string;
  clientName: string;
  clientCompany: string;
  clientRating: number;
  clientSpent: string;
  postedTime: string;
  budget: string;
  budgetType: "Fixed Price" | "Hourly";
  timeline: string;
  escrowStatus: "Pre-Funded in Escrow" | "Verified Payment Method" | "Dual Consensus Ready";
  matchScore: number;
  description: string;
  skills: string[];
  requirements: string[];
}

const OPPORTUNITIES: ProjectOpportunity[] = [
  {
    id: "opp_1",
    title: "Enterprise Smart Escrow Integration for Solana Pay",
    clientName: "David Sterling",
    clientCompany: "FinTech Labs Inc.",
    clientRating: 4.95,
    clientSpent: "$48,000+ USD",
    postedTime: "2 hours ago",
    budget: "$3,200 – $4,800 USD",
    budgetType: "Fixed Price",
    timeline: "3 Weeks",
    escrowStatus: "Pre-Funded in Escrow",
    matchScore: 96,
    description:
      "We require an experienced systems engineer to construct cross-border payment settlement rails with verifiable state consensus, dual SHA-256 agreement signing, and automated webhook recovery.",
    skills: ["TypeScript", "Next.js", "Solana Pay", "PayPal REST v2", "State Machines"],
    requirements: [
      "Experience with idempotent webhook ingestion & retry queues",
      "Cryptographic verification of payload signatures",
      "Must agree to bilateral milestone acceptance criteria",
    ],
  },
  {
    id: "opp_2",
    title: "Multi-Tenant PDF Invoice Rendering Pipeline with Puppeteer Worker Pool",
    clientName: "Elena Rostova",
    clientCompany: "Apex Retail Group",
    clientRating: 5.0,
    clientSpent: "$120,000+ USD",
    postedTime: "5 hours ago",
    budget: "$2,800.00 USD",
    budgetType: "Fixed Price",
    timeline: "2 Weeks",
    escrowStatus: "Pre-Funded in Escrow",
    matchScore: 91,
    description:
      "Looking for a backend engineer to design a zero-leak multi-tenant PDF invoice rendering worker pool using headless Chromium, S3 signed uploads, and automated receipt generation.",
    skills: ["Node.js", "TypeScript", "Puppeteer", "AWS S3", "Docker"],
    requirements: [
      "Strict concurrency pool preventing memory leaks under high RPS",
      "Deterministic template rendering with KaTeX and HTML5 Canvas",
      "Deliver test suite with 90%+ branch coverage",
    ],
  },
  {
    id: "opp_3",
    title: "High-Throughput Webhook Ingest Relay & Telemetry Simulator",
    clientName: "Marcus Chen",
    clientCompany: "Nova Cloud Inc.",
    clientRating: 4.88,
    clientSpent: "$34,500+ USD",
    postedTime: "1 day ago",
    budget: "$65.00 – $80.00 USD / hr",
    budgetType: "Hourly",
    timeline: "4 Weeks (30 hrs/wk)",
    escrowStatus: "Dual Consensus Ready",
    matchScore: 88,
    description:
      "Build a resilient webhook relay that captures order notifications, simulates failovers with chaos injection, and logs consensus hashes to our audit trail.",
    skills: ["TypeScript", "Redis", "Go", "Next.js", "PayPal Sandbox"],
    requirements: [
      "Sub-50ms ingestion latency with backpressure buffering",
      "Chaos simulator to test network dropouts and duplicate events",
    ],
  },
  {
    id: "opp_4",
    title: "Next.js 15 Tailwind UI Dashboard with AI Mediation Copilot",
    clientName: "Sarah Jenkins",
    clientCompany: "Aura Creative",
    clientRating: 4.92,
    clientSpent: "$62,000+ USD",
    postedTime: "2 days ago",
    budget: "$2,400.00 USD",
    budgetType: "Fixed Price",
    timeline: "10 Days",
    escrowStatus: "Verified Payment Method",
    matchScore: 84,
    description:
      "Modernize our creative agency dashboard with responsive multi-column layouts, clean SaaS theme, and live AI assistant chat drawer.",
    skills: ["Next.js 15", "Tailwind CSS", "React 19", "UI/UX", "Lucide"],
    requirements: [
      "Pixel-perfect implementation of clean SaaS layout",
      "Zero layout shift, accessible ARIA controls",
    ],
  },
];

interface FreelancerFindProjectsViewProps {
  onApplyProject: (project: ProjectOpportunity) => void;
  showToast: (msg: string) => void;
}

export default function FreelancerFindProjectsView({
  onApplyProject,
  showToast,
}: FreelancerFindProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string>("All");
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>(["opp_1"]);

  const skillsList = [
    "All",
    "TypeScript",
    "Next.js",
    "PayPal REST v2",
    "Node.js",
    "Solana Pay",
    "Puppeteer",
    "Tailwind CSS",
  ];

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedProjectIds.includes(id)) {
      setSavedProjectIds((prev) => prev.filter((i) => i !== id));
      showToast("Opportunity removed from saved list.");
    } else {
      setSavedProjectIds((prev) => [...prev, id]);
      showToast("Opportunity saved! You can review it anytime.");
    }
  };

  const filteredProjects = OPPORTUNITIES.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSkill =
      selectedSkill === "All" || opp.skills.includes(selectedSkill);

    return matchesSearch && matchesSkill;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project title, client, tech stack or keywords..."
              className="w-full pl-9.5 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => showToast("Filters updated to Verified Escrow only.")}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Filters</span>
            </button>
            <span className="text-xs text-slate-400">
              Showing <strong>{filteredProjects.length}</strong> matching briefs
            </span>
          </div>
        </div>

        {/* Skill Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Skills:</span>
          {skillsList.map((skill) => {
            const isActive = selectedSkill === skill;
            return (
              <button
                key={skill}
                type="button"
                onClick={() => setSelectedSkill(skill)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer shrink-0 border ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {filteredProjects.map((opp) => {
          const isSaved = savedProjectIds.includes(opp.id);
          return (
            <div
              key={opp.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-indigo-300 hover:shadow-sm transition space-y-4"
            >
              {/* Top Row: Title, Match Score, Bookmark */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>{opp.matchScore}% Skill Match</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {opp.escrowStatus}
                    </span>
                    <span className="text-slate-400">· Posted {opp.postedTime}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {opp.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={(e) => toggleSave(opp.id, e)}
                  className={`p-2 rounded-xl border transition cursor-pointer shrink-0 shadow-2xs ${
                    isSaved
                      ? "border-amber-200 bg-amber-50 text-amber-600"
                      : "border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                  title={isSaved ? "Saved" : "Save project"}
                >
                  {isSaved ? <BookmarkCheck className="w-4 h-4 fill-amber-500" /> : <Bookmark className="w-4 h-4" />}
                </button>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {opp.description}
              </p>

              {/* Requirements Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1.5 text-xs">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  Key Deliverable Requirements:
                </div>
                {opp.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>

              {/* Tech Stack Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {opp.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Bottom Meta & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-slate-500">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {opp.budget}
                  </span>
                  <span>· {opp.budgetType}</span>
                  <span>· Timeline: <strong className="text-slate-800">{opp.timeline}</strong></span>
                  <span>· Client: <strong className="text-slate-800">{opp.clientCompany}</strong> ({opp.clientSpent} spent)</span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onApplyProject(opp)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Proposal</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
