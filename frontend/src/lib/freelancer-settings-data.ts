import {
  ActiveSession,
  SavedProject,
  NotificationPreferences,
  AvailabilityPreferences,
  ConnectedAccountItem,
  NexumAIPreferences,
  PrivacyPreferences,
  AppearancePreferences,
} from "./freelancer-settings-types";

export const INITIAL_ACCOUNT_INFO = {
  email: "sambit.mohanty@example.com",
  isEmailVerified: true,
  phone: "+91 9876543210",
  isPhoneVerified: true,
  maskedPassword: "••••••••••••",
  passwordLastChanged: "Jan 12, 2026",
  twoFactorEnabled: true,
  active2FAMethod: "authenticator" as "authenticator" | "sms",
};

export const INITIAL_ACTIVE_SESSIONS: ActiveSession[] = [
  {
    id: "sess_win",
    device: "Windows • Chrome",
    os: "Windows 11",
    browser: "Chrome 122.0",
    location: "Bhubaneswar, India",
    lastActive: "Jan 28, 2026, 6:15 PM",
    isCurrent: true,
    deviceType: "desktop",
  },
  {
    id: "sess_android",
    device: "Android • Nexum App",
    os: "Android 14",
    browser: "Nexum Mobile v1.4",
    location: "Bhubaneswar, India",
    lastActive: "Jan 25, 2026, 10:12 AM",
    isCurrent: false,
    deviceType: "mobile",
  },
];

export const INITIAL_SAVED_PROJECTS: SavedProject[] = [
  {
    id: "sp_1",
    title: "Enterprise Smart Escrow Integration for Solana Pay",
    clientCompany: "FinTech Labs Inc.",
    budget: "$4,500.00 USD",
    skills: ["Next.js", "Solana", "State Machines", "TypeScript"],
    status: "OPEN",
    savedDate: "2 days ago",
  },
  {
    id: "sp_2",
    title: "Decentralized Freelance Marketplace Frontend",
    clientCompany: "Web3 Collective",
    budget: "$3,200.00 USD",
    skills: ["React", "TailwindCSS", "TypeScript", "Prisma"],
    status: "OPEN",
    savedDate: "5 days ago",
  },
  {
    id: "sp_3",
    title: "High-Throughput Order Webhook Pipeline",
    clientCompany: "Horizon Commerce LLC",
    budget: "$2,800.00 USD",
    skills: ["Node.js", "Express", "PostgreSQL", "Docker"],
    status: "IN_REVIEW",
    savedDate: "Oct 15, 2026",
  },
];

export const INITIAL_NOTIFICATION_PREFS: NotificationPreferences = {
  projectInvitations: true,
  proposalResponses: true,
  milestoneUpdates: true,
  deliverableReviews: true,
  scopeChangeRequests: true,
  clientMessages: true,
  aiMediationUpdates: true,
  meetingInvitations: true,
  agreementApprovals: true,
  paymentCaptures: true,
  pendingPayments: true,
  payoutProcessing: true,
  payoutCompleted: true,
  emailChannel: true,
  inAppChannel: true,
  pushChannel: false,
};

export const INITIAL_AVAILABILITY_PREFS: AvailabilityPreferences = {
  status: "AVAILABLE",
  hourlyRate: "65.00",
  minBudget: "1,500.00",
  hoursPerWeek: "35",
  duration: "4–8 weeks",
  timezone: "Asia/Kolkata (UTC+5:30)",
  preferredCategories: [
    "Web Development",
    "AI & Data",
    "Mobile Development",
    "Blockchain",
  ],
};

export const INITIAL_CONNECTED_ACCOUNTS: ConnectedAccountItem[] = [
  {
    id: "ca_paypal",
    provider: "PayPal",
    name: "PayPal REST Payouts",
    identifier: "sambit.mohanty@example.com",
    isConnected: true,
    connectedAt: "Jan 15, 2026",
    isSandbox: true,
  },
  {
    id: "ca_github",
    provider: "GitHub",
    name: "GitHub Developer OAuth",
    identifier: "@sambit-kumar-mohanty",
    isConnected: true,
    connectedAt: "Jan 10, 2026",
  },
  {
    id: "ca_google",
    provider: "Google",
    name: "Google Workspace & SSO",
    identifier: "sambit.mohanty@gmail.com",
    isConnected: true,
    connectedAt: "Jan 05, 2026",
  },
  {
    id: "ca_gitlab",
    provider: "GitLab",
    name: "GitLab Enterprise",
    identifier: "Not connected",
    isConnected: false,
  },
  {
    id: "ca_slack",
    provider: "Slack",
    name: "Slack Connect Alerts",
    identifier: "Not connected",
    isConnected: false,
  },
];

export const INITIAL_AI_PREFERENCES: NexumAIPreferences = {
  proposalDrafting: true,
  messageDrafting: true,
  milestoneSummaries: true,
  scopeChangeExplanations: true,
  communicationSuggestions: true,
  responseLanguage: "English (US)",
  responseStyle: "Balanced",
};

export const INITIAL_PRIVACY_PREFERENCES: PrivacyPreferences = {
  profileVisibility: "PUBLIC",
  searchableInDirectory: true,
  showPublicPortfolio: true,
  shareMediationTelemetry: true,
};

export const INITIAL_APPEARANCE_PREFERENCES: AppearancePreferences = {
  theme: "light",
  language: "English (United States)",
  currency: "INR",
  dateFormat: "MMM DD, YYYY",
  timeFormat: "12h",
};

