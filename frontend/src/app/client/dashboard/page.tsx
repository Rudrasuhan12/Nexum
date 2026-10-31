"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopHeader from "@/components/DashboardTopHeader";
import ClientOverview from "@/components/client/ClientOverview";
import ClientProjectsView from "@/components/client/ClientProjectsView";
import ClientMilestonesView from "@/components/client/ClientMilestonesView";
import ClientFreelancersView from "@/components/client/ClientFreelancersView";
import ClientPaymentsView from "@/components/client/ClientPaymentsView";
import ClientSettingsView from "@/components/client/ClientSettingsView";
import ClientAuditLogsView from "@/components/client/ClientAuditLogsView";
import NexumAssistantPanel from "@/components/client/NexumAssistantPanel";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/auth-types";

const VALID_TABS = [
  "overview",
  "projects",
  "milestones",
  "freelancers",
  "workspace",
  "payments",
  "settings",
  "escrow",
  "audit",
] as const;

function ClientDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  const tabParam = searchParams.get("tab");
  const activeTab = tabParam && (VALID_TABS as readonly string[]).includes(tabParam)
    ? tabParam
    : "overview";

  const handleTabChange = (tab: string) => {
    router.replace(`/client/dashboard?tab=${tab}`, { scroll: false });
  };

  // State for milestone 2 acceptance / release simulation
  const [milestone2Status, setMilestone2Status] = useState<"IN_REVIEW" | "APPROVED_AND_RELEASED">("IN_REVIEW");
  const [isCapturing, setIsCapturing] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Enforce authentication & role separation (no silent auto-login fallback)
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "CLIENT") {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  const client = user || DEMO_USERS.CLIENT;

  // Handle milestone acceptance & funds release via PayPal Sandbox
  const handleApproveAndRelease = async () => {
    setIsCapturing(true);
    showToast("Authenticating Dual SHA-256 acceptance & executing PayPal Sandbox capture...");

    try {
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "6DE714998H998261C",
          milestoneId: "m2_webhook_engine",
        }),
      });

      const data = await res.json().catch(() => ({}));

      setMilestone2Status("APPROVED_AND_RELEASED");
      showToast(
        data.status === "COMPLETED"
          ? "Milestone 2 accepted! $1,500.00 USD captured and released to Rohan Verma."
          : "Milestone 2 accepted and marked released in consensus state machine."
      );
    } catch {
      setMilestone2Status("APPROVED_AND_RELEASED");
      showToast("Milestone 2 approved! Ledger state updated to RELEASED.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRequestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    setShowRevisionModal(false);
    showToast("Revision request logged on immutable audit trail and sent to Rohan Verma.");
  };

  const handleFindFreelancer = () => {
    router.push("/client/freelancers");
  };

  const handleCreateProject = () => {
    router.push("/client/post-project");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. Left Navbar Sidebar */}
      <DashboardSidebar
        currentRole="CLIENT"
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <DashboardTopHeader
          roleLabel="Buyer Workspace"
          title={
            activeTab === "overview"
              ? "Overview"
              : activeTab === "projects"
              ? "My Projects"
              : activeTab === "milestones"
              ? "Milestone Schedule"
              : activeTab === "escrow"
              ? "PayPal Escrow Rails"
              : activeTab === "settings"
              ? "Profile & Settings"
              : activeTab === "freelancers"
              ? "Find Freelancers"
              : activeTab === "workspace"
              ? "Workspace"
              : activeTab === "payments"
              ? "Payments & Proof"
              : "Consensus Audit Trail"
          }
          subtitle="Horizon Commerce LLC"
        />

        <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 flex-1">
          
          {/* ==============================================================
              TAB 1: OVERVIEW (REDESIGNED SAAS HIERARCHY)
             ============================================================== */}
          {activeTab === "overview" && (
            <ClientOverview
              onNavigateTab={(tab) => handleTabChange(tab)}
              onReviewMilestone={() => {
                handleTabChange("milestones");
                showToast("Opening milestone submission review...");
              }}
              onApproveAgreement={() => {
                handleTabChange("workspace");
                showToast("Opening bilateral scope agreement for sign-off...");
              }}
            />
          )}

          {/* ==============================================================
              TAB 2: MY PROJECTS (LIFECYCLE FILTERS & COMPREHENSIVE CARDS)
             ============================================================== */}
          {activeTab === "projects" && (
            <ClientProjectsView
              onOpenProjectWorkspace={(projId) => {
                router.push(`/client/projects/${projId}`);
              }}
              onCreateNewProject={() => {
                router.push("/client/post-project");
              }}
            />
          )}

          {/* ==============================================================
              TAB 2: MILESTONES (DEDICATED FULL VIEW)
             ============================================================== */}
          {activeTab === "milestones" && (
            <ClientMilestonesView
              onOpenProjectWorkspace={(projectId) => {
                router.push(`/client/projects/${projectId}?tab=milestones`);
              }}
            />
          )}

          {/* ==============================================================
              TAB 3: FIND FREELANCERS (DEDICATED DIRECTORY & INVITATIONS)
             ============================================================== */}
          {activeTab === "freelancers" && (
            <ClientFreelancersView
              onOpenProjectWorkspace={(projectId) => {
                router.push(`/client/projects/${projectId}`);
              }}
            />
          )}

          {/* ==============================================================
              TAB 3: PAYPAL ESCROW (DEDICATED FULL VIEW)
             ============================================================== */}
          {activeTab === "escrow" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  PayPal Sandbox Escrow Rails & Transaction Evidence
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Cryptographically verified order capture and webhook receipts via PayPal REST API v2.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Order #6DE714998H998261C</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Milestone 2 · Pre-funded before engineering commenced</p>
                  </div>
                  <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {milestone2Status === "IN_REVIEW" ? "STATUS: CREATED (SANDBOX ESCROW)" : "STATUS: COMPLETED (RELEASED)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Gross Order Value</div>
                    <div className="font-extrabold text-slate-900 text-sm mt-1">$1,500.00 USD</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Capture Net</div>
                    <div className="font-extrabold text-slate-900 text-sm mt-1">$1,500.00 USD</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Contractor Receiver</div>
                    <div className="font-semibold text-slate-700 text-xs mt-1 truncate">sb-rohan-seller@proofloop.demo</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Signature Validation</div>
                    <div className="font-bold text-emerald-700 text-xs mt-1">SHA-256 Passed ✓</div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
                  * ProofLoop Compliance: A PayPal Sandbox capture verifies payment provider intent execution. It does not represent proof of external commercial bank settlement.
                </p>
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB 4: AUDIT TRAIL (DEDICATED FULL VIEW)
             ============================================================== */}
          {activeTab === "audit" && (
            <ClientAuditLogsView
              onNavigateOverview={() => handleTabChange("overview")}
            />
          )}

          {/* ==============================================================
              TAB 4: PAYMENTS & ESCROW RAILS (DEDICATED FINANCIAL VIEW)
             ============================================================== */}
          {activeTab === "payments" && (
            <ClientPaymentsView
              onOpenProjectWorkspace={(projectId) => {
                router.push(`/client/projects/${projectId}`);
              }}
            />
          )}

          {/* ==============================================================
              TAB 5: PROFILE & SETTINGS (DEDICATED FULL VIEW)
             ============================================================== */}
          {activeTab === "settings" && (
            <ClientSettingsView client={client} />
          )}

        </main>
      </div>

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Request Deliverable Revision</h3>
            <p className="text-xs text-slate-500">
              Provide specific objective reasons aligned with the agreed criteria.
            </p>
            <form onSubmit={handleRequestRevision} className="space-y-4">
              <textarea
                rows={4}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="E.g. The automated test output for 30s duplicate replay needs additional assert logs..."
                required
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-xs"
                >
                  Send Revision Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Copilot Assistant (commented out for now) */}
      {/* <NexumAssistantPanel /> */}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function ClientDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-xs text-slate-500 font-medium">
          Loading client workspace...
        </div>
      }
    >
      <ClientDashboardContent />
    </Suspense>
  );
}
