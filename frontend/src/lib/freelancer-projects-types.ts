/**
 * Nexum Freelancer Projects & Milestones Types
 * Defines data structures for the Freelancer My Projects dashboard.
 *
 * Enforces strict separation of:
 * 1. Work status (MilestoneWorkStatus) - Progress of deliverables and client review
 * 2. Payment status (MilestonePaymentStatus) - Escrow funding and payout release state
 */

export type ProjectLifecycleStatus =
  | "ALL"
  | "ACTIVE"
  | "AWAITING_APPROVAL"
  | "COMPLETED"
  | "CANCELLED";

export type MilestoneWorkStatus =
  | "UPCOMING"
  | "IN_PROGRESS"
  | "READY_TO_SUBMIT"
  | "AWAITING_CLIENT_REVIEW"
  | "REVISIONS_REQUESTED"
  | "ACCEPTED"
  | "DISPUTED"
  | "OVERDUE";

export type MilestonePaymentStatus =
  | "NOT_FUNDED"
  | "FUNDING_PENDING"
  | "SANDBOX_CAPTURE_CONFIRMED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_PROCESSING"
  | "ELIGIBLE_FOR_PAYOUT"
  | "PAYOUT_COMPLETED"
  | "FAILED"
  | "ON_HOLD";

export type TaskStatus =
  | "TO_DO"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "COMPLETED"
  | "BLOCKED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  relatedMilestoneId: string;
  milestoneTitle: string;
  completed: boolean;
}

export interface ProjectFile {
  id: string;
  name: string;
  fileType: string;
  fileSize: string;
  uploadedBy: "CLIENT" | "FREELANCER" | "SYSTEM";
  uploadedByName: string;
  uploadDate: string;
  relatedMilestoneTitle?: string;
  downloadUrl?: string;
}

export interface MilestoneSubmission {
  id: string;
  submissionDate: string;
  versionNumber: number;
  completionNote: string;
  deliverableDescription: string;
  githubPrUrl?: string;
  demoUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  criteriaChecked: string[];
  clientFeedback?: {
    decision: "ACCEPTED" | "REVISIONS_REQUESTED" | "DISPUTED";
    feedbackMessage: string;
    reviewedAt: string;
    reviewedByName: string;
    requestedChanges?: string[];
  };
}

export interface ProjectMilestone {
  id: string;
  number: number;
  title: string;
  description: string;
  deliverablesSummary: string;
  acceptanceCriteria: string[];
  amountCents: number; // In minor units (e.g. 2000000 for ₹20,000)
  amountDisplay: string; // e.g. "₹20,000"
  currency: string;
  dueDate: string;
  submittedAt?: string;
  approvedAt?: string;
  lastReviewDate?: string;
  workStatus: MilestoneWorkStatus;
  paymentStatus: MilestonePaymentStatus;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  fundingRule?: string;
  submissions: MilestoneSubmission[];
}

export interface ProjectProgressStep {
  id: string;
  title: string;
  status: "COMPLETED" | "CURRENT" | "PENDING";
}

export interface ProjectNextAction {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionType: "MESSAGE" | "REMINDER" | "MEETING" | "SUBMIT";
  iconType: "MESSAGE" | "DOCUMENT" | "CALENDAR";
}

export interface FreelancerProjectItem {
  id: string;
  title: string;
  description: string;
  state: ProjectLifecycleStatus;
  statusLabel: string;
  statusBadgeColor: string;
  client: {
    id: string;
    name: string;
    companyName: string;
    verified: boolean;
    avatarLetter: string;
    avatarBg: string;
    email?: string;
  };
  startDate: string;
  dueDate: string;
  completedDate?: string;
  totalBudgetCents: number;
  totalBudgetDisplay: string;
  currency: string;
  pricingType: "FIXED_PRICE" | "HOURLY";
  agreementVersion: string;
  progressPercent: number;
  techTags: string[];
  thumbnailType: "IMAGE_MOCK" | "AI_ICON" | "CERT_ICON" | "GENERIC";
  thumbnailUrl?: string;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  files: ProjectFile[];
  progressSteps: ProjectProgressStep[];
  nextActions: ProjectNextAction[];
}

export interface ProjectSummaryKPIs {
  totalProjects: number;
  activeProjects: number;
  awaitingApproval: number;
  completedProjects: number;
  cancelledProjects: number;
}

