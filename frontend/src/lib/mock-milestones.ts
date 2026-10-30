export type MilestoneWorkflowStatus =
  | "ALL"
  | "UPCOMING"
  | "IN_PROGRESS"
  | "AWAITING_REVIEW"
  | "OVERDUE"
  | "ACCEPTED"
  | "DISPUTED";

export type MilestonePaymentState =
  | "ALL"
  | "UNFUNDED"
  | "ESCROW_FUNDED"
  | "CAPTURED"
  | "RECONCILING";

export interface AcceptanceCriterion {
  id: string;
  criterion: string;
  isMet: boolean;
  notes?: string;
}

export interface MilestoneDeliverableItem {
  id: string;
  title: string;
  type: "FILE" | "REPOSITORY_DIFF" | "TEST_LOG" | "DOCUMENT";
  size?: string;
  url?: string;
  submittedAt: string;
}

export interface MilestoneActivityEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: "CLIENT" | "FREELANCER" | "CONSENSUS_NODE" | "SYSTEM";
  action: string;
  details: string;
  hash: string;
}

export interface FullMilestoneData {
  id: string;
  number: number;
  title: string;
  projectId: string;
  projectName: string;
  agreementVersion: string;
  canonicalSpecHash: string;
  freelancer?: {
    name: string;
    role: string;
    avatar: string;
    rating: string;
  };
  dueDate: string;
  dueDateTimestamp: number;
  isOverdue: boolean;
  daysRemainingOrOverdue: string;
  amount: string;
  currency: string;
  workflowStatus: MilestoneWorkflowStatus;
  workflowStatusLabel: string;
  workflowStatusColor: string;
  nextClientAction: {
    label: string;
    description: string;
    actionType: "REVIEW_SUBMISSION" | "VIEW_MILESTONE" | "VIEW_STATUS" | "VIEW_RECEIPT" | "VIEW_DISPUTE";
  };
  paymentState: MilestonePaymentState;
  paymentStateLabel: string;
  paymentStateColor: string;
  paymentDetails?: {
    orderId?: string;
    captureId?: string;
    escrowPreFundedDate?: string;
    capturedDate?: string;
    provider: string;
    proofHash?: string;
    reconciliationStatus?: "RECONCILED" | "PENDING_WEBHOOK" | "SYNC_SCHEDULED";
  };
  scopeOverview: string;
  acceptanceCriteria: AcceptanceCriterion[];
  deliverables: MilestoneDeliverableItem[];
  submissionNotes?: string;
  activities: MilestoneActivityEvent[];
  correctionsRequestedNotes?: string;
  hasScopeChangeAmendment?: boolean;
  amendmentNotes?: string;
}

export const CLIENT_MILESTONES: FullMilestoneData[] = [
  {
    id: "ms_m2_paypal",
    number: 2,
    title: "PayPal REST v2 Webhook Ingestion Engine",
    projectId: "proj_1",
    projectName: "Bilateral E-Commerce Payment Rails",
    agreementVersion: "canonical_v1.2",
    canonicalSpecHash: "canonical_v1.2_#9f8c2b7e",
    freelancer: {
      name: "Rohan Verma",
      role: "Payment Rails Specialist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
      rating: "5.0",
    },
    dueDate: "Today (Oct 30, 2026)",
    dueDateTimestamp: Date.now() + 4 * 3600 * 1000,
    isOverdue: false,
    daysRemainingOrOverdue: "Review due today",
    amount: "$1,500.00",
    currency: "USD",
    workflowStatus: "AWAITING_REVIEW",
    workflowStatusLabel: "Awaiting Review",
    workflowStatusColor: "bg-amber-50 text-amber-800 border-amber-200/90",
    nextClientAction: {
      label: "Review Deliverables & Test Logs",
      description: "Freelancer has submitted deliverable package. Inspect automated test assert logs and approve release.",
      actionType: "REVIEW_SUBMISSION",
    },
    paymentState: "ESCROW_FUNDED",
    paymentStateLabel: "Pre-Funded in Sandbox Escrow",
    paymentStateColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paymentDetails: {
      orderId: "6DE714998H998261C",
      escrowPreFundedDate: "Oct 26, 2026, 4:15 PM",
      provider: "PayPal Orders v2 Sandbox",
      proofHash: "sha256:4fe112d8a011...991e2b",
      reconciliationStatus: "RECONCILED",
    },
    scopeOverview: "Implement high-throughput PayPal webhook ingestion worker supporting event signature verification (transmission-id, cert-url, auth-algo) and automatic Reconcile-Before-Retry state machine.",
    acceptanceCriteria: [
      { id: "ac_1", criterion: "All 22 unit & integration test suites pass with zero failures", isMet: true },
      { id: "ac_2", criterion: "HMAC / SHA-256 transmission signatures validate against PayPal root certs", isMet: true },
      { id: "ac_3", criterion: "Idempotency cache prevents double-execution on replayed webhook packets", isMet: true },
      { id: "ac_4", criterion: "Dead-letter queue isolation for corrupted payload events", isMet: true },
    ],
    deliverables: [
      {
        id: "del_1",
        title: "paypal-webhook-engine-v2.ts",
        type: "REPOSITORY_DIFF",
        size: "34.2 KB",
        submittedAt: "Today, 1:45 PM",
      },
      {
        id: "del_2",
        title: "test-assert-logs-22-passing.txt",
        type: "TEST_LOG",
        size: "128 KB",
        submittedAt: "Today, 1:47 PM",
      },
      {
        id: "del_3",
        title: "Architecture & DLQ Runbook.pdf",
        type: "DOCUMENT",
        size: "1.4 MB",
        submittedAt: "Today, 1:48 PM",
      },
    ],
    submissionNotes: "Completed webhook parser and simulated 50 parallel dispatches under network drops. All 22 test suites passed without dropped events. Ready for client sign-off.",
    activities: [
      {
        id: "act_m2_1",
        timestamp: "Today, 1:48 PM",
        actor: "Rohan Verma",
        role: "FREELANCER",
        action: "Deliverables Package Submitted",
        details: "Code diff, test logs, and architecture runbook uploaded for review.",
        hash: "e90f2b8a...12c8",
      },
      {
        id: "act_m2_2",
        timestamp: "Oct 26, 4:15 PM",
        actor: "PayPal Gateway",
        role: "SYSTEM",
        action: "Sandbox Escrow Pre-Funded",
        details: "Order #6DE714998H998261C pre-authorized in PayPal Sandbox ($1,500.00 USD).",
        hash: "78a9c011...45df",
      },
      {
        id: "act_m2_3",
        timestamp: "Oct 24, 4:12 PM",
        actor: "Consensus Engine",
        role: "CONSENSUS_NODE",
        action: "Milestone Scope Sealed",
        details: "Bilateral agreement signature locked under hash canonical_v1.2_#9f8c2b7e.",
        hash: "9f8c2b7e...1b6d",
      },
    ],
  },

  {
    id: "ms_m1_paypal",
    number: 1,
    title: "Project Intake & Architecture PRD",
    projectId: "proj_1",
    projectName: "Bilateral E-Commerce Payment Rails",
    agreementVersion: "canonical_v1.2",
    canonicalSpecHash: "canonical_v1.2_#9f8c2b7e",
    freelancer: {
      name: "Rohan Verma",
      role: "Payment Rails Specialist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
      rating: "5.0",
    },
    dueDate: "Oct 24, 2026",
    dueDateTimestamp: Date.now() - 6 * 86400 * 1000,
    isOverdue: false,
    daysRemainingOrOverdue: "Completed on Oct 24",
    amount: "$1,200.00",
    currency: "USD",
    workflowStatus: "ACCEPTED",
    workflowStatusLabel: "Accepted",
    workflowStatusColor: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
    nextClientAction: {
      label: "View Acceptance Record & Receipt",
      description: "Milestone completed and released. View PayPal capture confirmation and immutable cryptographic receipt.",
      actionType: "VIEW_RECEIPT",
    },
    paymentState: "CAPTURED",
    paymentStateLabel: "Captured & Released",
    paymentStateColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paymentDetails: {
      orderId: "4AB912048C881923K",
      captureId: "CAP_981240182_OK",
      escrowPreFundedDate: "Oct 18, 2026",
      capturedDate: "Oct 24, 2026, 4:12 PM",
      provider: "PayPal Orders v2 Sandbox",
      proofHash: "sha256:d8a201...991e2b",
      reconciliationStatus: "RECONCILED",
    },
    scopeOverview: "Establish system requirements, database schema migrations, and secure PayPal sandbox API wrapper.",
    acceptanceCriteria: [
      { id: "ac_11", criterion: "Canonical PRD markdown locked", isMet: true },
      { id: "ac_12", criterion: "Database schema migration applied with RLS", isMet: true },
      { id: "ac_13", criterion: "Dual SHA-256 agreement signing protocol operational", isMet: true },
    ],
    deliverables: [
      { id: "del_11", title: "prd-v1.2.md", type: "DOCUMENT", size: "48 KB", submittedAt: "Oct 24, 2026" },
      { id: "del_12", title: "001_initial_schema.sql", type: "FILE", size: "14 KB", submittedAt: "Oct 24, 2026" },
    ],
    activities: [
      {
        id: "act_m1_1",
        timestamp: "Oct 24, 4:12 PM",
        actor: "Sambit Kumar",
        role: "CLIENT",
        action: "Deliverable Accepted & Funds Released",
        details: "$1,200.00 captured and released to Rohan Verma.",
        hash: "123a88bb...ff99",
      },
    ],
  },

  {
    id: "ms_m3_paypal",
    number: 3,
    title: "Real-Time Reconciliation & Retry Worker",
    projectId: "proj_1",
    projectName: "Bilateral E-Commerce Payment Rails",
    agreementVersion: "canonical_v1.2",
    canonicalSpecHash: "canonical_v1.2_#9f8c2b7e",
    freelancer: {
      name: "Rohan Verma",
      role: "Payment Rails Specialist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
      rating: "5.0",
    },
    dueDate: "Nov 08, 2026",
    dueDateTimestamp: Date.now() + 9 * 86400 * 1000,
    isOverdue: false,
    daysRemainingOrOverdue: "9 days remaining",
    amount: "$1,800.00",
    currency: "USD",
    workflowStatus: "IN_PROGRESS",
    workflowStatusLabel: "In Progress",
    workflowStatusColor: "bg-blue-50 text-blue-700 border-blue-200/90",
    nextClientAction: {
      label: "Track Progress & Clarify Scope",
      description: "Engineering in progress. Freelancer is implementing the cron reconciliation worker.",
      actionType: "VIEW_MILESTONE",
    },
    paymentState: "ESCROW_FUNDED",
    paymentStateLabel: "Pre-Funded in Sandbox Escrow",
    paymentStateColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paymentDetails: {
      orderId: "7FF991823H102938B",
      escrowPreFundedDate: "Oct 26, 2026",
      provider: "PayPal Orders v2 Sandbox",
      proofHash: "sha256:77a199...bc11",
      reconciliationStatus: "RECONCILED",
    },
    scopeOverview: "Build the Reconcile-Before-Retry state machine, background sync cron worker for orphaned orders, and consensus ledger replay tools.",
    acceptanceCriteria: [
      { id: "ac_31", criterion: "Automated recovery of simulated dropped orders after 120 seconds", isMet: false },
      { id: "ac_32", criterion: "Audit trail reconciles ledger state against PayPal transactions query", isMet: false },
    ],
    deliverables: [],
    activities: [
      {
        id: "act_m3_1",
        timestamp: "Oct 26, 5:00 PM",
        actor: "Consensus Engine",
        role: "CONSENSUS_NODE",
        action: "Escrow Pre-Funded & Work Commenced",
        details: "PayPal Sandbox Order #7FF991823H102938B authorized ($1,800.00 USD).",
        hash: "77a199...bc11",
      },
    ],
  },

  {
    id: "ms_m4_paypal",
    number: 4,
    title: "Production Hardening & E2E Consensus Handover",
    projectId: "proj_1",
    projectName: "Bilateral E-Commerce Payment Rails",
    agreementVersion: "canonical_v1.2",
    canonicalSpecHash: "canonical_v1.2_#9f8c2b7e",
    freelancer: {
      name: "Rohan Verma",
      role: "Payment Rails Specialist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
      rating: "5.0",
    },
    dueDate: "Nov 18, 2026",
    dueDateTimestamp: Date.now() + 19 * 86400 * 1000,
    isOverdue: false,
    daysRemainingOrOverdue: "19 days remaining",
    amount: "$1,500.00",
    currency: "USD",
    workflowStatus: "UPCOMING",
    workflowStatusLabel: "Upcoming",
    workflowStatusColor: "bg-slate-100 text-slate-700 border-slate-200",
    nextClientAction: {
      label: "View Milestone Scope",
      description: "Scheduled milestone. Funding opens once Milestone 2 is accepted.",
      actionType: "VIEW_MILESTONE",
    },
    paymentState: "UNFUNDED",
    paymentStateLabel: "Unfunded (Scheduled)",
    paymentStateColor: "bg-slate-100 text-slate-600 border-slate-200",
    scopeOverview: "Load testing up to 500 webhooks/sec, pen-test report, and production deployment checklists.",
    acceptanceCriteria: [
      { id: "ac_41", criterion: "Zero memory leak under sustained 500 req/s load test", isMet: false },
      { id: "ac_42", criterion: "Pen-test sign-off on API key and webhook secret handling", isMet: false },
    ],
    deliverables: [],
    activities: [],
  },

  {
    id: "ms_ai_m1",
    number: 1,
    title: "AI Provider Gateway Isolation",
    projectId: "proj_2",
    projectName: "CloudMesh AI Gateway Unification",
    agreementVersion: "canonical_v1.0",
    canonicalSpecHash: "canonical_v1.0_#e7b1a90c",
    freelancer: {
      name: "Elena Rostova",
      role: "Full-Stack AI Architect",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80",
      rating: "5.0",
    },
    dueDate: "Nov 02, 2026",
    dueDateTimestamp: Date.now() + 3 * 86400 * 1000,
    isOverdue: false,
    daysRemainingOrOverdue: "3 days remaining",
    amount: "$1,200.00",
    currency: "USD",
    workflowStatus: "IN_PROGRESS",
    workflowStatusLabel: "In Progress",
    workflowStatusColor: "bg-blue-50 text-blue-700 border-blue-200/90",
    nextClientAction: {
      label: "Review Scope Change Delta",
      description: "Elena proposed a +$400 circuit breaker scope delta under Section 14.",
      actionType: "VIEW_MILESTONE",
    },
    paymentState: "ESCROW_FUNDED",
    paymentStateLabel: "Pre-Funded in Escrow",
    paymentStateColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paymentDetails: {
      orderId: "88AB91230C991",
      provider: "PayPal Orders v2 Sandbox",
      reconciliationStatus: "RECONCILED",
    },
    scopeOverview: "Build TypeScript unified SDK aggregating OpenAI, Gemini, and Groq streaming responses with fallback circuit breaker.",
    acceptanceCriteria: [
      { id: "ac_ai1", criterion: "Single stream interface compatible with Vercel AI SDK", isMet: true },
      { id: "ac_ai2", criterion: "Rate limit token metering per organization ID", isMet: false },
    ],
    deliverables: [],
    activities: [],
    hasScopeChangeAmendment: true,
    amendmentNotes: "Elena Rostova proposed +$400 streaming circuit breaker addition.",
  },

  {
    id: "ms_ai_m2",
    number: 2,
    title: "Semantic Vector Cache with pgvector",
    projectId: "proj_2",
    projectName: "CloudMesh AI Gateway Unification",
    agreementVersion: "canonical_v1.0",
    canonicalSpecHash: "canonical_v1.0_#e7b1a90c",
    freelancer: {
      name: "Elena Rostova",
      role: "Full-Stack AI Architect",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80",
      rating: "5.0",
    },
    dueDate: "Nov 15, 2026",
    dueDateTimestamp: Date.now() + 16 * 86400 * 1000,
    isOverdue: false,
    daysRemainingOrOverdue: "16 days remaining",
    amount: "$1,400.00",
    currency: "USD",
    workflowStatus: "UPCOMING",
    workflowStatusLabel: "Upcoming",
    workflowStatusColor: "bg-slate-100 text-slate-700 border-slate-200",
    nextClientAction: {
      label: "View Milestone Scope",
      description: "Scheduled for sprint 2 execution.",
      actionType: "VIEW_MILESTONE",
    },
    paymentState: "UNFUNDED",
    paymentStateLabel: "Unfunded",
    paymentStateColor: "bg-slate-100 text-slate-600 border-slate-200",
    scopeOverview: "Semantic similarity caching in PostgreSQL pgvector to reduce upstream LLM costs by ~40%.",
    acceptanceCriteria: [
      { id: "ac_ai21", criterion: "Cosine similarity lookup executes under 30ms for 100k embeddings", isMet: false },
    ],
    deliverables: [],
    activities: [],
  },

  {
    id: "ms_tax_m1",
    number: 1,
    title: "DAC7 Schema & Compliance Architecture",
    projectId: "proj_6",
    projectName: "Cross-Border Tax & VAT Engine Integration",
    agreementVersion: "canonical_v1.0",
    canonicalSpecHash: "canonical_v1.0_#tax98a21",
    freelancer: {
      name: "Priya Sharma",
      role: "FinTech Compliance Engineer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80",
      rating: "5.0",
    },
    dueDate: "Oct 10, 2026",
    dueDateTimestamp: Date.now() - 20 * 86400 * 1000,
    isOverdue: false,
    daysRemainingOrOverdue: "Completed Oct 10",
    amount: "$1,300.00",
    currency: "USD",
    workflowStatus: "ACCEPTED",
    workflowStatusLabel: "Accepted",
    workflowStatusColor: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
    nextClientAction: {
      label: "View Acceptance Record",
      description: "Milestone completed, released, and reconciled.",
      actionType: "VIEW_RECEIPT",
    },
    paymentState: "CAPTURED",
    paymentStateLabel: "Captured & Released",
    paymentStateColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paymentDetails: {
      orderId: "TAX_ORD_991823",
      capturedDate: "Oct 10, 2026",
      provider: "PayPal Orders v2",
      proofHash: "sha256:88fa01...33ee",
      reconciliationStatus: "RECONCILED",
    },
    scopeOverview: "European Union DAC7 compliance reporting schemas and validation models.",
    acceptanceCriteria: [
      { id: "ac_tax1", criterion: "XML and JSON export matching EU taxation schema v2.1", isMet: true },
    ],
    deliverables: [],
    activities: [],
  },

  {
    id: "ms_tax_m2",
    number: 2,
    title: "Real-Time EU VAT Calculation Worker",
    projectId: "proj_6",
    projectName: "Cross-Border Tax & VAT Engine Integration",
    agreementVersion: "canonical_v1.0",
    canonicalSpecHash: "canonical_v1.0_#tax98a21",
    freelancer: {
      name: "Priya Sharma",
      role: "FinTech Compliance Engineer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80",
      rating: "5.0",
    },
    dueDate: "Oct 20, 2026",
    dueDateTimestamp: Date.now() - 10 * 86400 * 1000,
    isOverdue: false,
    daysRemainingOrOverdue: "Completed Oct 20",
    amount: "$1,500.00",
    currency: "USD",
    workflowStatus: "ACCEPTED",
    workflowStatusLabel: "Accepted",
    workflowStatusColor: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
    nextClientAction: {
      label: "View Acceptance Record",
      description: "Milestone verified and released via PayPal capture.",
      actionType: "VIEW_RECEIPT",
    },
    paymentState: "CAPTURED",
    paymentStateLabel: "Captured & Released",
    paymentStateColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paymentDetails: {
      orderId: "TAX_ORD_991824",
      capturedDate: "Oct 20, 2026",
      provider: "PayPal Orders v2",
      proofHash: "sha256:77bb01...99ff",
      reconciliationStatus: "RECONCILED",
    },
    scopeOverview: "VIES VAT number validation API check with automated reverse-charge tax rate application.",
    acceptanceCriteria: [
      { id: "ac_tax21", criterion: "VIES SOAP service wrapper with automatic fallback cache", isMet: true },
    ],
    deliverables: [],
    activities: [],
  },

  {
    id: "ms_mobile_dispute",
    number: 2,
    title: "Offline Data Synchronization & SQLite Storage",
    projectId: "proj_8",
    projectName: "Mobile React Native Sandbox Client",
    agreementVersion: "canonical_v1.1",
    canonicalSpecHash: "canonical_v1.1_#mob8812c",
    dueDate: "Oct 22, 2026",
    dueDateTimestamp: Date.now() - 8 * 86400 * 1000,
    isOverdue: true,
    daysRemainingOrOverdue: "Dispute active since Oct 25",
    amount: "$2,200.00",
    currency: "USD",
    workflowStatus: "DISPUTED",
    workflowStatusLabel: "Disputed",
    workflowStatusColor: "bg-rose-50 text-rose-700 border-rose-200/90",
    nextClientAction: {
      label: "View Dispute Information",
      description: "Deliverables rejected due to missing background synchronization. Nexum mediation protocol active.",
      actionType: "VIEW_DISPUTE",
    },
    paymentState: "ESCROW_FUNDED",
    paymentStateLabel: "Locked in Escrow (Disputed)",
    paymentStateColor: "bg-amber-50 text-amber-800 border-amber-200",
    paymentDetails: {
      orderId: "MOB_DISP_88190",
      provider: "PayPal Orders v2 Sandbox",
      proofHash: "sha256:disp990...22aa",
      reconciliationStatus: "PENDING_WEBHOOK",
    },
    scopeOverview: "Bi-directional SQLite delta synchronization supporting intermittent cellular disconnects without data collision.",
    acceptanceCriteria: [
      { id: "ac_mob1", criterion: "CRDT conflict resolution on client and server nodes", isMet: false, notes: "CRDT resolution not implemented in submitted build." },
      { id: "ac_mob2", criterion: "Encrypted SQLite database using SQLCipher", isMet: true },
    ],
    deliverables: [
      { id: "del_mob1", title: "react-native-offline-build.apk", type: "FILE", size: "48 MB", submittedAt: "Oct 24, 2026" },
    ],
    submissionNotes: "Submitted mobile build. SQLite encryption operational.",
    correctionsRequestedNotes: "Client inspection confirmed CRDT delta synchronization requirement was unfulfilled. Work cannot sync when offline.",
    activities: [
      {
        id: "act_mob_1",
        timestamp: "Oct 25, 2:10 PM",
        actor: "Sambit Kumar",
        role: "CLIENT",
        action: "Mediation Dispute Initiated",
        details: "Deliverable failed Acceptance Criterion #1 (CRDT conflict resolution).",
        hash: "sha256:disp_event_01",
      },
    ],
  },

  {
    id: "ms_overdue_legacy",
    number: 1,
    title: "Database Partitioning & High-Volume Table Sharding",
    projectId: "proj_legacy",
    projectName: "Legacy Core Database Modernization",
    agreementVersion: "canonical_v1.0",
    canonicalSpecHash: "canonical_v1.0_#leg991",
    freelancer: {
      name: "David K.",
      role: "Distributed Database Architect",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&q=80",
      rating: "5.0",
    },
    dueDate: "Oct 26, 2026",
    dueDateTimestamp: Date.now() - 4 * 86400 * 1000,
    isOverdue: true,
    daysRemainingOrOverdue: "4 days overdue",
    amount: "$1,100.00",
    currency: "USD",
    workflowStatus: "OVERDUE",
    workflowStatusLabel: "Overdue",
    workflowStatusColor: "bg-rose-50 text-rose-700 border-rose-200/90",
    nextClientAction: {
      label: "Coordinate Schedule Adjustment",
      description: "Milestone due date passed without deliverable submission. Contact freelancer to adjust schedule.",
      actionType: "VIEW_STATUS",
    },
    paymentState: "ESCROW_FUNDED",
    paymentStateLabel: "Escrow Pre-Funded",
    paymentStateColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paymentDetails: {
      orderId: "LEG_ORD_77182",
      provider: "PayPal Orders v2 Sandbox",
      reconciliationStatus: "RECONCILED",
    },
    scopeOverview: "Partition transactions table into monthly shards with zero downtime read queries.",
    acceptanceCriteria: [
      { id: "ac_leg1", criterion: "Zero-downtime table migration executed in sandbox rehearsal", isMet: false },
    ],
    deliverables: [],
    activities: [
      {
        id: "act_leg_1",
        timestamp: "Oct 26, 11:59 PM",
        actor: "Consensus Engine",
        role: "SYSTEM",
        action: "Overdue Status Triggered",
        details: "Due timestamp elapsed without submission.",
        hash: "sha256:overdue_alert",
      },
    ],
  },
];

