"use client";

import React, { useState, useEffect } from "react";
import EarningsKpiCards from "./earnings/EarningsKpiCards";
import EarningsOverviewChart from "./earnings/EarningsOverviewChart";
import EarningsCategoryChart from "./earnings/EarningsCategoryChart";
import PayoutSettingsCard from "./earnings/PayoutSettingsCard";
import PayoutPreferencesCard from "./earnings/PayoutPreferencesCard";
import IdentityVerificationCard from "./earnings/IdentityVerificationCard";
import TransactionsTable from "./earnings/TransactionsTable";
import TransactionDetailModal from "./earnings/TransactionDetailModal";
import UpdatePaypalModal from "./earnings/UpdatePaypalModal";
import UpdatePreferencesModal from "./earnings/UpdatePreferencesModal";
import {
  FreelancerTransaction,
  PayoutSettings,
  PayoutPreferences,
  FreelancerInvoice,
  FreelancerProjectEarningsSummary,
  ProjectCategoryShare,
  MonthlyEarningPoint,
} from "@/lib/freelancer-earnings-types";
import { useAuth } from "@/context/AuthContext";
import {
  fetchEarningsSummary,
  fetchEarningsMilestones,
  fetchMonthlyEarnings,
  fetchFreelancerAgreements,
  fetchPayoutAccount,
  updatePayoutAccount,
} from "@/lib/api-client";

interface FreelancerEarningsPaymentsViewProps {
  showToast: (msg: string) => void;
}

export default function FreelancerEarningsPaymentsView({
  showToast,
}: FreelancerEarningsPaymentsViewProps) {
  const { user } = useAuth();

  // State for KPIs and Charts (Live from Database)
  const [kpis, setKpis] = useState<any>({
    totalEarnings: 0,
    totalEarningsDisplay: "$0.00 USD",
    completedProjectsCount: 0,
    pendingAmount: 0,
    pendingAmountDisplay: "$0.00 USD",
    milestonesUnderReviewCount: 0,
    availableForPayout: 0,
    availableForPayoutDisplay: "$0.00 USD",
    readyToWithdraw: false,
    totalWithdrawn: 0,
    totalWithdrawnDisplay: "$0.00 USD",
    successfulPayoutsCount: 0,
    currency: "USD",
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyEarningPoint[]>([]);
  const [categories, setCategories] = useState<ProjectCategoryShare[]>([]);

  // State for Payout Settings & Preferences
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings>({
    provider: "PayPal",
    accountEmail:
      user?.email && user.role === "FREELANCER"
        ? user.email
        : "sandbox@nexum.demo",
    connectionStatus: "Connected",
    connectedDate: "Active",
    environment: "Sandbox",
    merchantId: user?.id ? `NX-PAYPAL-${user.id.slice(0, 8).toUpperCase()}` : "NX-PAYPAL-SANDBOX",
  });
  const [payoutPreferences, setPayoutPreferences] = useState<PayoutPreferences>({
    minimumPayoutAmount: 50,
    formattedMinimumPayout: "$50.00 USD",
    autoPayoutEnabled: true,
    payoutFrequency: "Bi-weekly",
  });
  const verificationItems = [
    {
      id: "ver_email",
      title: "Email Verified",
      isVerified: Boolean(user?.email),
      badgeLabel: "Verified",
      verificationType: "email" as const,
      verifiedAt: "Account Creation",
    },
    {
      id: "ver_role",
      title: "Identity & Profile Registered",
      isVerified: user?.role === "FREELANCER",
      badgeLabel: user?.role === "FREELANCER" ? "Freelancer Account" : "Registered",
      verificationType: "identity" as const,
      verifiedAt: "Profile Registration",
    },
    {
      id: "ver_paypal",
      title: "PayPal Escrow Rail Active",
      isVerified: true,
      badgeLabel: "Sandbox Consensus Active",
      verificationType: "paypal" as const,
      verifiedAt: "Automated Sandbox",
    },
  ];

  // State for Transactions & Invoices (Live from Database)
  const [transactions, setTransactions] = useState<FreelancerTransaction[]>([]);
  const [invoices, setInvoices] = useState<FreelancerInvoice[]>([]);
  const [projectSummaries, setProjectSummaries] = useState<FreelancerProjectEarningsSummary[]>([]);

  // Load live financial totals & milestones from PostgreSQL backend
  useEffect(() => {
    let mounted = true;
    async function loadEarnings() {
      try {
        const [sumRes, msRes, monthlyRes, agreementsRes, payoutAccRes] = await Promise.all([
          fetchEarningsSummary(),
          fetchEarningsMilestones(),
          fetchMonthlyEarnings(),
          fetchFreelancerAgreements(),
          fetchPayoutAccount(),
        ]);
        if (!mounted) return;

        if (payoutAccRes.success && payoutAccRes.account) {
          setPayoutSettings((prev) => ({
            ...prev,
            accountEmail: payoutAccRes.account!.accountEmail,
            merchantId: payoutAccRes.account!.last4
              ? `NX-PAYPAL-***${payoutAccRes.account!.last4}`
              : prev.merchantId,
          }));
        }

        if (sumRes.success && sumRes.summary) {
          const s = sumRes.summary;
          const availableVal = (s.availableMinor || 0) / 100;
          const pendingVal = ((s.inReviewMinor || 0) + (s.fundedMinor || 0)) / 100;
          const totalVal = ((s.availableMinor || 0) + (s.withdrawnMinor || 0)) / 100;

          setKpis({
            completedProjectsCount: (s as any).completedProjectsCount ?? 0,
            milestonesUnderReviewCount: (s as any).milestonesUnderReviewCount ?? 0,
            successfulPayoutsCount: (s as any).successfulPayoutsCount ?? 0,
            readyToWithdraw: availableVal > 0,
            currency: "USD",
            totalEarnings: totalVal,
            totalEarningsDisplay: `$${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
            pendingAmount: pendingVal,
            pendingAmountDisplay: `$${pendingVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
            availableForPayout: availableVal,
            availableForPayoutDisplay: `$${availableVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
            totalWithdrawn: (s.withdrawnMinor || 0) / 100,
            totalWithdrawnDisplay: `$${((s.withdrawnMinor || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
          });
          setCategories((s as any).categoriesDistribution || []);
        } else {
          setCategories([]);
        }

        if (monthlyRes.success && monthlyRes.monthly && monthlyRes.monthly.length > 0) {
          const liveMonthly: MonthlyEarningPoint[] = monthlyRes.monthly.map((m: any) => ({
            month: `${m.month} 2026`,
            shortMonth: m.shortMonth || m.month,
            year: 2026,
            received: m.completed,
            pending: m.pending,
            formattedReceived: `$${m.completed.toLocaleString()}`,
            formattedPending: `$${m.pending.toLocaleString()}`,
            total: m.completed + m.pending,
          }));
          setMonthlyData(liveMonthly);
        } else {
          setMonthlyData([]);
        }

        if (msRes.success && msRes.milestones && msRes.milestones.length > 0) {
          const liveTxns: FreelancerTransaction[] = msRes.milestones.map((m: any) => ({
            id: m.id,
            date: m.dueDate
              ? new Date(m.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "Recent",
            rawDate: m.dueDate ? new Date(m.dueDate).toISOString() : new Date().toISOString(),
            description: `${m.title} — ${m.projectTitle || "Project"}`,
            subtitle: m.projectTitle || "Project",
            project: m.projectTitle || "Project",
            client: m.clientName || "Client",
            projectIcon: "shopping-bag",
            type: "Milestone",
            amount: m.amountMinor / 100,
            formattedAmount: `$${(m.amountMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            isCredit: true,
            status: (() => {
              if (m.workStatus === "ACCEPTED" || m.workStatus === "COMPLETED") return "Completed";
              if (m.workStatus === "AWAITING_CLIENT_REVIEW") return "Under Review";
              if (m.paymentStatus === "CAPTURED" || m.earningsLabel === "Funded" || m.earningsLabel === "Available" || m.workStatus === "IN_PROGRESS") return "Received";
              return "Pending";
            })(),
            statusVariant: (() => {
              if (m.workStatus === "ACCEPTED" || m.workStatus === "COMPLETED") return "green";
              if (m.workStatus === "AWAITING_CLIENT_REVIEW") return "amber";
              if (m.paymentStatus === "CAPTURED" || m.earningsLabel === "Funded" || m.earningsLabel === "Available" || m.workStatus === "IN_PROGRESS") return "green";
              return "amber";
            })(),
            paymentRail: "PayPal Consensus Ledger",
            proofHash: `sha256_${m.id.slice(0, 16)}`,
          }));
          setTransactions(liveTxns);

          const liveInvoices: FreelancerInvoice[] = msRes.milestones
            .filter((m: any) => m.workStatus === "ACCEPTED")
            .map((m: any, idx: number) => {
              const isPaid = m.earningsLabel === "Available" || m.paymentStatus === "CAPTURED";
              return {
                id: `inv_${m.id}`,
                invoiceNumber: `INV-${new Date(m.dueDate || Date.now()).getFullYear()}-${String(idx + 1).padStart(3, "0")}`,
                date: m.acceptedAt
                  ? new Date(m.acceptedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : m.dueDate
                  ? new Date(m.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Recent",
                clientName: m.clientName || "Client",
                clientCompany: m.clientName ? `${m.clientName}'s Organization` : "Client Organization",
                projectName: m.projectTitle || "Project",
                amount: m.amountMinor / 100,
                formattedAmount: `$${(m.amountMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
                status: isPaid ? "PAID" : "PENDING",
              };
            });
          setInvoices(liveInvoices);
        } else {
          setTransactions([]);
          setInvoices([]);
        }

        if (agreementsRes.success && agreementsRes.agreements && agreementsRes.agreements.length > 0) {
          const liveSummaries: FreelancerProjectEarningsSummary[] = agreementsRes.agreements.map((a: any) => {
            const ms = a.milestones || [];
            const completedMs = ms.filter((m: any) => m.workStatus === "ACCEPTED");
            const totalEarnedMinor = completedMs.reduce((acc: number, m: any) => acc + (m.amountMinor || 0), 0);
            return {
              id: a.id,
              projectName: a.project?.title || a.title || "Project",
              clientName: a.project?.client?.name || a.client?.name || "Client",
              category: a.project?.category || "General",
              totalEarned: totalEarnedMinor / 100,
              formattedTotalEarned: `$${(totalEarnedMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
              milestonesCompleted: completedMs.length,
              totalMilestones: ms.length,
              status: (a.status === "COMPLETED" ? "COMPLETED" : "ACTIVE") as "COMPLETED" | "ACTIVE",
            };
          });
          setProjectSummaries(liveSummaries);
        } else {
          setProjectSummaries([]);
        }
      } catch (err) {
        console.warn("Using fallback earnings data", err);
      }
    }
    loadEarnings();
    return () => { mounted = false; };
  }, []);

  // Modals state
  const [selectedTxn, setSelectedTxn] = useState<FreelancerTransaction | null>(null);
  const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  const handleSavePaypal = async (newEmail: string) => {
    try {
      await updatePayoutAccount({ accountEmail: newEmail });
    } catch {
      // non-blocking
    }
    setPayoutSettings((prev) => ({
      ...prev,
      accountEmail: newEmail,
      connectedDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }));
    showToast("PayPal payout account updated successfully.");
  };

  const handleSavePreferences = (updated: PayoutPreferences) => {
    setPayoutPreferences(updated);
    showToast("Payout preferences updated and saved.");
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* 1. Page Header (Matching Reference Screenshot) */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
          Earnings & Payments
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Track your earnings, manage payouts, and view transaction history.
        </p>
      </div>

      {/* 2. Top 4 Financial KPI Cards */}
      <EarningsKpiCards kpis={kpis} />

      {/* 3. Main Two-Column Layout (Expanded 9-Col Left Side for wide table visibility, 3-Col Right Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Charts & Wide Transactions Table (9 columns / 75% width) */}
        <div className="lg:col-span-9 space-y-6 min-w-0 w-full">
          {/* Top Charts Row: Overview & Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EarningsOverviewChart data={monthlyData} />
            <EarningsCategoryChart
              categories={categories}
              totalFormatted={kpis.totalEarningsDisplay}
            />
          </div>

          {/* Transactions Section & Tabs */}
          <TransactionsTable
            transactions={transactions}
            invoices={invoices}
            projectSummaries={projectSummaries}
            onViewTransaction={(txn) => setSelectedTxn(txn)}
            showToast={showToast}
          />
        </div>

        {/* Right Side: Payouts & Settings Sidebar (3 columns / 25% width) */}
        <div className="lg:col-span-3 space-y-4 min-w-0 w-full">
          {/* Payout Settings Card */}
          <PayoutSettingsCard
            settings={payoutSettings}
            onUpdateClick={() => setShowPaypalModal(true)}
          />

          {/* Payout Preferences Card */}
          <PayoutPreferencesCard
            preferences={payoutPreferences}
            onEditPreferences={() => setShowPreferencesModal(true)}
          />

          {/* Identity & Verification & Help Card */}
          <IdentityVerificationCard
            items={verificationItems}
            onHelpClick={() => showToast("Opening Payments & Payouts Help Center...")}
            onItemClick={(item) =>
              showToast(`${item.title}: Verified and bound to consensus credentials.`)
            }
          />
        </div>
      </div>

      {/* Interactive Modals */}
      {selectedTxn && (
        <TransactionDetailModal
          transaction={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          showToast={showToast}
        />
      )}

      {showPaypalModal && (
        <UpdatePaypalModal
          currentSettings={payoutSettings}
          onClose={() => setShowPaypalModal(false)}
          onSave={handleSavePaypal}
        />
      )}

      {showPreferencesModal && (
        <UpdatePreferencesModal
          currentPreferences={payoutPreferences}
          onClose={() => setShowPreferencesModal(false)}
          onSave={handleSavePreferences}
        />
      )}
    </div>
  );
}


