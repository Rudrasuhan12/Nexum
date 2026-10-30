export interface CashFlowTrendPoint {
  date: string;
  dayOfWeek: string;
  shortDate: string;
  amount: number;
  label: string;
  x: number;
  y: number;
  isPeak?: boolean;
}

export interface PaymentTransaction {
  id: string;
  freelancerName: string;
  freelancerAvatar: string;
  freelancerRole: string;
  projectName: string;
  milestoneTitle: string;
  milestoneNumber: number;
  amount: number;
  amountDisplay: string;
  currency: string;
  date: string;
  time: string;
  status: "RELEASED" | "IN_ESCROW" | "PENDING_REVIEW" | "REFUNDED";
  statusLabel: string;
  statusColor: string;
  orderId: string;
  captureId?: string;
  refundId?: string;
  proofHash: string;
  paymentRail: string;
  receiptNumber: string;
}

export interface ProjectBudgetItem {
  id: string;
  projectName: string;
  leadFreelancer: string;
  leadAvatar: string;
  spentAmount: number;
  spentDisplay: string;
  totalBudget: number;
  totalBudgetDisplay: string;
  percentUsed: number;
  status: "ON_TRACK" | "APPROACHING_LIMIT" | "COMPLETED";
}

export interface UpcomingPaymentScheduleItem {
  id: string;
  milestoneTitle: string;
  milestoneNumber: number;
  projectName: string;
  freelancerName: string;
  freelancerAvatar: string;
  amount: number;
  amountDisplay: string;
  dueDate: string;
  timelineLabel: string;
  escrowStatus: "PRE_FUNDED" | "AWAITING_DEPOSIT" | "IN_REVIEW";
}

export const PAYMENT_KPIS = {
  totalSpent: "$24,850.00",
  totalSpentGrowth: "+23% vs last month",
  activeEscrow: "$6,400.00",
  activeEscrowProjects: "3 projects pre-funded",
  pendingPayments: "$3,670.50",
  pendingReviewCount: "2 submissions awaiting inspection",
  refundedAmount: "$1,200.00",
  refundsCount: "1 resolved mediation refund",
  escrowHealth: "100% SHA-256 Verifiable",
  paypalStatus: "PayPal Sandbox REST v2 Active",
  totalCommittedBudget: "$38,400.00",
  budgetUtilizationRate: "64.7%",
};

export const CASH_FLOW_CHART_DATA: CashFlowTrendPoint[] = [
  {
    date: "Wednesday, Feb 14, 2026",
    dayOfWeek: "Wed",
    shortDate: "Feb 14",
    amount: 2400,
    label: "$2,400.00",
    x: 40,
    y: 108,
  },
  {
    date: "Thursday, Feb 15, 2026",
    dayOfWeek: "Thu",
    shortDate: "Feb 15",
    amount: 1950,
    label: "$1,950.00",
    x: 144,
    y: 118,
  },
  {
    date: "Friday, Feb 16, 2026",
    dayOfWeek: "Fri",
    shortDate: "Feb 16",
    amount: 3800,
    label: "$3,800.00",
    x: 248,
    y: 78,
  },
  {
    date: "Sunday, Feb 18, 2026",
    dayOfWeek: "Sun",
    shortDate: "Feb 18",
    amount: 5251,
    label: "$5,251.00",
    x: 352,
    y: 46,
    isPeak: true,
  },
  {
    date: "Monday, Feb 19, 2026",
    dayOfWeek: "Mon",
    shortDate: "Feb 19",
    amount: 4200,
    label: "$4,200.00",
    x: 456,
    y: 69,
  },
  {
    date: "Tuesday, Feb 20, 2026",
    dayOfWeek: "Tue",
    shortDate: "Feb 20",
    amount: 4950,
    label: "$4,950.00",
    x: 560,
    y: 53,
  },
];

export const PROJECT_BUDGETS: ProjectBudgetItem[] = [
  {
    id: "proj_1",
    projectName: "Bilateral E-Commerce Payment Rails",
    leadFreelancer: "Rohan Verma",
    leadAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    spentAmount: 4500,
    spentDisplay: "$4,500.00",
    totalBudget: 6000,
    totalBudgetDisplay: "$6,000.00",
    percentUsed: 75,
    status: "ON_TRACK",
  },
  {
    id: "proj_2",
    projectName: "AI Educational Analytics Dashboard",
    leadFreelancer: "Priya Sharma",
    leadAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    spentAmount: 5200,
    spentDisplay: "$5,200.00",
    totalBudget: 8200,
    totalBudgetDisplay: "$8,200.00",
    percentUsed: 63,
    status: "ON_TRACK",
  },
  {
    id: "proj_3",
    projectName: "Mobile Cross-Platform Checkout SDK",
    leadFreelancer: "Nexus Engineering",
    leadAvatar: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=256&q=80",
    spentAmount: 2400,
    spentDisplay: "$2,400.00",
    totalBudget: 6000,
    totalBudgetDisplay: "$6,000.00",
    percentUsed: 40,
    status: "ON_TRACK",
  },
  {
    id: "proj_4",
    projectName: "Multi-Tenant PDF Invoice Pipeline",
    leadFreelancer: "Devendra Patel",
    leadAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80",
    spentAmount: 1200,
    spentDisplay: "$1,200.00",
    totalBudget: 3400,
    totalBudgetDisplay: "$3,400.00",
    percentUsed: 35,
    status: "ON_TRACK",
  },
];

export const UPCOMING_SCHEDULE: UpcomingPaymentScheduleItem[] = [
  {
    id: "sched_1",
    milestoneTitle: "Milestone 2: Modular Analytics Cards & Charting",
    milestoneNumber: 2,
    projectName: "AI Educational Analytics Dashboard",
    freelancerName: "Priya Sharma",
    freelancerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    amount: 2800,
    amountDisplay: "$2,800.00",
    dueDate: "Oct 29, 2026",
    timelineLabel: "Awaiting Client Approval",
    escrowStatus: "IN_REVIEW",
  },
  {
    id: "sched_2",
    milestoneTitle: "Milestone 3: Failover Simulator & Telemetry",
    milestoneNumber: 3,
    projectName: "Bilateral E-Commerce Payment Rails",
    freelancerName: "Marcus Chen",
    freelancerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    amount: 1800,
    amountDisplay: "$1,800.00",
    dueDate: "Nov 04, 2026",
    timelineLabel: "Due in 5 days",
    escrowStatus: "PRE_FUNDED",
  },
  {
    id: "sched_3",
    milestoneTitle: "Milestone 2: Automated Puppeteer Worker Pool",
    milestoneNumber: 2,
    projectName: "Multi-Tenant PDF Invoice Pipeline",
    freelancerName: "Devendra Patel",
    freelancerAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80",
    amount: 1000,
    amountDisplay: "$1,000.00",
    dueDate: "Nov 12, 2026",
    timelineLabel: "Due in 13 days",
    escrowStatus: "AWAITING_DEPOSIT",
  },
];

export const PAYMENT_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: "tx_1",
    freelancerName: "Rohan Verma",
    freelancerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    freelancerRole: "Payment Rails Specialist",
    projectName: "Bilateral E-Commerce Payment Rails",
    milestoneTitle: "Milestone 2: Webhook Engine & Idempotency Cache",
    milestoneNumber: 2,
    amount: 1500.0,
    amountDisplay: "$1,500.00 USD",
    currency: "USD",
    date: "Oct 24, 2026",
    time: "08:30 AM",
    status: "RELEASED",
    statusLabel: "RELEASED",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    orderId: "6DE714998H998261C",
    captureId: "9AB12891902214C",
    proofHash: "0x9f8c2b7e411b6d08a3f89e210c8541a",
    paymentRail: "PayPal REST API v2 Sandbox",
    receiptNumber: "REC-2026-0891",
  },
  {
    id: "tx_2",
    freelancerName: "Priya Sharma",
    freelancerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    freelancerRole: "UI/UX & Design Systems Architect",
    projectName: "AI Educational Analytics Dashboard",
    milestoneTitle: "Milestone 1: Design Tokens & Component Hierarchy",
    milestoneNumber: 1,
    amount: 2400.0,
    amountDisplay: "$2,400.00 USD",
    currency: "USD",
    date: "Oct 22, 2026",
    time: "11:15 AM",
    status: "RELEASED",
    statusLabel: "RELEASED",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    orderId: "5DD776655M998811F",
    captureId: "3AA55443311229G",
    proofHash: "0x77ab1289cd349012beef7890ac3491e",
    paymentRail: "PayPal REST API v2 Sandbox",
    receiptNumber: "REC-2026-0842",
  },
  {
    id: "tx_3",
    freelancerName: "Marcus Chen",
    freelancerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    freelancerRole: "Cloud Infrastructure Engineer",
    projectName: "Bilateral E-Commerce Payment Rails",
    milestoneTitle: "Milestone 3: Failover Simulator & Telemetry",
    milestoneNumber: 3,
    amount: 1800.0,
    amountDisplay: "$1,800.00 USD",
    currency: "USD",
    date: "Oct 28, 2026",
    time: "03:45 PM",
    status: "IN_ESCROW",
    statusLabel: "IN ESCROW",
    statusColor: "bg-blue-50 text-blue-700 border-blue-200",
    orderId: "7CC889912L001923A",
    proofHash: "0x24ff9001ba778129ccbb3410de9912a",
    paymentRail: "PayPal REST API v2 Sandbox",
    receiptNumber: "REC-2026-0904",
  },
  {
    id: "tx_4",
    freelancerName: "Priya Sharma",
    freelancerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    freelancerRole: "UI/UX & Design Systems Architect",
    projectName: "AI Educational Analytics Dashboard",
    milestoneTitle: "Milestone 2: Modular Analytics Cards & Charting",
    milestoneNumber: 2,
    amount: 2800.0,
    amountDisplay: "$2,800.00 USD",
    currency: "USD",
    date: "Oct 29, 2026",
    time: "09:20 AM",
    status: "PENDING_REVIEW",
    statusLabel: "IN REVIEW",
    statusColor: "bg-amber-50 text-amber-700 border-amber-200",
    orderId: "2EE443322N887766H",
    proofHash: "0x89ee1209ccdd4511aabb2233001198f",
    paymentRail: "PayPal REST API v2 Sandbox",
    receiptNumber: "REC-2026-0919",
  },
  {
    id: "tx_5",
    freelancerName: "Rohan Verma",
    freelancerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    freelancerRole: "Payment Rails Specialist",
    projectName: "Bilateral E-Commerce Payment Rails",
    milestoneTitle: "Milestone 1: Core PayPal REST v2 API Client",
    milestoneNumber: 1,
    amount: 1200.0,
    amountDisplay: "$1,200.00 USD",
    currency: "USD",
    date: "Oct 16, 2026",
    time: "02:10 PM",
    status: "RELEASED",
    statusLabel: "RELEASED",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    orderId: "4AB912389K112233D",
    captureId: "8BB11234400122E",
    proofHash: "0x12ff3399aa441122ee776655110099b",
    paymentRail: "PayPal REST API v2 Sandbox",
    receiptNumber: "REC-2026-0774",
  },
  {
    id: "tx_6",
    freelancerName: "Nexus Engineering",
    freelancerAvatar: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=256&q=80",
    freelancerRole: "Mobile Development Studio",
    projectName: "Mobile Cross-Platform Checkout SDK",
    milestoneTitle: "Milestone 1: Security Scope Definition (Withdrawn)",
    milestoneNumber: 1,
    amount: 1200.0,
    amountDisplay: "$1,200.00 USD",
    currency: "USD",
    date: "Oct 08, 2026",
    time: "04:50 PM",
    status: "REFUNDED",
    statusLabel: "REFUNDED",
    statusColor: "bg-purple-50 text-purple-700 border-purple-200",
    orderId: "8GG221100Q665544K",
    refundId: "ref_9921820129a",
    proofHash: "0x44dd2200ff113344cc998877556633a",
    paymentRail: "PayPal REST API v2 Sandbox",
    receiptNumber: "REC-2026-0612",
  },
];
