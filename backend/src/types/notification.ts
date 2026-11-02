/**
 * Nexum Notification & Queue Type Definitions
 * Covers all event triggers across Deliverables, Bilateral PayPal Escrow,
 * AI Mediation & Scope Changes, Dual SHA-256 State Consensus, and Proposals.
 */

export type NotificationType =
  | "DELIVERABLE"
  | "PAYMENT"
  | "CHANGE_REQUEST"
  | "CONSENSUS"
  | "MILESTONE"
  | "DISPUTE"
  | "PROPOSAL"
  | "SYSTEM"
  | "MESSAGE";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type NotificationJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "DEAD_LETTER";

export interface AppNotification {
  id: string;
  userId?: string;
  role: "CLIENT" | "FREELANCER" | "OPERATOR" | "ALL";
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  projectName?: string;
  projectId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationJob {
  id: string;
  eventName: string;
  recipientUserId?: string;
  recipientRole?: "CLIENT" | "FREELANCER" | "OPERATOR" | "ALL";
  payload: Omit<AppNotification, "id" | "createdAt" | "updatedAt">;
  status: NotificationJobStatus;
  attempts: number;
  maxAttempts: number;
  nextRunAt: number; // epoch ms
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDeadLetter {
  id: string;
  originalJobId: string;
  eventName: string;
  recipientUserId?: string;
  recipientRole?: "CLIENT" | "FREELANCER" | "OPERATOR" | "ALL";
  payload: Record<string, unknown>;
  errorReason: string;
  stackTrace?: string;
  attempts: number;
  failedAt: string;
  replayedAt?: string;
  replayedBy?: string;
}

export interface EnqueueNotificationInput {
  eventName: string;
  recipientUserId?: string;
  recipientRole?: "CLIENT" | "FREELANCER" | "OPERATOR" | "ALL";
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  projectName?: string;
  projectId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  maxAttempts?: number;
  /** For testing & DLQ verification: set to true to force simulated worker delivery failure */
  simulateDeliveryFailure?: boolean;
}

export interface QueueStats {
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  deadLettersCount: number;
  totalNotifications: number;
}

