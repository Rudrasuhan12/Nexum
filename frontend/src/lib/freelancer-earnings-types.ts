export type TransactionStatus = "Received" | "Under Review" | "Pending" | "Completed" | "Failed";

export type TransactionType = "Milestone" | "Project" | "Payout" | "Fee";

export interface FreelancerTransaction {
  id: string;
  date: string;
  rawDate: string; // ISO date for filtering
  description: string;
  subtitle: string;
  project: string;
  client: string;
  projectIcon: "shopping-bag" | "bar-chart-2" | "bot" | "smartphone" | "graduation-cap" | "paypal" | "receipt";
  type: TransactionType;
  amount: number;
  formattedAmount: string;
  isCredit: boolean;
  status: TransactionStatus;
  statusVariant: "green" | "amber" | "purple" | "red";
  proofHash: string;
  paymentRail: string;
  orderId?: string;
  captureId?: string | null;
  feeDeducted?: number;
  netAmount?: number;
}

export interface MonthlyEarningPoint {
  month: string;
  shortMonth: string;
  year: number;
  received: number; // in INR
  pending: number; // in INR
  formattedReceived: string;
  formattedPending: string;
  total: number;
}

export interface ProjectCategoryShare {
  name: string;
  percentage: number;
  amount: number;
  formattedAmount: string;
  color: string;
}

export interface FreelancerEarningsKpis {
  totalEarnings: number;
  totalEarningsDisplay: string;
  completedProjectsCount: number;
  pendingAmount: number;
  pendingAmountDisplay: string;
  milestonesUnderReviewCount: number;
  availableForPayout: number;
  availableForPayoutDisplay: string;
  readyToWithdraw: boolean;
  totalWithdrawn: number;
  totalWithdrawnDisplay: string;
  successfulPayoutsCount: number;
  currency: string;
}

export interface PayoutSettings {
  provider: "PayPal";
  accountEmail: string;
  connectionStatus: "Connected" | "Action Required" | "Disconnected";
  connectedDate: string;
  environment: "Sandbox" | "Production";
  merchantId?: string;
}

export interface PayoutPreferences {
  minimumPayoutAmount: number;
  formattedMinimumPayout: string;
  autoPayoutEnabled: boolean;
  payoutFrequency: "Daily" | "Weekly" | "Bi-weekly" | "Monthly";
}

export interface VerificationItem {
  id: string;
  title: string;
  subtitle?: string;
  isVerified: boolean;
  badgeLabel: string;
  verificationType: "email" | "identity" | "paypal";
  verifiedAt?: string;
}

export interface FreelancerInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientCompany: string;
  projectName: string;
  amount: number;
  formattedAmount: string;
  status: "PAID" | "PENDING" | "PROCESSING";
  downloadUrl?: string;
}

export interface FreelancerProjectEarningsSummary {
  id: string;
  projectName: string;
  clientName: string;
  category: string;
  totalEarned: number;
  formattedTotalEarned: string;
  milestonesCompleted: number;
  totalMilestones: number;
  status: "ACTIVE" | "COMPLETED";
}

