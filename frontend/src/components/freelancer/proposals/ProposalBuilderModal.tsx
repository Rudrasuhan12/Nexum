"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowRight,
  Search,
  CheckCircle2,
  Briefcase,
  DollarSign,
  Building2,
  Sparkles,
  Layers,
  Clock,
} from "lucide-react";
import { FreelancerProposalItem } from "@/lib/freelancer-proposals-types";
import { searchFreelancerProjects } from "@/lib/api-client";

interface ProposalBuilderModalProps {
  onClose: () => void;
  onSubmitNewProposal?: (newProposal: FreelancerProposalItem) => void;
}

export default function ProposalBuilderModal({
  onClose,
}: ProposalBuilderModalProps) {
  const router = useRouter();
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function loadOpportunities() {
      try {
        const res = await searchFreelancerProjects({ limit: 50 });
        if (mounted && res.success && res.projects && res.projects.length > 0) {
          setAvailableProjects(res.projects);
          setSelectedProjectId(res.projects[0].id);
        }
      } catch (err) {
        console.warn("Could not fetch available opportunities", err);
      } finally {
        if (mounted) setIsLoadingProjects(false);
      }
    }
    loadOpportunities();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return availableProjects;
    const q = searchQuery.toLowerCase().trim();
    return availableProjects.filter((p) => {
      const matchTitle = (p.title || "").toLowerCase().includes(q);
      const matchClient = (p.client?.name || p.client?.company || "").toLowerCase().includes(q);
      const matchSkills = Array.isArray(p.skills) && p.skills.some((s: string) => s.toLowerCase().includes(q));
      const matchCategory = (p.category || "").toLowerCase().includes(q);
      return matchTitle || matchClient || matchSkills || matchCategory;
    });
  }, [availableProjects, searchQuery]);

  const selectedProject = useMemo(() => {
    return availableProjects.find((p) => p.id === selectedProjectId) || null;
  }, [availableProjects, selectedProjectId]);

  const handleContinue = () => {
    if (!selectedProjectId) return;
    onClose();
    router.push(`/freelancer/projects/${selectedProjectId}/apply`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#4f46e5] flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Select Project Opportunity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose an active client project to submit your custom proposal, milestone allocation, and technical documents.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title, client name, or required skills..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] transition"
          />
        </div>

        {/* Project Selection Cards List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[260px] max-h-[380px]">
          {isLoadingProjects ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading open client opportunities...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-12 text-center space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No project opportunities found</p>
              <p className="text-[11px] text-slate-400">
                {searchQuery ? "Try refining your search keyword." : "There are currently no active public projects open for applications."}
              </p>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const isSelected = p.id === selectedProjectId;
              const budgetFormatted = p.budgetCents
                ? `$${(p.budgetCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                : (p.budgetDisplay || "Negotiable");
              const clientOrg = p.client?.company || p.client?.name || "Client Organization";

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-1">
                          {p.title}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{clientOrg}</span>
                        </span>

                        <span className="text-slate-300">•</span>

                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-mono">
                          <DollarSign className="w-3 h-3 text-emerald-600 -mr-0.5" />
                          <span>{budgetFormatted}</span>
                        </span>

                        {p.budgetType && (
                          <span className="text-[10px] text-slate-400 font-medium capitalize">
                            {p.budgetType.toLowerCase()} escrow
                          </span>
                        )}
                      </div>

                      {/* Required skills */}
                      {Array.isArray(p.skills) && p.skills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {p.skills.slice(0, 4).map((s: string) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60"
                            >
                              {s}
                            </span>
                          ))}
                          {p.skills.length > 4 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{p.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Radio Selection Indicator */}
                    <div className="shrink-0 mt-0.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[#4f46e5] text-white"
                            : "border-2 border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4 fill-[#4f46e5] text-white" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          <div className="text-xs text-slate-500 truncate max-w-[280px]">
            {selectedProject ? (
              <span>
                Selected: <strong className="text-slate-800">{selectedProject.title}</strong>
              </span>
            ) : (
              <span>Please select a project to proceed</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedProjectId}
              onClick={handleContinue}
              className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>Continue to Proposal Application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
