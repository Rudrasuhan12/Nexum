"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopHeader from "@/components/DashboardTopHeader";
import FreelancerOverviewView from "@/components/freelancer/FreelancerOverviewView";
import FreelancerFindProjectsView from "@/components/freelancer/FreelancerFindProjectsView";
import FreelancerProfileView from "@/components/freelancer/FreelancerProfileView";
import FreelancerWorkspaceView from "@/components/freelancer/FreelancerWorkspaceView";
import FreelancerProposalsView from "@/components/freelancer/FreelancerProposalsView";
import FreelancerProjectsMilestonesView from "@/components/freelancer/FreelancerProjectsMilestonesView";
import FreelancerEarningsPaymentsView from "@/components/freelancer/FreelancerEarningsPaymentsView";
import FreelancerSettingsView from "@/components/freelancer/FreelancerSettingsView";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/auth-types";
import { Send, FileCode, FileText, Upload, Paperclip, Trash2, CheckCircle2, Clock, Calendar, DollarSign, Plus, X } from "lucide-react";
import { createDraftProposal, updateDraftProposal, submitProposal, uploadProposalAttachment } from "@/lib/api-client";

const VALID_TABS = [
  "dashboard",
  "overview",
  "find_projects",
  "profile",
  "workspace",
  "proposals",
  "projects",
  "milestones",
  "earnings",
  "payments",
  "settings",
] as const;

function FreelancerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  const tabParam = searchParams.get("tab");
  const activeTab = tabParam && (VALID_TABS as readonly string[]).includes(tabParam)
    ? tabParam
    : "overview";

  const handleTabChange = (tab: string) => {
    if (tab === "workspace") {
      router.push("/freelancer/workspace");
      return;
    }
    router.replace(`/freelancer/dashboard?tab=${tab}`, { scroll: false });
  };

  // Deliverable submission state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [modalPrUrl, setModalPrUrl] = useState("https://github.com/proofloop/gateway/pull/42");
  const [modalLoomUrl, setModalLoomUrl] = useState("https://www.loom.com/share/proofloop-milestone2-demo");
  const [modalNotes, setModalNotes] = useState(
    "All test criteria met: PayPal REST v2 order capture verified, SHA-256 signature validation passing with mock payloads, idempotency cache deduplicates within 30s window."
  );

  // Proposal modal state
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [proposalTargetProject, setProposalTargetProject] = useState<{
    id?: string;
    title: string;
    budget: string;
    budgetAmount?: number;
    company: string;
  } | null>(null);
  const [proposalScope, setProposalScope] = useState("");
  const [proposalQuote, setProposalQuote] = useState("");
  const [proposalDurationWeeks, setProposalDurationWeeks] = useState(4);
  const [proposalMilestones, setProposalMilestones] = useState<Array<{ title: string; days: number; amount: string }>>([
    { title: "Milestone 1: Core Architecture & Setup", days: 14, amount: "2000" },
    { title: "Milestone 2: Feature Implementation & APIs", days: 21, amount: "2500" },
    { title: "Milestone 3: Verification, Testing & Final Delivery", days: 14, amount: "1500" },
  ]);
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [appliedProjectIds, setAppliedProjectIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Enforce authentication & role separation
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "FREELANCER")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const freelancer = user || DEMO_USERS.FREELANCER_A;
  const client = DEMO_USERS.CLIENT;

  const handleModalSubmitDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSubmitModal(false);
    showToast("Deliverable submission updated & recorded to consensus ledger.");
  };

  const handleApplyProjectFromFind = (project: { id?: string; title: string; budget: string; budgetAmount?: number; clientCompany: string }) => {
    const rawBudget = project.budgetAmount || parseFloat(project.budget.replace(/[^0-9.]/g, "")) || 6000;
    setProposalTargetProject({
      id: project.id,
      title: project.title,
      budget: project.budget,
      budgetAmount: rawBudget,
      company: project.clientCompany,
    });
    setProposalQuote(rawBudget > 0 ? `$${rawBudget.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : project.budget);
    setProposalScope(
      "I have thoroughly reviewed your project requirements and technical specifications. I am ready to implement the complete scope adhering strictly to the documented milestones, automated verification, and code quality benchmarks."
    );
    const m1 = Math.round(rawBudget * 0.35);
    const m2 = Math.round(rawBudget * 0.40);
    const m3 = Math.max(0, rawBudget - m1 - m2);
    setProposalMilestones([
      { title: "Milestone 1: Architecture & Data Ingestion Setup", days: 14, amount: String(m1) },
      { title: "Milestone 2: Core Processing, Workflows & APIs", days: 21, amount: String(m2) },
      { title: "Milestone 3: UI Dashboard, Verification & Final Delivery", days: 14, amount: String(m3) },
    ]);
    setProposalDurationWeeks(7);
    setProposalFile(null);
    setShowProposalModal(true);
  };

  const handleAddMilestone = () => {
    setProposalMilestones((prev) => [
      ...prev,
      { title: `Milestone ${prev.length + 1}: Additional Scope`, days: 14, amount: "1000" },
    ]);
  };

  const handleRemoveMilestone = (idx: number) => {
    setProposalMilestones((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateMilestone = (idx: number, field: "title" | "days" | "amount", val: any) => {
    setProposalMilestones((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: val } : m))
    );
  };

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTargetProject?.id) {
      showToast("Error: No target project selected.");
      return;
    }

    try {
      setIsSendingProposal(true);
      const cleanPrice = parseFloat(proposalQuote.replace(/[^0-9.]/g, "")) || 0;
      const priceMinor = Math.round(cleanPrice * 100);

      // Validate milestone sum
      const milestoneSum = proposalMilestones.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
      if (Math.abs(milestoneSum - cleanPrice) > 1) {
        showToast(`Milestone amounts sum ($${milestoneSum.toLocaleString()}) must match total quote ($${cleanPrice.toLocaleString()}).`);
        setIsSendingProposal(false);
        return;
      }

      // 1. Create draft proposal in database
      const draftRes = await createDraftProposal(proposalTargetProject.id);
      if (!draftRes.success || !draftRes.proposal) {
        showToast(draftRes.error || "Failed to create draft proposal.");
        return;
      }

      const proposalId = draftRes.proposal.id;

      // 2. Upload proposal document to Object Storage if attached
      if (proposalFile) {
        const uploadRes = await uploadProposalAttachment(proposalId, proposalFile);
        if (!uploadRes.success) {
          console.warn("[Proposal] File upload warning:", uploadRes.error);
        }
      }

      // 3. Format milestones
      const formattedMilestones = proposalMilestones.map((m, idx) => ({
        title: m.title || `Milestone ${idx + 1}`,
        amountMinor: Math.round((parseFloat(m.amount) || 0) * 100),
        durationWeeks: Math.max(1, Math.round(m.days / 7)),
        criteria: ["Agreed milestone deliverable scope", "Automated verification pass"],
      }));

      // 4. Persist proposal scope, milestones, and pricing
      const updateRes = await updateDraftProposal(proposalId, {
        totalAmountMinor: priceMinor,
        paymentModel: "FIXED_PRICE",
        coverLetter: proposalScope.trim(),
        scopeText: proposalScope.trim(),
        estimatedDurationWeeks: proposalDurationWeeks,
        milestones: formattedMilestones,
      });

      if (!updateRes.success) {
        showToast(updateRes.error || "Failed to update proposal details.");
        return;
      }

      // 5. Formally submit proposal to client
      const submitRes = await submitProposal(proposalId);
      if (!submitRes.success) {
        showToast(submitRes.error || "Failed to submit proposal to client.");
        return;
      }

      // 6. Only now mark as applied!
      setAppliedProjectIds((prev) => Array.from(new Set([...prev, proposalTargetProject.id!])));
      setShowProposalModal(false);
      showToast(`Proposal of ${proposalQuote} with attached specification submitted to ${proposalTargetProject.company || "Client"}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send proposal";
      showToast(msg);
    } finally {
      setIsSendingProposal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. Left Navbar Sidebar */}
      <DashboardSidebar
        currentRole="FREELANCER"
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <DashboardTopHeader
          roleLabel="Freelancer Workspace"
          title={
            activeTab === "overview" || activeTab === "dashboard"
              ? "Overview"
              : activeTab === "find_projects"
              ? "Find Projects"
              : activeTab === "profile"
              ? "My Profile & Portfolio"
              : activeTab === "workspace"
              ? "Freelancer Workspace"
              : activeTab === "proposals"
              ? "My Proposals"
              : activeTab === "projects" || activeTab === "milestones"
              ? "My Projects"
              : activeTab === "earnings" || activeTab === "payments"
              ? "Earnings & Payments"
              : "Settings"
          }
          subtitle={
            activeTab === "dashboard" || activeTab === "overview"
              ? "Earnings, active contracts, and priority opportunities"
              : activeTab === "find_projects"
              ? "Browse verified client briefs with pre-funded escrow"
              : activeTab === "profile"
              ? "Professional bio, skills, rates, and parsed resume"
              : activeTab === "workspace"
              ? "Active collaboration, code delivery, and bilateral mediation"
              : activeTab === "proposals"
              ? "Track your proposals, manage discussions and increase your chances of getting hired."
              : activeTab === "projects" || activeTab === "milestones"
              ? "Manage your active projects, track milestones, communicate with clients and deliver successfully."
              : activeTab === "earnings" || activeTab === "payments"
              ? "Track your earnings, manage payouts, and view transaction history."
              : "Manage your account, preferences and platform settings."
          }
          placeholder="Search projects, proposals, contracts, client messages..."
          onHelpClick={() => showToast("Opening Freelancer Escrow & Mediation Guide...")}
        />

        <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 flex-1">
          {/* TAB 1: DASHBOARD / OVERVIEW */}
          {(activeTab === "dashboard" || activeTab === "overview") && (
            <FreelancerOverviewView
              freelancer={freelancer}
              client={client}
              onNavigateTab={handleTabChange}
              onSubmitDeliverableClick={() => setShowSubmitModal(true)}
              onReviewLeadClick={() => {
                handleTabChange("find_projects");
              }}
            />
          )}

          {/* TAB 2: FIND PROJECTS */}
          {activeTab === "find_projects" && (
            <FreelancerFindProjectsView
              onApplyProject={handleApplyProjectFromFind}
              showToast={showToast}
              appliedProjectIds={appliedProjectIds}
            />
          )}

          {/* TAB 3: MY PROFILE & PORTFOLIO */}
          {activeTab === "profile" && (
            <FreelancerProfileView
              freelancer={freelancer}
              showToast={showToast}
            />
          )}

          {/* TAB 4: WORKSPACE */}
          {activeTab === "workspace" && (
            <FreelancerWorkspaceView
              freelancer={freelancer}
              client={client}
              showToast={showToast}
            />
          )}

          {/* TAB 5: PROPOSALS */}
          {activeTab === "proposals" && (
            <FreelancerProposalsView
              showToast={showToast}
              onNavigateTab={handleTabChange}
            />
          )}

          {/* TAB 6: MY PROJECTS & MILESTONES */}
          {(activeTab === "projects" || activeTab === "milestones") && (
            <FreelancerProjectsMilestonesView
              onSubmitDeliverableClick={() => setShowSubmitModal(true)}
              onNavigateTab={handleTabChange}
              showToast={showToast}
            />
          )}

          {/* TAB 7: EARNINGS & PAYMENTS */}
          {(activeTab === "earnings" || activeTab === "payments") && (
            <FreelancerEarningsPaymentsView
              showToast={showToast}
            />
          )}

          {/* TAB 8: SETTINGS */}
          {activeTab === "settings" && (
            <FreelancerSettingsView
              freelancer={freelancer}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Submit / Update Deliverables Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Update Deliverables: Milestone 2
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contract with Alex Rivera (Horizon Commerce LLC)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmitDeliverable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  GitHub Pull Request URL
                </label>
                <div className="relative">
                  <FileCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={modalPrUrl}
                    onChange={(e) => setModalPrUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Loom Demo Video Walkthrough
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={modalLoomUrl}
                    onChange={(e) => setModalLoomUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Deliverable</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Proposal Modal */}
      {showProposalModal && proposalTargetProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Submit Proposal</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified Intake
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {proposalTargetProject.title} · {proposalTargetProject.company}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendProposal} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Your Fixed Price Quote ($ USD)</span>
                  </label>
                  <input
                    type="text"
                    value={proposalQuote}
                    onChange={(e) => setProposalQuote(e.target.value)}
                    placeholder="$6,000.00"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Estimated Duration</span>
                  </label>
                  <select
                    value={proposalDurationWeeks}
                    onChange={(e) => setProposalDurationWeeks(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value={2}>2 weeks (Sprint)</option>
                    <option value={4}>4 weeks (1 month)</option>
                    <option value={6}>6 weeks (1.5 months)</option>
                    <option value={8}>8 weeks (2 months)</option>
                    <option value={12}>12 weeks (3 months)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cover Letter & Technical Approach
                </label>
                <textarea
                  rows={3}
                  value={proposalScope}
                  onChange={(e) => setProposalScope(e.target.value)}
                  placeholder="Outline your technical approach, implementation methodology, and past relevant experience..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-sans text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Milestone Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Milestone Breakdown & Payment Checkpoints</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {proposalMilestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs"
                    >
                      <span className="font-bold text-slate-400 w-5 shrink-0 text-center font-mono">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => handleUpdateMilestone(idx, "title", e.target.value)}
                        placeholder="Milestone title..."
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                      <div className="w-20 shrink-0">
                        <input
                          type="number"
                          value={m.days}
                          onChange={(e) => handleUpdateMilestone(idx, "days", Number(e.target.value))}
                          placeholder="Days"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center focus:outline-none focus:border-indigo-500"
                          title="Days to complete"
                        />
                      </div>
                      <div className="w-24 shrink-0 relative">
                        <span className="absolute left-2 top-1.5 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          value={m.amount}
                          onChange={(e) => handleUpdateMilestone(idx, "amount", e.target.value)}
                          placeholder="Amount"
                          className="w-full pl-5 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      {proposalMilestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Remove milestone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposal Document Upload (Object Storage) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Attach Proposal Document (PDF, DOCX, Deck)</span>
                </label>

                {proposalFile ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {proposalFile.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {proposalFile.size > 1024 * 1024
                            ? `${(proposalFile.size / (1024 * 1024)).toFixed(1)} MB`
                            : `${Math.round(proposalFile.size / 1024)} KB`}{" "}
                          · Stored in Object Storage
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProposalFile(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer transition text-center">
                    <Upload className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Click to upload technical proposal document
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PDF, DOCX, PNG, JPG up to 10MB · Automatically stored in Object Storage for client review
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setProposalFile(f);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProposalModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingProposal}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingProposal ? "Submitting Proposal..." : "Send Proposal to Client"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function FreelancerDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400">Loading Freelancer Dashboard...</div>}>
      <FreelancerDashboardContent />
    </Suspense>
  );
}
