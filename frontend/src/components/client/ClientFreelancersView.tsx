"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  SlidersHorizontal,
  Bookmark,
  BookmarkCheck,
  Send,
  Eye,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowRight,
  FilterX,
  Mail,
  Calendar,
  Briefcase,
  Award,
} from "lucide-react";
import {
  FreelancerProfile,
  FreelancerInvitation,
  ExperienceLevel,
  FreelancerType,
  AvailabilityStatus,
  INITIAL_FREELANCERS,
  INITIAL_INVITATIONS,
  AVAILABLE_SKILLS_FILTER,
} from "@/lib/mock-freelancers";
import { MOCK_PROJECTS, ProjectDetailData } from "@/lib/mock-projects";

interface ClientFreelancersViewProps {
  onOpenProjectWorkspace?: (projectId: string) => void;
}

const ALL_PROJECTS: ProjectDetailData[] = Object.values(MOCK_PROJECTS);

export default function ClientFreelancersView({
  onOpenProjectWorkspace,
}: ClientFreelancersViewProps) {
  // Main view tab: All Talent (Recommended + Results) | Saved Freelancers | Invitations
  const [activeMainTab, setActiveMainTab] = useState<"ALL" | "SAVED" | "INVITATIONS">("ALL");

  // Roster & Invitations Mutable State
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>(INITIAL_FREELANCERS);
  const [invitations, setInvitations] = useState<FreelancerInvitation[]>(INITIAL_INVITATIONS);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel | "ALL">("ALL");
  const [selectedType, setSelectedType] = useState<FreelancerType | "ALL">("ALL");
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityStatus | "ALL">("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [maxHourlyRate, setMaxHourlyRate] = useState<number>(120);

  // Modals state
  const [selectedProfileForDetail, setSelectedProfileForDetail] = useState<FreelancerProfile | null>(null);
  const [inviteModalFreelancer, setInviteModalFreelancer] = useState<FreelancerProfile | null>(null);
  const [inviteProjectId, setInviteProjectId] = useState<string>("proj_1");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteProposedRate, setInviteProposedRate] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Toggle skill in multi-select
  const handleToggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSkills([]);
    setSelectedExperience("ALL");
    setSelectedType("ALL");
    setSelectedAvailability("ALL");
    setSelectedProjectId("ALL");
    setMaxHourlyRate(120);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSkills.length > 0) count += selectedSkills.length;
    if (selectedExperience !== "ALL") count += 1;
    if (selectedType !== "ALL") count += 1;
    if (selectedAvailability !== "ALL") count += 1;
    if (selectedProjectId !== "ALL") count += 1;
    if (maxHourlyRate < 120) count += 1;
    return count;
  }, [
    selectedSkills,
    selectedExperience,
    selectedType,
    selectedAvailability,
    selectedProjectId,
    maxHourlyRate,
  ]);

  // Toggle bookmark / saved status
  const handleToggleSave = (freelancerId: string) => {
    setFreelancers((prev) =>
      prev.map((f) => {
        if (f.id === freelancerId) {
          const nextSaved = !f.isSaved;
          showToast(
            nextSaved
              ? `Saved ${f.name} to your bookmarked candidates.`
              : `Removed ${f.name} from saved candidates.`
          );
          return { ...f, isSaved: nextSaved };
        }
        return f;
      })
    );
  };

  // Filtered Freelancers
  const filteredFreelancers = useMemo(() => {
    return freelancers.filter((f) => {
      // 1. Search Query: Matches name, title, bio, or skills
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesTitle = f.title.toLowerCase().includes(q);
        const matchesBio = f.bio.toLowerCase().includes(q);
        const matchesSkills = f.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesTitle && !matchesBio && !matchesSkills) {
          return false;
        }
      }

      // 2. Skills: Multi-select (candidate must have all or any selected)
      if (selectedSkills.length > 0) {
        const hasSkill = selectedSkills.some((skill) =>
          f.skills.some((s) => s.toLowerCase() === skill.toLowerCase())
        );
        if (!hasSkill) return false;
      }

      // 3. Experience Level
      if (selectedExperience !== "ALL" && f.experienceLevel !== selectedExperience) {
        return false;
      }

      // 4. Freelancer Type (Individual vs Agency)
      if (selectedType !== "ALL" && f.type !== selectedType) {
        return false;
      }

      // 5. Availability (Only when provided)
      if (selectedAvailability !== "ALL" && f.availability !== selectedAvailability) {
        return false;
      }

      // 6. Project Relevance
      if (selectedProjectId !== "ALL" && f.recommendedForProjectId !== selectedProjectId) {
        return false;
      }

      // 7. Max Hourly Rate
      if (f.hourlyRateCents && f.hourlyRateCents / 100 > maxHourlyRate) {
        return false;
      }

      return true;
    });
  }, [
    freelancers,
    searchQuery,
    selectedSkills,
    selectedExperience,
    selectedType,
    selectedAvailability,
    selectedProjectId,
    maxHourlyRate,
  ]);

  // Recommended For You (Filtered candidates with high fitScore)
  const recommendedCandidates = useMemo(() => {
    return filteredFreelancers.filter((f) => f.fitScore >= 90);
  }, [filteredFreelancers]);

  // Saved Candidates
  const savedCandidates = useMemo(() => {
    return freelancers.filter((f) => f.isSaved);
  }, [freelancers]);

  // Open invite modal
  const handleOpenInviteModal = (freelancer: FreelancerProfile) => {
    setInviteModalFreelancer(freelancer);
    setInviteProjectId(freelancer.recommendedForProjectId || "proj_1");
    setInviteProposedRate(freelancer.hourlyRateDisplay ? `${freelancer.hourlyRateDisplay}` : "$60.00/hr");
    setInviteMessage(
      `Hello ${freelancer.name.split(" ")[0]}, we are developing a high-integrity milestone project and would like to invite you to review our requirements and submit a proposal.`
    );
  };

  // Submit invitation
  const handleSubmitInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteModalFreelancer) return;

    const targetProject = ALL_PROJECTS.find((p) => p.id === inviteProjectId);
    const projectName = targetProject ? targetProject.name : "Project Workspace";

    const newInvite: FreelancerInvitation = {
      id: `inv_${invitations.length + 1}`,
      freelancerId: inviteModalFreelancer.id,
      freelancerName: inviteModalFreelancer.name,
      freelancerAvatar: inviteModalFreelancer.avatar,
      freelancerTitle: inviteModalFreelancer.title,
      projectId: inviteProjectId,
      projectName,
      status: "PENDING",
      sentDate: "Just now",
      proposedRate: inviteProposedRate || "$60.00/hr",
      customNote: inviteMessage,
    };

    setInvitations((prev) => [newInvite, ...prev]);
    showToast(`Invitation sent to ${inviteModalFreelancer.name} for ${projectName}!`);
    setInviteModalFreelancer(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">

      {/* ====================================================================
          1. TOP NAVIGATION & SUBTABS HEADER
         ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#eef2ff] text-[#4f46e5]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Find Freelancers & Agencies
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Discover verified talent matched against your project requirements, review verifiable work history, and send bilateral escrow invitations.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/60 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveMainTab("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeMainTab === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            <span>All Talent</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
              {filteredFreelancers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("SAVED")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeMainTab === "SAVED"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            <Bookmark className="w-3 h-3 text-amber-500" />
            <span>Saved</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
              {savedCandidates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("INVITATIONS")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeMainTab === "INVITATIONS"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            <Send className="w-3 h-3 text-indigo-500" />
            <span>Invitations</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">
              {invitations.length}
            </span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. SEARCH & FILTER DRAWER / EXPANDABLE PANEL
         ==================================================================== */}
      {activeMainTab === "ALL" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200">
          {/* Main Search Row */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, professional title, or core skills (e.g. Next.js, PayPal v2)..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4f46e5] focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Expandable Filter Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen((prev) => !prev)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${isFilterPanelOpen || activeFiltersCount > 0
                    ? "bg-[#eef2ff] border-[#c7d2fe] text-[#4f46e5]"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#4f46e5] text-white text-[10px] font-extrabold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isFilterPanelOpen ? "rotate-180 text-[#4f46e5]" : "text-slate-400"
                    }`}
                />
              </button>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer flex items-center gap-1"
                  title="Clear all filters"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Expandable Filter Drawer Panel */}
          {isFilterPanelOpen && (
            <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-6 space-y-5 animate-in slide-in-from-top-2 duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                {/* Filter 1: Project Relevance */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Match Project Brief
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#4f46e5]"
                  >
                    <option value="ALL">All Active Projects</option>
                    {ALL_PROJECTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter 2: Experience Level */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Experience Level
                  </label>
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value as ExperienceLevel | "ALL")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#4f46e5]"
                  >
                    <option value="ALL">Any Experience Level</option>
                    <option value="EXPERT">Expert (8+ years)</option>
                    <option value="SENIOR">Senior (5-8 years)</option>
                    <option value="MID_LEVEL">Mid-Level (3-5 years)</option>
                    <option value="JUNIOR">Junior (1-3 years)</option>
                    <option value="BEGINNER">Beginner (&lt;1 year)</option>
                  </select>
                </div>

                {/* Filter 3: Freelancer Type */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Talent Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as FreelancerType | "ALL")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#4f46e5]"
                  >
                    <option value="ALL">All Types (Individual & Agency)</option>
                    <option value="INDIVIDUAL">Individual Freelancer</option>
                    <option value="AGENCY">Agency / Software Studio</option>
                  </select>
                </div>

                {/* Filter 4: Availability */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Availability
                  </label>
                  <select
                    value={selectedAvailability}
                    onChange={(e) => setSelectedAvailability(e.target.value as AvailabilityStatus | "ALL")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#4f46e5]"
                  >
                    <option value="ALL">Any Availability</option>
                    <option value="AVAILABLE">Available Now</option>
                    <option value="ACTIVE_CONTRACTOR">Active Contractor</option>
                    <option value="LIMITED">Limited Bandwidth</option>
                  </select>
                </div>
              </div>

              {/* Filter 5: Hourly Budget Slider */}
              <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-sm w-full">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Max Hourly Rate:</span>
                    <span className="font-mono font-extrabold text-[#4f46e5]">
                      ${maxHourlyRate}.00 / hr
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="120"
                    step="5"
                    value={maxHourlyRate}
                    onChange={(e) => setMaxHourlyRate(Number(e.target.value))}
                    className="w-full accent-[#4f46e5] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>$30/hr</span>
                    <span>$75/hr</span>
                    <span>$120/hr</span>
                  </div>
                </div>

                {/* Quick Skills Filter Cloud */}
                <div className="flex-1 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Filter by Key Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_SKILLS_FILTER.map((skill) => {
                      const isSelected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleToggleSkill(skill)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${isSelected
                              ? "bg-[#4f46e5] text-white shadow-xs"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 1: ALL TALENT (RECOMMENDED FOR YOU + RESULTS)
         ==================================================================== */}
      {activeMainTab === "ALL" && (
        <div className="space-y-8">

          {/* Section 2: Recommended For You */}
          {recommendedCandidates.length > 0 && searchQuery === "" && activeFiltersCount === 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Recommended for your projects
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  High-compatibility matches based on active milestones
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedCandidates.slice(0, 3).map((candidate) => (
                  <div
                    key={`rec_${candidate.id}`}
                    className="p-5 rounded-2xl bg-gradient-to-br from-white via-white to-indigo-50/40 border border-indigo-100 shadow-xs hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <Image
                              src={candidate.avatar}
                              alt={candidate.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                              {candidate.name}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-1">{candidate.title}</p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {candidate.fitScore}% Fit
                        </span>
                      </div>

                      {/* Why Recommended Pill */}
                      <div className="mt-3.5 p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100/80 text-[11px] text-indigo-900 leading-relaxed">
                        <span className="font-bold">Why recommended:</span> {candidate.recommendationReason}
                      </div>

                      {/* Key Skills */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-slate-700 border border-slate-200"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-400">
                            +{candidate.skills.length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-extrabold text-slate-900">
                          {candidate.hourlyRateDisplay || "Contact for rate"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProfileForDetail(candidate)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenInviteModal(candidate)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-xs transition cursor-pointer"
                        >
                          Invite
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: All Freelancer Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                All Candidates & Agencies ({filteredFreelancers.length})
              </h2>
              {searchQuery && (
                <span className="text-xs text-slate-500">
                  Showing matches for &ldquo;{searchQuery}&rdquo;
                </span>
              )}
            </div>

            {filteredFreelancers.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">No freelancers matched your criteria</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search terms, broadening the required skills, or expanding the max hourly rate budget.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {filteredFreelancers.map((freelancer) => {
                  const isSaved = freelancer.isSaved;
                  return (
                    <div
                      key={freelancer.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Photo, Name, Badges & Save Bookmark */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <Image
                                src={freelancer.avatar}
                                alt={freelancer.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                                  {freelancer.name}
                                </h3>
                                {freelancer.type === "AGENCY" ? (
                                  <span className="p-0.5 rounded text-slate-500" title="Agency / Studio">
                                    <Building2 className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span className="p-0.5 rounded text-slate-500" title="Individual Freelancer">
                                    <User className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1">{freelancer.title}</p>
                            </div>
                          </div>

                          {/* Bookmark Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleSave(freelancer.id)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer shrink-0 ${isSaved
                                ? "bg-amber-50 border-amber-200 text-amber-600"
                                : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700"
                              }`}
                            title={isSaved ? "Saved in bookmarks" : "Save candidate"}
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-4 h-4 fill-amber-500" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Location, Availability & Experience */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {freelancer.location}
                          </span>
                          <span>&bull;</span>
                          <span className="font-medium text-slate-700">
                            {freelancer.experienceYears}y exp ({freelancer.experienceLevel.toLowerCase()})
                          </span>
                          {freelancer.availability && (
                            <>
                              <span>&bull;</span>
                              <span
                                className={`px-2 py-0.2 rounded-md font-semibold text-[10px] ${freelancer.availability === "AVAILABLE"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : freelancer.availability === "ACTIVE_CONTRACTOR"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                              >
                                {freelancer.availability === "AVAILABLE"
                                  ? "Available"
                                  : freelancer.availability === "ACTIVE_CONTRACTOR"
                                    ? "Active Contract"
                                    : "Limited"}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Short Summary Bio */}
                        <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {freelancer.bio}
                        </p>

                        {/* Why Recommended Highlight (if present) */}
                        {freelancer.recommendationReason && (
                          <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                            <span className="font-semibold text-slate-800">Match note:</span>{" "}
                            {freelancer.recommendationReason}
                          </div>
                        )}

                        {/* Relevant Portfolio Highlights */}
                        {freelancer.portfolioHighlights.length > 0 && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">
                              {freelancer.portfolioHighlights[0].title} ({freelancer.portfolioHighlights[0].year})
                            </span>
                          </div>
                        )}

                        {/* Key Skills */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {freelancer.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                            >
                              {skill}
                            </span>
                          ))}
                          {freelancer.skills.length > 4 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-400">
                              +{freelancer.skills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          {freelancer.hourlyRateDisplay ? (
                            <span className="text-xs font-mono font-extrabold text-slate-900">
                              {freelancer.hourlyRateDisplay}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Rate upon quote</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedProfileForDetail(freelancer)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          >
                            View Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenInviteModal(freelancer)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-xs transition cursor-pointer"
                          >
                            Invite
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: SAVED FREELANCERS
         ==================================================================== */}
      {activeMainTab === "SAVED" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Bookmarked Candidates ({savedCandidates.length})
            </h2>
            <button
              type="button"
              onClick={() => setActiveMainTab("ALL")}
              className="text-xs font-bold text-[#4f46e5] hover:underline cursor-pointer"
            >
              Browse directory &rarr;
            </button>
          </div>

          {savedCandidates.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">No saved freelancers yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click the bookmark icon on any candidate profile to keep a shortlist of talent for your upcoming milestones.
              </p>
              <button
                type="button"
                onClick={() => setActiveMainTab("ALL")}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4f46e5] text-white hover:bg-[#4338ca] cursor-pointer shadow-xs"
              >
                Discover Talent
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {savedCandidates.map((freelancer) => (
                <div
                  key={`saved_${freelancer.id}`}
                  className="p-5 rounded-2xl bg-white border border-amber-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <Image
                            src={freelancer.avatar}
                            alt={freelancer.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                            {freelancer.name}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-1">{freelancer.title}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSave(freelancer.id)}
                        className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition cursor-pointer"
                        title="Remove from bookmarks"
                      >
                        <BookmarkCheck className="w-4 h-4 fill-amber-500" />
                      </button>
                    </div>

                    <p className="mt-3 text-xs text-slate-600 line-clamp-2">{freelancer.bio}</p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {freelancer.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-mono font-extrabold text-slate-900">
                      {freelancer.hourlyRateDisplay || "Contact for rate"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProfileForDetail(freelancer)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                      >
                        View Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenInviteModal(freelancer)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-xs transition cursor-pointer"
                      >
                        Invite
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 3: INVITATIONS
         ==================================================================== */}
      {activeMainTab === "INVITATIONS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Project Invitations ({invitations.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track formal invitations extended to freelancers across your active projects.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveMainTab("ALL")}
              className="text-xs font-bold text-[#4f46e5] hover:underline cursor-pointer"
            >
              + Invite more talent
            </button>
          </div>

          {invitations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">No project invitations sent yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore matched freelancers and invite them to submit proposals against your project briefs.
              </p>
              <button
                type="button"
                onClick={() => setActiveMainTab("ALL")}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4f46e5] text-white hover:bg-[#4338ca] cursor-pointer shadow-xs"
              >
                Find Freelancers
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <Image
                        src={inv.freelancerAvatar}
                        alt={inv.freelancerName}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{inv.freelancerName}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${inv.status === "ACCEPTED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : inv.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                        >
                          {inv.status === "ACCEPTED"
                            ? "PROPOSAL RECEIVED"
                            : inv.status === "PENDING"
                              ? "INVITATION SENT"
                              : inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{inv.freelancerTitle}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span className="font-semibold text-slate-800">{inv.projectName}</span>
                        <span>&bull;</span>
                        <span>Sent: {inv.sentDate}</span>
                        <span>&bull;</span>
                        <span className="text-indigo-600 font-bold">{inv.proposedRate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {onOpenProjectWorkspace && (
                      <button
                        type="button"
                        onClick={() => onOpenProjectWorkspace(inv.projectId)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                      >
                        Project Workspace
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => showToast(`Nudge notification re-sent to ${inv.freelancerName}.`)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition cursor-pointer"
                    >
                      {inv.status === "ACCEPTED" ? "Review Proposal" : "Send Follow-Up"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          5. FREELANCER PROFILE DETAIL MODAL (FULL VIEW)
         ==================================================================== */}
      {selectedProfileForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl space-y-6">

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <Image
                    src={selectedProfileForDetail.avatar}
                    alt={selectedProfileForDetail.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {selectedProfileForDetail.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#eef2ff] text-[#4f46e5]">
                      {selectedProfileForDetail.type === "AGENCY" ? "Agency / Studio" : "Verified Individual"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {selectedProfileForDetail.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {selectedProfileForDetail.location}
                    </span>
                    <span>&bull;</span>
                    <span>{selectedProfileForDetail.timezone}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProfileForDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Rate</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                  {selectedProfileForDetail.hourlyRateDisplay || "By Quote"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Experience</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                  {selectedProfileForDetail.experienceYears} Years
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Availability</span>
                <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                  {selectedProfileForDetail.availability === "AVAILABLE" ? "Immediate" : "Active Contract"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Nexum Fit Score</span>
                <span className="text-sm font-extrabold text-[#4f46e5] mt-0.5 block">
                  {selectedProfileForDetail.fitScore}% Match
                </span>
              </div>
            </div>

            {/* Professional Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Professional Overview & Experience
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {selectedProfileForDetail.fullBio}
              </p>
            </div>

            {/* Verified Work & Portfolio Highlights */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Verifiable Portfolio Highlights & Milestones
              </h3>
              <div className="space-y-2.5">
                {selectedProfileForDetail.portfolioHighlights.map((work, idx) => (
                  <div
                    key={`work_${idx}`}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{work.title}</span>
                      <span className="font-mono text-[10px] text-slate-400">{work.year}</span>
                    </div>
                    <p className="text-slate-600">{work.outcome}</p>
                    {work.verifiedOnLedger && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-1">
                        <ShieldCheck className="w-3 h-3" />
                        Verified via Nexum Consensus Ledger
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Credentials */}
            {selectedProfileForDetail.verifiedCredentials.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Verified Credentials & Badges
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProfileForDetail.verifiedCredentials.map((badge) => (
                    <span
                      key={badge}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Matrix */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Technical Stack & Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedProfileForDetail.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleSave(selectedProfileForDetail.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${selectedProfileForDetail.isSaved
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{selectedProfileForDetail.isSaved ? "Saved" : "Save Profile"}</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedProfileForDetail(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const candidate = selectedProfileForDetail;
                    setSelectedProfileForDetail(null);
                    handleOpenInviteModal(candidate);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Invite to Project</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          6. INTERACTIVE INVITE TO PROJECT MODAL
         ==================================================================== */}
      {inviteModalFreelancer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Invite {inviteModalFreelancer.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send an official project invitation to review your requirements.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalFreelancer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInvite} className="space-y-4">
              {/* Target Project Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Target Project Brief *</label>
                <select
                  value={inviteProjectId}
                  onChange={(e) => setInviteProjectId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                >
                  {ALL_PROJECTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.totalBudget})
                    </option>
                  ))}
                </select>
              </div>

              {/* Proposed Rate / Milestone Budget */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Proposed Rate / Estimate</label>
                <input
                  type="text"
                  value={inviteProposedRate}
                  onChange={(e) => setInviteProposedRate(e.target.value)}
                  placeholder="e.g. $65.00/hr or $4,500 milestone budget"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                />
              </div>

              {/* Custom Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Custom Invitation Message *</label>
                <textarea
                  rows={4}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setInviteModalFreelancer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Official Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}