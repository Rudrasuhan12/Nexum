"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  CreditCard,
  Bell,
  Briefcase,
  Lock,
  HelpCircle,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Download,
  Smartphone,
  Laptop,
  Globe,
  ExternalLink,
  Save,
  RotateCcw,
  Trash2,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { DemoUser } from "@/lib/auth-types";
import { useAuth } from "@/context/AuthContext";

interface ClientSettingsViewProps {
  client?: DemoUser;
}

type SettingsSection =
  | "profile"
  | "security"
  | "payments"
  | "notifications"
  | "hiring"
  | "privacy"
  | "help"
  | "account";

export default function ClientSettingsView({ client: initialClient }: ClientSettingsViewProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const client = initialClient || user || {
    id: "usr_client_alex",
    name: "Alex Rivera",
    email: "alex.rivera@horizoncommerce.demo",
    role: "CLIENT" as const,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    companyOrHandle: "Horizon Commerce LLC",
    location: "San Francisco, CA, USA",
    timezone: "America/Los_Angeles (UTC-8)",
  };

  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // --------------------------------------------------------------------------
  // 1. EDIT PROFILE STATE
  // --------------------------------------------------------------------------
  const initialProfile = {
    name: client.name || "Alex Rivera",
    email: client.email || "alex.rivera@horizoncommerce.demo",
    phone: "+1 (415) 892-4100",
    location: client.location || "San Francisco, CA, USA",
    company: client.companyOrHandle || "Horizon Commerce LLC",
    website: "https://horizoncommerce.demo",
    timezone: client.timezone || "America/Los_Angeles (UTC-8)",
    bio: "Head of Product & Marketplace Payments at Horizon Commerce LLC. Managing high-integrity e-commerce payment infrastructure with automated milestone release rails.",
  };

  const [profileForm, setProfileForm] = useState(initialProfile);
  const [isProfileDirty, setIsProfileDirty] = useState(false);

  const handleProfileChange = (field: keyof typeof initialProfile, val: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: val }));
    setIsProfileDirty(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileDirty(false);
    showToast("Profile details successfully updated and saved to your Nexum workspace.");
  };

  const handleDiscardProfile = () => {
    setProfileForm(initialProfile);
    setIsProfileDirty(false);
    showToast("Profile changes discarded.");
  };

  // --------------------------------------------------------------------------
  // 2. PASSWORD & SECURITY STATE
  // --------------------------------------------------------------------------
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessions, setSessions] = useState([
    {
      id: "sess_1",
      device: "Chrome 131 on macOS (Apple Silicon)",
      location: "San Francisco, CA, USA",
      ip: "192.0.2.45",
      isCurrent: true,
      lastActive: "Active now",
    },
    {
      id: "sess_2",
      device: "Mobile Safari on iPhone 16 Pro",
      location: "San Francisco, CA, USA",
      ip: "198.51.100.12",
      isCurrent: false,
      lastActive: "2 hours ago",
    },
  ]);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Error: New passwords do not match.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("Password successfully updated across all Nexum authentication nodes.");
  };

  const handleSignOutOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    showToast("Signed out of 1 other active device session.");
  };

  // --------------------------------------------------------------------------
  // 3. PAYMENT SETTINGS STATE
  // --------------------------------------------------------------------------
  const [autoFundMilestones, setAutoFundMilestones] = useState(true);
  const [disputeMediationBuffer, setDisputeMediationBuffer] = useState(true);
  const [paypalSandboxStatus, setPaypalSandboxStatus] = useState<"CONNECTED" | "DISCONNECTED">("CONNECTED");

  // --------------------------------------------------------------------------
  // 4. NOTIFICATIONS STATE
  // --------------------------------------------------------------------------
  const [notifications, setNotifications] = useState({
    proposalsEmail: true,
    proposalsInApp: true,
    messagesEmail: true,
    messagesInApp: true,
    milestonesEmail: true,
    milestonesInApp: true,
    revisionsEmail: true,
    revisionsInApp: true,
    paymentsEmail: true,
    paymentsInApp: true,
    deadlinesEmail: false,
    deadlinesInApp: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
    showToast("Notification preferences updated.");
  };

  // --------------------------------------------------------------------------
  // 5. HIRING PREFERENCES STATE
  // --------------------------------------------------------------------------
  const [hiringBudgetMin, setHiringBudgetMin] = useState(40);
  const [hiringBudgetMax, setHiringBudgetMax] = useState(90);
  const [preferredExpLevel, setPreferredExpLevel] = useState("SENIOR");
  const [preferredSkills, setPreferredSkills] = useState<string[]>([
    "PayPal v2",
    "Next.js",
    "TypeScript",
    "PostgreSQL",
  ]);
  const [newSkillInput, setNewSkillInput] = useState("");

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !preferredSkills.includes(trimmed)) {
      setPreferredSkills((prev) => [...prev, trimmed]);
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setPreferredSkills((prev) => prev.filter((s) => s !== skill));
  };

  // --------------------------------------------------------------------------
  // 6. PRIVACY & DATA STATE
  // --------------------------------------------------------------------------
  const [profileVisibility, setProfileVisibility] = useState<"PUBLIC" | "VERIFIED_ONLY" | "PRIVATE">("VERIFIED_ONLY");
  const [shareAuditTelemetry, setShareAuditTelemetry] = useState(true);

  // --------------------------------------------------------------------------
  // 7. HELP & SUPPORT MODAL
  // --------------------------------------------------------------------------
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportIssue, setSupportIssue] = useState("");
  const [supportCategory, setSupportCategory] = useState("Milestone Mediation");

  const handleSubmitSupport = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSupportModal(false);
    setSupportIssue("");
    showToast("Support ticket submitted. A Nexum mediation specialist will respond within 4 hours.");
  };

  // --------------------------------------------------------------------------
  // 8. DANGER ZONE & ACCOUNT DELETION
  // --------------------------------------------------------------------------
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");

  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmationInput !== "DELETE MY ACCOUNT") {
      showToast("Confirmation text must match 'DELETE MY ACCOUNT'.");
      return;
    }
    setShowDeleteModal(false);
    showToast("Account deletion request submitted. An authorization token has been sent to your primary email.");
  };

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  // Navigation Items (Optimized for sleek top horizontal segmented bar)
  const navTabs = [
    { id: "profile" as SettingsSection, label: "Edit Profile", icon: User },
    { id: "security" as SettingsSection, label: "Password & Security", icon: Shield },
    { id: "payments" as SettingsSection, label: "Payment & PayPal", icon: CreditCard },
    { id: "notifications" as SettingsSection, label: "Notifications", icon: Bell },
    { id: "hiring" as SettingsSection, label: "Hiring Preferences", icon: Briefcase },
    { id: "privacy" as SettingsSection, label: "Privacy & Data", icon: Lock },
    { id: "help" as SettingsSection, label: "Help & Support", icon: HelpCircle },
    { id: "account" as SettingsSection, label: "Sign Out & Account", icon: LogOut },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Settings & Workspace Controls
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your verified buyer profile, PayPal credentials, notification triggers, and hiring preferences.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Verified US Merchant
          </span>
        </div>
      </div>

      {/* Two-Column Settings Layout matching clean SaaS Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Vertical Navigation Menu (Exact match with Reference Card) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-3.5 shadow-xs space-y-1 shrink-0">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13.5px] font-semibold transition-all duration-150 cursor-pointer text-left ${
                  isActive
                    ? "bg-[#eef2ff] text-[#4f46e5] font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    isActive ? "text-[#4f46e5]" : "text-slate-400"
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Content Area */}
        <div className="lg:col-span-8 space-y-6">

          {/* ================================================================
              SECTION 1: EDIT PROFILE
             ================================================================ */}
          {activeSection === "profile" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-extrabold text-slate-900">Edit Profile & Organization</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your contact details, company information, and buyer presence across the Nexum network.
                </p>
              </div>

              {/* Profile Photo & Quick Info */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                  <Image
                    src={client.avatar}
                    alt={profileForm.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{profileForm.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                      ID: {client.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{profileForm.company} &bull; {profileForm.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => showToast("Simulated avatar upload file picker.")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
                  >
                    Change Photo
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => handleProfileChange("name", e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => handleProfileChange("email", e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Registered Location</label>
                    <input
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => handleProfileChange("location", e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Company / Legal Entity</label>
                    <input
                      type="text"
                      value={profileForm.company}
                      onChange={(e) => handleProfileChange("company", e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Company Website</label>
                    <input
                      type="url"
                      value={profileForm.website}
                      onChange={(e) => handleProfileChange("website", e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Organization Overview / Bio</label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => handleProfileChange("bio", e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                  />
                </div>

                {/* Save and Discard Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleDiscardProfile}
                    disabled={!isProfileDirty}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${isProfileDirty
                      ? "text-slate-600 hover:bg-slate-100 cursor-pointer"
                      : "text-slate-400 cursor-not-allowed opacity-50"
                      }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Discard Changes</span>
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Profile</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================================================================
              SECTION 2: PASSWORD & SECURITY
             ================================================================ */}
          {activeSection === "security" && (
            <div className="space-y-6">
              {/* Change Password Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-extrabold text-slate-900">Change Password</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ensure your account is protected with a strong, multi-factor credential.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full p-2.5 pr-9 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Minimum 8 characters"
                        className="w-full p-2.5 pr-9 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat new password"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => showToast("Password reset instructions sent to " + profileForm.email)}
                      className="text-xs font-semibold text-[#4f46e5] hover:underline cursor-pointer"
                    >
                      Forgot your password?
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

              {/* Two-Factor Authentication (2FA) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-slate-900 text-sm">Two-Factor Authentication (2FA)</h3>
                    <p className="text-xs text-slate-500">
                      Add a strong security layer to your merchant account with TOTP authenticator verification.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorEnabled(!twoFactorEnabled);
                      showToast(twoFactorEnabled ? "2FA disabled." : "2FA enabled with authenticator app.");
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${twoFactorEnabled ? "bg-[#4f46e5]" : "bg-slate-200"
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${twoFactorEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-800">
                      {twoFactorEnabled ? "Authenticator App Active (Google / 1Password)" : "2FA currently unconfigured"}
                    </span>
                  </div>
                  {twoFactorEnabled && (
                    <button
                      type="button"
                      onClick={() => showToast("Downloaded 10 emergency 2FA backup codes.")}
                      className="text-[11px] font-bold text-[#4f46e5] hover:underline cursor-pointer"
                    >
                      Download Backup Codes
                    </button>
                  )}
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Active Authorized Sessions</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Devices currently authorized to access this Nexum workspace.
                    </p>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSignOutOtherSessions}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                    >
                      Sign Out Other Devices
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {sess.device.includes("Mobile") ? (
                          <Smartphone className="w-5 h-5 text-slate-500" />
                        ) : (
                          <Laptop className="w-5 h-5 text-slate-500" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{sess.device}</span>
                            {sess.isCurrent && (
                              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                This Device
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {sess.location} &bull; IP: {sess.ip} &bull; {sess.lastActive}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 3: PAYMENT SETTINGS (PAYPAL & BILLING)
             ================================================================ */}
          {activeSection === "payments" && (
            <div className="space-y-6">

              {/* Connected PayPal Account */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">PayPal REST API v2 Rails</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Connected escrow payment processor for pre-funding and milestone releases.
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${paypalSandboxStatus === "CONNECTED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                      }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${paypalSandboxStatus === "CONNECTED" ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                    />
                    {paypalSandboxStatus === "CONNECTED" ? "Sandbox Connected" : "Disconnected"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Connected Account</span>
                    <span className="font-extrabold text-slate-900 text-xs mt-1 block">
                      sb-client-alex@nexum.demo
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sandbox Client ID</span>
                    <span className="font-extrabold text-slate-900 text-xs mt-1 block">
                      sb-client-***261C (REST v2)
                    </span>
                  </div>
                </div>

                {/* Payment Configuration Preferences */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Escrow Preferences
                  </h3>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoFundMilestones}
                      onChange={(e) => {
                        setAutoFundMilestones(e.target.checked);
                        showToast("Escrow funding preferences updated.");
                      }}
                      className="mt-0.5 accent-[#4f46e5]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Auto-prompt milestone funding upon bilateral agreement
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Immediately prepares PayPal Orders v2 sandbox capture authorization when scope is locked.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={disputeMediationBuffer}
                      onChange={(e) => {
                        setDisputeMediationBuffer(e.target.checked);
                        showToast("Mediation buffer preference saved.");
                      }}
                      className="mt-0.5 accent-[#4f46e5]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Enforce 72-hour revision buffer prior to consensus release
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Gives the client a 72-hour inspection window to verify deliverables before automated capture triggers.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Billing Receipts & History */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Billing Receipts & Escrow Logs</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verifiable transaction receipts and settlement audit summaries.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast("Exported all billing records as CSV.")}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="py-3 flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="font-bold text-slate-900">Order #6DE714998H998261C</div>
                      <div className="text-slate-500 text-[11px]">Bilateral E-Commerce Payment Rails &bull; Oct 24, 2026</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-slate-900">$1,500.00 USD</span>
                      <button
                        type="button"
                        onClick={() => showToast("Downloaded invoice receipt for Order #6DE714998H998261C.")}
                        className="text-xs text-[#4f46e5] font-bold hover:underline cursor-pointer"
                      >
                        Receipt PDF
                      </button>
                    </div>
                  </div>

                  <div className="py-3 flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="font-bold text-slate-900">Order #4AB912389K112233D</div>
                      <div className="text-slate-500 text-[11px]">Milestone 1 Core Architecture &bull; Oct 16, 2026</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-slate-900">$1,200.00 USD</span>
                      <button
                        type="button"
                        onClick={() => showToast("Downloaded invoice receipt for Order #4AB912389K112233D.")}
                        className="text-xs text-[#4f46e5] font-bold hover:underline cursor-pointer"
                      >
                        Receipt PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 4: NOTIFICATIONS
             ================================================================ */}
          {activeSection === "notifications" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900">Notification Triggers</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select how you want to be alerted for milestone submissions, proposals, and escrow actions.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 pr-4">Event Type</th>
                      <th className="py-3 px-4 text-center">Email</th>
                      <th className="py-3 pl-4 text-center">In-App Push</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3.5 pr-4">
                        <span className="font-bold text-slate-900 block">New Proposals & Applications</span>
                        <span className="text-[11px] text-slate-500">When freelancers submit quotes or respond to invites</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={notifications.proposalsEmail}
                          onChange={() => toggleNotification("proposalsEmail")}
                          className="accent-[#4f46e5] cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 pl-4 text-center">
                        <input
                          type="checkbox"
                          checked={notifications.proposalsInApp}
                          onChange={() => toggleNotification("proposalsInApp")}
                          className="accent-[#4f46e5] cursor-pointer"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3.5 pr-4">
                        <span className="font-bold text-slate-900 block">Freelancer Messages & Comments</span>
                        <span className="text-[11px] text-slate-500">Bilateral workspace comments and direct inquiries</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={notifications.messagesEmail}
                          onChange={() => toggleNotification("messagesEmail")}
                          className="accent-[#4f46e5] cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 pl-4 text-center">
                        <input
                          type="checkbox"
                          checked={notifications.messagesInApp}
                          onChange={() => toggleNotification("messagesInApp")}
                          className="accent-[#4f46e5] cursor-pointer"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3.5 pr-4">
                        <span className="font-bold text-slate-900 block">Milestone Deliverable Submissions</span>
                        <span className="text-[11px] text-slate-500">When deliverables are ready for your review & approval</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={notifications.milestonesEmail}
                          onChange={() => toggleNotification("milestonesEmail")}
                          className="accent-[#4f46e5] cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 pl-4 text-center">
                        <input
                          type="checkbox"
                          checked={notifications.milestonesInApp}
                          onChange={() => toggleNotification("milestonesInApp")}
                          className="accent-[#4f46e5] cursor-pointer"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3.5 pr-4">
                        <span className="font-bold text-slate-900 block">Revision & Scope Change Requests</span>
                        <span className="text-[11px] text-slate-500">Requests for milestone deadline or acceptance adjustments</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={notifications.revisionsEmail}
                          onChange={() => toggleNotification("revisionsEmail")}
                          className="accent-[#4f46e5] cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 pl-4 text-center">
                        <input
                          type="checkbox"
                          checked={notifications.revisionsInApp}
                          onChange={() => toggleNotification("revisionsInApp")}
                          className="accent-[#4f46e5] cursor-pointer"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3.5 pr-4">
                        <span className="font-bold text-slate-900 block">Payment & PayPal Escrow Updates</span>
                        <span className="text-[11px] text-slate-500">Confirmations of order creation, capture, and fund release</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={notifications.paymentsEmail}
                          onChange={() => toggleNotification("paymentsEmail")}
                          className="accent-[#4f46e5] cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 pl-4 text-center">
                        <input
                          type="checkbox"
                          checked={notifications.paymentsInApp}
                          onChange={() => toggleNotification("paymentsInApp")}
                          className="accent-[#4f46e5] cursor-pointer"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3.5 pr-4">
                        <span className="font-bold text-slate-900 block">Upcoming Project Deadlines</span>
                        <span className="text-[11px] text-slate-500">Reminders for milestones due within 48 hours</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={notifications.deadlinesEmail}
                          onChange={() => toggleNotification("deadlinesEmail")}
                          className="accent-[#4f46e5] cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 pl-4 text-center">
                        <input
                          type="checkbox"
                          checked={notifications.deadlinesInApp}
                          onChange={() => toggleNotification("deadlinesInApp")}
                          className="accent-[#4f46e5] cursor-pointer"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 5: HIRING PREFERENCES
             ================================================================ */}
          {activeSection === "hiring" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900">Hiring & Matching Preferences</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tune how Nexum calculates candidate Match Fit Scores. (Note: These preferences improve AI suggestions without restricting manual search).
                </p>
              </div>

              {/* Default Budget Range */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Target Hourly Rate Range:</span>
                  <span className="font-mono font-bold text-[#4f46e5]">
                    ${hiringBudgetMin}.00 - ${hiringBudgetMax}.00 / hr
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Min Hourly Rate ($)</label>
                    <input
                      type="number"
                      value={hiringBudgetMin}
                      onChange={(e) => setHiringBudgetMin(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#4f46e5]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Max Hourly Rate ($)</label>
                    <input
                      type="number"
                      value={hiringBudgetMax}
                      onChange={(e) => setHiringBudgetMax(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#4f46e5]"
                    />
                  </div>
                </div>
              </div>

              {/* Preferred Experience Level */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Preferred Experience Tier</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {["JUNIOR", "MID_LEVEL", "SENIOR", "EXPERT"].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => {
                        setPreferredExpLevel(tier);
                        showToast(`Preferred experience tier set to ${tier}.`);
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${preferredExpLevel === tier
                        ? "bg-[#eef2ff] border-[#c7d2fe] text-[#4f46e5] shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      {tier === "JUNIOR"
                        ? "Junior (1-3y)"
                        : tier === "MID_LEVEL"
                          ? "Mid-Level (3-5y)"
                          : tier === "SENIOR"
                            ? "Senior (5-8y)"
                            : "Expert (8+y)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Skills */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 block">Preferred Core Technologies</label>
                <div className="flex flex-wrap gap-2">
                  {preferredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#eef2ff] text-[#4f46e5] border border-indigo-100 flex items-center gap-1.5"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-indigo-400 hover:text-indigo-600 cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddSkill} className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Add skill (e.g. Docker, Python)..."
                    className="flex-1 p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-xs"
                  >
                    Add
                  </button>
                </form>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => showToast("Hiring preferences updated. Recommendations re-indexed.")}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-xs cursor-pointer"
                >
                  Save Hiring Preferences
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 6: PRIVACY & DATA
             ================================================================ */}
          {activeSection === "privacy" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900">Privacy & Data Governance</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control how your buyer profile is displayed and export your cryptographic audit history.
                </p>
              </div>

              {/* Profile Visibility */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 block">Directory Profile Visibility</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={profileVisibility === "PUBLIC"}
                      onChange={() => {
                        setProfileVisibility("PUBLIC");
                        showToast("Profile visibility set to Public.");
                      }}
                      className="mt-0.5 accent-[#4f46e5]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Public Directory</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Visible to all registered contractors and agencies on the Nexum network.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={profileVisibility === "VERIFIED_ONLY"}
                      onChange={() => {
                        setProfileVisibility("VERIFIED_ONLY");
                        showToast("Profile visibility set to Verified Freelancers Only.");
                      }}
                      className="mt-0.5 accent-[#4f46e5]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Verified Freelancers Only (Recommended)</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Restricts profile viewing to freelancers who have completed ID verification and PayPal onboarding.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={profileVisibility === "PRIVATE"}
                      onChange={() => {
                        setProfileVisibility("PRIVATE");
                        showToast("Profile visibility set to Private.");
                      }}
                      className="mt-0.5 accent-[#4f46e5]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Private / Invitation Only</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Hidden from general browsing; only talent you invite directly can see your organization details.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Data Export */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Request Data Archive Export</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Download an immutable JSON bundle of all your signed agreements, audit hashes, and milestone receipts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Data export initiated. Download link will be emailed to " + profileForm.email)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Request Export</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 7: HELP & SUPPORT
             ================================================================ */}
          {activeSection === "help" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-extrabold text-slate-900">Help Center & Resolution Guidance</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Documentation, dispute mediation guidelines, and 24/7 dedicated support for Nexum buyers.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <h3 className="font-bold text-slate-900 text-xs">Bilateral Dispute Guidance</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Learn how Nexum evaluates unmet acceptance criteria through structured milestone revisions before initiating third-party arbitration.
                    </p>
                    <button
                      type="button"
                      onClick={() => showToast("Opening mediation handbook...")}
                      className="text-xs font-bold text-[#4f46e5] hover:underline cursor-pointer"
                    >
                      Read Mediation Policy &rarr;
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <h3 className="font-bold text-slate-900 text-xs">PayPal Sandbox Escrow FAQ</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Understand how simulated orders, webhook verification, and capture authorization work during development and testing.
                    </p>
                    <button
                      type="button"
                      onClick={() => showToast("Opening payment documentation...")}
                      className="text-xs font-bold text-[#4f46e5] hover:underline cursor-pointer"
                    >
                      View PayPal Developer Guide &rarr;
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Need immediate assistance?</span>
                    <span className="text-[11px] text-slate-500 block">
                      Our mediation and integration specialists are available 24/7.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSupportModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-xs cursor-pointer shrink-0"
                  >
                    Open Support Ticket
                  </button>
                </div>
              </div>

              {/* Legal & Terms */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <a href="#" onClick={(e) => { e.preventDefault(); showToast("Viewing Terms of Service."); }} className="hover:text-slate-900">
                    Terms of Service
                  </a>
                  <span>&bull;</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); showToast("Viewing Privacy Policy."); }} className="hover:text-slate-900">
                    Privacy Policy
                  </a>
                  <span>&bull;</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); showToast("Viewing Escrow Rails Specification."); }} className="hover:text-slate-900">
                    Escrow Protocol v1.2
                  </a>
                </div>
                <span>Nexum Infrastructure &copy; 2026</span>
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 8: SIGN OUT & ACCOUNT MANAGEMENT (WITH DANGER ZONE)
             ================================================================ */}
          {activeSection === "account" && (
            <div className="space-y-6">

              {/* Sign Out Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Sign Out of Workspace</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    End your active session on this device. You will need to log back in to access agreements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* DANGER ZONE: Permanent Account Deletion */}
              <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 text-rose-800">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 className="font-extrabold text-base">Danger Zone</h3>
                </div>

                <p className="text-xs text-rose-900/80 leading-relaxed">
                  Permanently deleting your account will erase your profile, revoke your PayPal sandbox authorization, and archive your projects.{" "}
                  <strong>Safeguard note:</strong> Accounts with active escrow balances, funded milestones, or pending disputes cannot be deleted until all financial settlements are closed.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account Permanently</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          MODAL: SUPPORT TICKET
         ==================================================================== */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Contact Nexum Support</h3>
            <p className="text-xs text-slate-500">
              Our mediation desk will review your request and inspect relevant agreement hashes.
            </p>
            <form onSubmit={handleSubmitSupport} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Category *</label>
                <select
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4f46e5]"
                >
                  <option value="Milestone Mediation">Milestone Mediation & Acceptance</option>
                  <option value="PayPal Sandbox">PayPal Sandbox Rails & Webhooks</option>
                  <option value="Agreement Hash Verification">Agreement Hash Verification</option>
                  <option value="General Support">General Platform Inquiries</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Problem Description *</label>
                <textarea
                  rows={4}
                  value={supportIssue}
                  onChange={(e) => setSupportIssue(e.target.value)}
                  required
                  placeholder="Detail the issue, affected milestone, or discrepancy..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-[#4f46e5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-xs cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ACCOUNT DELETION CONFIRMATION (DANGER ZONE)
         ==================================================================== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-bold">Confirm Account Deletion</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action is permanent and irreversible. All verified merchant credentials and active workspaces will be severed.
            </p>

            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Type <span className="font-mono text-rose-600">DELETE MY ACCOUNT</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  required
                  className="w-full p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 text-xs text-rose-900 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmationInput !== "DELETE MY ACCOUNT"}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition ${deleteConfirmationInput === "DELETE MY ACCOUNT"
                    ? "bg-rose-600 hover:bg-rose-700 cursor-pointer"
                    : "bg-slate-300 cursor-not-allowed opacity-60"
                    }`}
                >
                  Permanently Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
