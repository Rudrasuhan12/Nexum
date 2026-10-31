"use client";

import React, { useState, useMemo } from "react";
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

  // Aggregate KPIs
  const kpis = useMemo(() => {
    return calculateProposalSummaryKPIs(proposals);
  }, [proposals]);

  // Selected proposal object
  const selectedProposal = useMemo(() => {
    return (
      proposals.find((p) => p.id === selectedProposalId) ||
      proposals[0] ||
      INITIAL_FREELANCER_PROPOSALS[0]
    );
  }, [proposals, selectedProposalId]);

  // Selected proposal index for pagination
  const selectedIndex = useMemo(() => {
    return proposals.findIndex((p) => p.id === selectedProposal.id);
  }, [proposals, selectedProposal]);

  const handleSelectProposal = (id: string) => {
    setSelectedProposalId(id);
    setMobileView("workspace");
  };

  const handleNavigatePrev = () => {
    if (selectedIndex > 0) {
      setSelectedProposalId(proposals[selectedIndex - 1].id);
    }
  };

  const handleNavigateNext = () => {
    if (selectedIndex < proposals.length - 1) {
      setSelectedProposalId(proposals[selectedIndex + 1].id);
    }
  };

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

      {/* 3. Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Proposal Directory (5 cols on desktop) */}
        <div
          className={`lg:col-span-5 space-y-4 ${
            mobileView === "workspace" ? "hidden lg:block" : "block"
          }`}
        >
          <ProposalDirectory
            proposals={proposals}
            selectedProposalId={selectedProposalId}
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
          className={`lg:col-span-7 space-y-4 ${
            mobileView === "directory" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Selected Proposal Header */}
          <SelectedProposalHeader
            proposal={selectedProposal}
            currentIndex={selectedIndex >= 0 ? selectedIndex : 0}
            totalCount={proposals.length}
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
