"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import {
  FreelancerProposalItem,
  ProposalDetailTab,
} from "@/lib/freelancer-proposals-types";
import {
  INITIAL_FREELANCER_PROPOSALS,
  calculateProposalSummaryKPIs,
} from "@/lib/freelancer-proposals-data";
import ProposalSummaryCards from "./proposals/ProposalSummaryCards";
import ProposalDirectory from "./proposals/ProposalDirectory";
import SelectedProposalHeader from "./proposals/SelectedProposalHeader";
import ProposalTabs from "./proposals/ProposalTabs";
import ProposalOfferTab from "./proposals/ProposalOfferTab";
import ProjectDetailsTab from "./proposals/ProjectDetailsTab";
import ClientProfileTab from "./proposals/ClientProfileTab";
import ProposalMessagesTab from "./proposals/ProposalMessagesTab";
import ProposalActivityTab from "./proposals/ProposalActivityTab";
import CounterofferComparisonModal from "./proposals/CounterofferComparisonModal";
import ProposalBuilderModal from "./proposals/ProposalBuilderModal";
import EditProposalModal from "./proposals/EditProposalModal";

interface FreelancerProposalsViewProps {
  showToast: (msg: string) => void;
  onNavigateTab: (tab: string) => void;
}

export default function FreelancerProposalsView({
  showToast,
  onNavigateTab,
}: FreelancerProposalsViewProps) {
  // Proposals dataset state
  const [proposals, setProposals] = useState<FreelancerProposalItem[]>(
    INITIAL_FREELANCER_PROPOSALS
  );

  // Selected proposal ID defaults strictly to the very first proposal
  const [selectedProposalId, setSelectedProposalId] = useState<string>(
    INITIAL_FREELANCER_PROPOSALS[0].id
  );

  // Filters & Search
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [projectType, setProjectType] = useState<string>("ALL");
  const [budgetFilter, setBudgetFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("NEWEST");

  // Active tab in selected proposal panel
  const [activeTab, setActiveTab] = useState<ProposalDetailTab>("proposal");

  // Mobile navigation state
  const [mobileView, setMobileView] = useState<"directory" | "workspace">(
    "workspace"
  );

  // Modals
  const [showCounterofferModal, setShowCounterofferModal] = useState(false);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Dynamic Left/Right Sticky Tracking (Sticky according to shorter column)
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [shorterColumn, setShorterColumn] = useState<"left" | "right" | "none">("none");

  // Compute filtered & sorted proposals matching active controls
  const filteredProposals = useMemo(() => {
    return proposals
      .filter((p) => {
        // Status filter
        if (selectedStatus !== "ALL" && p.status !== selectedStatus) {
          return false;
        }

        // Project Type filter
        if (projectType !== "ALL" && p.offer.priceType !== projectType) {
          return false;
        }

        // Budget filter
        if (budgetFilter === "UNDER_50K") {
          if (
            p.clientBrief.budgetRange.includes("₹80,000") ||
            p.clientBrief.budgetRange.includes("₹1,20,000")
          ) {
            return false;
          }
        } else if (budgetFilter === "ABOVE_100K") {
          if (
            !p.clientBrief.budgetRange.includes("₹1,20,000") &&
            !p.clientBrief.budgetRange.includes("₹1,00,000")
          ) {
            return false;
          }
        }

        // Date filter
        if (dateFilter === "7_DAYS") {
          if (
            !p.submittedDate.includes("Oct 28") &&
            !p.submittedDate.includes("Oct 26") &&
            !p.submittedDate.includes("Oct 24")
          ) {
            return false;
          }
        } else if (dateFilter === "30_DAYS") {
          if (!p.submittedDate.includes("Oct")) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.projectTitle.toLowerCase().includes(q);
          const matchClient = p.client.companyName.toLowerCase().includes(q);
          const matchTags = p.techTags.some((t) => t.toLowerCase().includes(q));
          return matchTitle || matchClient || matchTags;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "OLDEST") {
          return a.submittedDate.localeCompare(b.submittedDate);
        }
        if (sortBy === "BUDGET_HIGH") {
          return b.clientBrief.budgetRange.localeCompare(a.clientBrief.budgetRange);
        }
        if (sortBy === "BUDGET_LOW") {
          return a.clientBrief.budgetRange.localeCompare(b.clientBrief.budgetRange);
        }
        // Default: NEWEST
        return b.submittedDate.localeCompare(a.submittedDate);
      });
  }, [
    proposals,
    selectedStatus,
    projectType,
    budgetFilter,
    dateFilter,
    searchQuery,
    sortBy,
  ]);

  // Selected proposal object - defaults strictly to 1st visible item
  const selectedProposal = useMemo(() => {
    const found = filteredProposals.find((p) => p.id === selectedProposalId);
    if (found) return found;
    return filteredProposals[0] || proposals[0] || INITIAL_FREELANCER_PROPOSALS[0];
  }, [filteredProposals, selectedProposalId, proposals]);

  // Selected proposal index for pagination within visible proposals
  const selectedIndex = useMemo(() => {
    return filteredProposals.findIndex((p) => p.id === selectedProposal.id);
  }, [filteredProposals, selectedProposal]);

  const handleSelectProposal = (id: string) => {
    setSelectedProposalId(id);
    setMobileView("workspace");
  };

  const handleNavigatePrev = () => {
    if (selectedIndex > 0) {
      setSelectedProposalId(filteredProposals[selectedIndex - 1].id);
    }
  };

  const handleNavigateNext = () => {
    if (selectedIndex < filteredProposals.length - 1) {
      setSelectedProposalId(filteredProposals[selectedIndex + 1].id);
    }
  };

  useEffect(() => {
    const checkHeights = () => {
      if (!leftPanelRef.current || !rightPanelRef.current) return;
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setShorterColumn("none");
        return;
      }
      const leftH = leftPanelRef.current.offsetHeight;
      const rightH = rightPanelRef.current.offsetHeight;

      // When there is a discernible difference in height (>= 30px)
      if (leftH + 30 < rightH) {
        setShorterColumn("left");
      } else if (rightH + 30 < leftH) {
        setShorterColumn("right");
      } else {
        setShorterColumn("none");
      }
    };

    checkHeights();

    const ro = new ResizeObserver(() => {
      checkHeights();
    });

    if (leftPanelRef.current) ro.observe(leftPanelRef.current);
    if (rightPanelRef.current) ro.observe(rightPanelRef.current);

    window.addEventListener("resize", checkHeights);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", checkHeights);
    };
  }, [
    filteredProposals,
    selectedProposalId,
    activeTab,
  ]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    return calculateProposalSummaryKPIs(proposals);
  }, [proposals]);

  // Counteroffer actions
  const handleAcceptCounteroffer = () => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== selectedProposal.id || !p.counteroffer) return p;
        return {
          ...p,
          status: "ACCEPTED",
          statusLabel: "Accepted",
          statusBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
          offer: {
            ...p.offer,
            priceDisplay: `${p.counteroffer.proposedPrice} (fixed)`,
            duration: p.counteroffer.proposedDuration,
          },
          counteroffer: undefined,
          activityTrail: [
            {
              id: `act-acc-${Date.now()}`,
              title: "Counteroffer Accepted by Freelancer",
              description: `Agreed to client's revised terms. Moving to agreement ratification.`,
              actor: "Sambit Mohanty (Freelancer)",
              timestamp: "Just now",
              type: "ACCEPTED",
            },
            ...p.activityTrail,
          ],
        };
      })
    );
    setShowCounterofferModal(false);
    showToast(
      "Counteroffer accepted! Moving to formal agreement drafting."
    );
  };

  const handleCounterProposal = (
    newPrice: string,
    newDuration: string,
    note: string
  ) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== selectedProposal.id) return p;
        return {
          ...p,
          status: "SUBMITTED",
          statusLabel: "Counterproposal Sent",
          statusBadgeColor: "bg-blue-50 text-blue-700 border-blue-200/80",
          offer: {
            ...p.offer,
            priceDisplay: newPrice,
            duration: newDuration,
          },
          counteroffer: undefined,
          activityTrail: [
            {
              id: `act-cnt-${Date.now()}`,
              title: "Counterproposal Sent to Client",
              description: `Submitted adjusted offer of ${newPrice} with note: "${note}"`,
              actor: "Sambit Mohanty (Freelancer)",
              timestamp: "Just now",
              type: "COUNTEROFFER",
            },
            ...p.activityTrail,
          ],
        };
      })
    );
    setShowCounterofferModal(false);
    showToast("Counterproposal submitted to client with updated terms.");
  };

  const handleDeclineCounteroffer = () => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== selectedProposal.id) return p;
        return {
          ...p,
          status: "WITHDRAWN",
          statusLabel: "Withdrawn",
          statusBadgeColor: "bg-slate-100 text-slate-600 border-slate-200",
          counteroffer: undefined,
          activityTrail: [
            {
              id: `act-dec-${Date.now()}`,
              title: "Counteroffer Declined",
              description: "Declined client counteroffer and withdrew proposal.",
              actor: "Sambit Mohanty (Freelancer)",
              timestamp: "Just now",
              type: "REJECTED",
            },
            ...p.activityTrail,
          ],
        };
      })
    );
    setShowCounterofferModal(false);
    showToast("Counteroffer declined. Proposal marked as Withdrawn.");
  };

  // Create new proposal
  const handleAddNewProposal = (newProposal: FreelancerProposalItem) => {
    setProposals((prev) => [newProposal, ...prev]);
    setSelectedProposalId(newProposal.id);
    setShowBuilderModal(false);
    showToast(`Proposal sent for "${newProposal.projectTitle}"!`);
  };

  // Edit proposal
  const handleSaveEditedProposal = (updated: FreelancerProposalItem) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setShowEditModal(false);
    showToast("Proposal terms updated successfully.");
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header with Title, Subtitle, and Two Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Proposals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your proposals, manage discussions and increase your chances of getting hired.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowBuilderModal(true)}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Proposal</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("find_projects")}
            className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Find More Projects</span>
          </button>
        </div>
      </div>

      {/* 2. Six Overview KPI Cards across top */}
      <ProposalSummaryCards
        kpis={kpis}
        selectedStatus={selectedStatus}
        onSelectStatus={(status) => setSelectedStatus(status)}
      />

      {/* 3. Two-Panel Layout with Dynamic Sticky */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Proposal Directory (5 cols on desktop) */}
        <div
          ref={leftPanelRef}
          className={`lg:col-span-5 space-y-4 ${
            shorterColumn === "left" ? "lg:sticky lg:self-start" : ""
          } ${mobileView === "workspace" ? "hidden lg:block" : "block"}`}
          style={
            shorterColumn === "left"
              ? { top: "min(1.5rem, calc(100vh - 100% - 1.5rem))" }
              : undefined
          }
        >
          <ProposalDirectory
            proposals={proposals}
            selectedProposalId={selectedProposal.id}
            onSelectProposal={handleSelectProposal}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            kpis={kpis}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            projectType={projectType}
            onProjectTypeChange={setProjectType}
            budgetFilter={budgetFilter}
            onBudgetFilterChange={setBudgetFilter}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Right Panel: Selected Proposal Workspace (7 cols on desktop) */}
        <div
          ref={rightPanelRef}
          className={`lg:col-span-7 space-y-4 ${
            shorterColumn === "right" ? "lg:sticky lg:self-start" : ""
          } ${mobileView === "directory" ? "hidden lg:block" : "block"}`}
          style={
            shorterColumn === "right"
              ? { top: "min(1.5rem, calc(100vh - 100% - 1.5rem))" }
              : undefined
          }
        >
          {/* Selected Proposal Header */}
          <SelectedProposalHeader
            proposal={selectedProposal}
            currentIndex={selectedIndex >= 0 ? selectedIndex : 0}
            totalCount={filteredProposals.length}
            onNavigatePrev={handleNavigatePrev}
            onNavigateNext={handleNavigateNext}
            onBackToDirectory={() => setMobileView("directory")}
            onViewProject={() => {
              setActiveTab("project_details");
            }}
          />

          {/* Proposal Tabs */}
          <ProposalTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            messagesCount={selectedProposal.messagesCount}
          />

          {/* Selected Tab Content */}
          <div className="pt-1">
            {activeTab === "proposal" && (
              <ProposalOfferTab
                proposal={selectedProposal}
                onEditProposal={() => setShowEditModal(true)}
                onReviewCounteroffer={() => setShowCounterofferModal(true)}
                onSendFollowUp={() => {
                  setActiveTab("messages");
                  showToast(
                    `Opened discussion thread for ${selectedProposal.client.companyName}.`
                  );
                }}
                showToast={showToast}
              />
            )}

            {activeTab === "project_details" && (
              <ProjectDetailsTab proposal={selectedProposal} />
            )}

            {activeTab === "client" && (
              <ClientProfileTab proposal={selectedProposal} />
            )}

            {activeTab === "messages" && (
              <ProposalMessagesTab
                proposal={selectedProposal}
                onOpenWorkspace={() => onNavigateTab("workspace")}
                showToast={showToast}
              />
            )}

            {activeTab === "activity" && (
              <ProposalActivityTab proposal={selectedProposal} />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCounterofferModal && selectedProposal.counteroffer && (
        <CounterofferComparisonModal
          proposal={selectedProposal}
          counteroffer={selectedProposal.counteroffer}
          onClose={() => setShowCounterofferModal(false)}
          onAccept={handleAcceptCounteroffer}
          onCounter={handleCounterProposal}
          onDecline={handleDeclineCounteroffer}
        />
      )}

      {showBuilderModal && (
        <ProposalBuilderModal
          onClose={() => setShowBuilderModal(false)}
          onSubmitNewProposal={handleAddNewProposal}
        />
      )}

      {showEditModal && (
        <EditProposalModal
          proposal={selectedProposal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEditedProposal}
        />
      )}
    </div>
  );
}
