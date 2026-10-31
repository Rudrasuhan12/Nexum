"use client";

import React, { useState } from "react";
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
  INITIAL_FREELANCER_KPIS,
  MONTHLY_EARNINGS_SERIES,
  PROJECT_CATEGORY_DISTRIBUTION,
  INITIAL_PAYOUT_SETTINGS,
  INITIAL_PAYOUT_PREFERENCES,
  VERIFICATION_CHECKLIST,
  INITIAL_FREELANCER_TRANSACTIONS,
  INITIAL_FREELANCER_INVOICES,
  INITIAL_PROJECT_SUMMARIES,
} from "@/lib/freelancer-earnings-data";
import {
  FreelancerTransaction,
  PayoutSettings,
  PayoutPreferences,
} from "@/lib/freelancer-earnings-types";
import { useAuth } from "@/context/AuthContext";

interface FreelancerEarningsPaymentsViewProps {
  showToast: (msg: string) => void;
}

export default function FreelancerEarningsPaymentsView({
  showToast,
}: FreelancerEarningsPaymentsViewProps) {
  const { user } = useAuth();

  // State for KPIs and Charts
  const [kpis] = useState(INITIAL_FREELANCER_KPIS);
  const [monthlyData] = useState(MONTHLY_EARNINGS_SERIES);
  const [categories] = useState(PROJECT_CATEGORY_DISTRIBUTION);

  // State for Payout Settings & Preferences
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings>({
    ...INITIAL_PAYOUT_SETTINGS,
    accountEmail:
      user?.email && user.role === "FREELANCER"
        ? user.email
        : INITIAL_PAYOUT_SETTINGS.accountEmail,
  });
  const [payoutPreferences, setPayoutPreferences] = useState<PayoutPreferences>(
    INITIAL_PAYOUT_PREFERENCES
  );
  const [verificationItems] = useState(VERIFICATION_CHECKLIST);

  // State for Transactions & Invoices
  const [transactions] = useState<FreelancerTransaction[]>(
    INITIAL_FREELANCER_TRANSACTIONS
  );
  const [invoices] = useState(INITIAL_FREELANCER_INVOICES);
  const [projectSummaries] = useState(INITIAL_PROJECT_SUMMARIES);

  // Modals state
  const [selectedTxn, setSelectedTxn] = useState<FreelancerTransaction | null>(null);
  const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  const handleSavePaypal = (newEmail: string) => {
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
