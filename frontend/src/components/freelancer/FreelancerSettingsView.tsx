"use client";

import React, { useState } from "react";
import SettingsNavigation from "./settings/SettingsNavigation";
import SecuritySummaryCard from "./settings/SecuritySummaryCard";
import QuickActionsCard from "./settings/QuickActionsCard";
import HelpSupportCard from "./settings/HelpSupportCard";
import AccountSecuritySection from "./settings/AccountSecuritySection";
import SavedProjectsSection from "./settings/SavedProjectsSection";
import NotificationSettingsSection from "./settings/NotificationSettingsSection";
import AvailabilitySection from "./settings/AvailabilitySection";
import PaymentSettingsSection from "./settings/PaymentSettingsSection";
import NexumAIPreferencesSection from "./settings/NexumAIPreferencesSection";
import ConnectedAccountsSection from "./settings/ConnectedAccountsSection";
import PrivacyDataSection from "./settings/PrivacyDataSection";
import AppearanceLanguageSection from "./settings/AppearanceLanguageSection";
import HelpSupportSection from "./settings/HelpSupportSection";
import DeleteAccountSection from "./settings/DeleteAccountSection";

import ChangeEmailModal from "./settings/ChangeEmailModal";
import ChangePhoneModal from "./settings/ChangePhoneModal";
import ChangePasswordModal from "./settings/ChangePasswordModal";
import Configure2FAModal from "./settings/Configure2FAModal";
import DeactivateAccountModal from "./settings/DeactivateAccountModal";

import { SettingsSectionKey } from "@/lib/freelancer-settings-types";
import {
  INITIAL_ACCOUNT_INFO,
  INITIAL_ACTIVE_SESSIONS,
} from "@/lib/freelancer-settings-data";
import { DemoUser } from "@/lib/auth-types";
import { useRouter } from "next/navigation";

interface FreelancerSettingsViewProps {
  freelancer: DemoUser;
  showToast: (msg: string) => void;
}

export default function FreelancerSettingsView({
  freelancer,
  showToast,
}: FreelancerSettingsViewProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>("account");

  // Account State
  const [email, setEmail] = useState(
    freelancer.email || INITIAL_ACCOUNT_INFO.email
  );
  const [phone, setPhone] = useState(INITIAL_ACCOUNT_INFO.phone);
  const [passwordLastChanged, setPasswordLastChanged] = useState(
    INITIAL_ACCOUNT_INFO.passwordLastChanged
  );
  const [sessions, setSessions] = useState(INITIAL_ACTIVE_SESSIONS);

  // Modals state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const handleSignOutAllSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    showToast("Signed out of all other remote device sessions.");
  };

  const handleDownloadData = () => {
    const dataBlob = {
      freelancer: {
        id: freelancer.id,
        name: freelancer.name,
        email: email,
        title: freelancer.title,
        status: "ACTIVE",
      },
      exportTimestamp: new Date().toISOString(),
      contractsCount: 8,
      verifiedLedgerProofs: 8,
    };
    const blob = new Blob([JSON.stringify(dataBlob, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexum-freelancer-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Personal data archive downloaded.");
  };

  const handleConfirmDelete = () => {
    showToast("Account deletion request submitted for compliance audit.");
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* 1. Page Header (Matching Reference Screenshot) */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Manage your account, preferences and platform settings.
        </p>
      </div>

      {/* 2. Responsive Three-Column Layout (Left: Nav, Centre: Section, Right: Security & Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vertical Nav (3 cols) */}
        <aside className="lg:col-span-3">
          <SettingsNavigation
            activeSection={activeSection}
            onSelectSection={setActiveSection}
          />
        </aside>

        {/* Centre Column: Active Settings Section Content (6 cols) */}
        <main className="lg:col-span-6 min-w-0">
          {activeSection === "account" && (
            <AccountSecuritySection
              email={email}
              phone={phone}
              passwordLastChanged={passwordLastChanged}
              sessions={sessions}
              onChangeEmail={() => setShowEmailModal(true)}
              onChangePhone={() => setShowPhoneModal(true)}
              onChangePassword={() => setShowPasswordModal(true)}
              onEdit2FA={() => setShow2FAModal(true)}
              onSignOutAllSessions={handleSignOutAllSessions}
              onDeactivateAccount={() => setShowDeactivateModal(true)}
              showToast={showToast}
            />
          )}

          {activeSection === "saved_projects" && (
            <SavedProjectsSection showToast={showToast} />
          )}

          {activeSection === "notifications" && (
            <NotificationSettingsSection showToast={showToast} />
          )}

          {activeSection === "availability" && (
            <AvailabilitySection showToast={showToast} />
          )}

          {activeSection === "payments" && (
            <PaymentSettingsSection
              showToast={showToast}
              onNavigateToEarnings={() => router.push("/freelancer/dashboard?tab=earnings")}
            />
          )}

          {activeSection === "ai_preferences" && (
            <NexumAIPreferencesSection showToast={showToast} />
          )}

          {activeSection === "connected_accounts" && (
            <ConnectedAccountsSection showToast={showToast} />
          )}

          {activeSection === "privacy" && (
            <PrivacyDataSection
              showToast={showToast}
              onDownloadData={handleDownloadData}
            />
          )}

          {activeSection === "appearance" && (
            <AppearanceLanguageSection showToast={showToast} />
          )}

          {activeSection === "help" && (
            <HelpSupportSection showToast={showToast} />
          )}

          {activeSection === "delete_account" && (
            <DeleteAccountSection
              showToast={showToast}
              onConfirmDelete={handleConfirmDelete}
            />
          )}
        </main>

        {/* Right Column: Security Status & Quick Actions (3 cols) */}
        <aside className="lg:col-span-3 space-y-5">
          <SecuritySummaryCard
            onAddBackupMethod={() => setShow2FAModal(true)}
          />

          <QuickActionsCard
            onNavigateSection={setActiveSection}
            onDownloadData={handleDownloadData}
          />

          <HelpSupportCard
            onVisitHelpCenter={() => {
              setActiveSection("help");
              showToast("Opened Help & Support section.");
            }}
            onContactSupport={() => {
              setActiveSection("help");
              showToast("Opened developer support ticket form.");
            }}
          />
        </aside>
      </div>

      {/* Interactive Modals */}
      {showEmailModal && (
        <ChangeEmailModal
          currentEmail={email}
          onClose={() => setShowEmailModal(false)}
          onSave={(newEmail) => {
            setEmail(newEmail);
            showToast(`Email updated to ${newEmail}. Verification sent.`);
          }}
        />
      )}

      {showPhoneModal && (
        <ChangePhoneModal
          currentPhone={phone}
          onClose={() => setShowPhoneModal(false)}
          onSave={(newPhone) => {
            setPhone(newPhone);
            showToast(`Phone number updated to ${newPhone}.`);
          }}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSave={() => {
            setPasswordLastChanged("Just now");
            showToast("Password updated successfully.");
          }}
        />
      )}

      {show2FAModal && (
        <Configure2FAModal
          onClose={() => setShow2FAModal(false)}
          onSave={() => {
            showToast("Two-Factor Authenticator App verified and synced.");
          }}
        />
      )}

      {showDeactivateModal && (
        <DeactivateAccountModal
          onClose={() => setShowDeactivateModal(false)}
          onConfirm={() => {
            setShowDeactivateModal(false);
            showToast("Freelancer account deactivated. Log in anytime to restore.");
          }}
        />
      )}
    </div>
  );
}
