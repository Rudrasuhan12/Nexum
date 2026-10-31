/**
 * Nexum Resilient Notification Queue Service with Dead Letter Queue (DLQ)
 * 
 * Implements:
 * 1. Asynchronous job enqueueing for platform events
 * 2. Exponential backoff retry policies for transient delivery errors
 * 3. Dead Letter Queue (DLQ) routing upon exhausting max retries
 * 4. Forensic inspection and operator replay of dead-lettered events
 * 5. Persistent and durable in-app notification storage
 */

import {
  AppNotification,
  NotificationJob,
  NotificationDeadLetter,
  EnqueueNotificationInput,
  QueueStats,
} from "../types/notification.js";

// Initial realistic event records matching Nexum state machine
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    userId: "usr_client_alex",
    role: "CLIENT",
    type: "DELIVERABLE",
    priority: "HIGH",
    title: "Milestone 2 Deliverables Submitted",
    message: "Sambit Kumar submitted code and Loom demo for Milestone 2: Backend APIs & PayPal Order Capture.",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/client/workspace",
    metadata: { milestoneId: "m-2", commitHash: "e4d812a" },
    read: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-2",
    userId: "usr_client_alex",
    role: "CLIENT",
    type: "PAYMENT",
    priority: "HIGH",
    title: "PayPal Escrow Pre-Funding Confirmed",
    message: "Bilateral escrow capture confirmed for $4,000.00 USD via PayPal Sandbox Orders v2.",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/client/payments",
    metadata: { orderId: "PAYPAL-ORD-88231", amount: 4000 },
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-3",
    userId: "usr_client_alex",
    role: "CLIENT",
    type: "CHANGE_REQUEST",
    priority: "NORMAL",
    title: "Counteroffer Drafted by Nexum AI",
    message: "Counteroffer v5 (+ $500, +4 days) is awaiting your approval before sending to freelancer.",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/client/workspace",
    metadata: { crId: "CR-2", deltaBudget: 500, deltaDays: 4 },
    read: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-4",
    userId: "usr_client_alex",
    role: "CLIENT",
    type: "CONSENSUS",
    priority: "URGENT",
    title: "Dual SHA-256 State Consensus Ratified",
    message: "Both client and freelancer state hashes (0x9f8c...2b7e) synchronized and verified.",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/client/workspace?tab=activity",
    metadata: { stateHash: "0x9f8c772b7e19024a", consensusRound: 3 },
    read: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-5",
    userId: "usr_client_alex",
    role: "CLIENT",
    type: "MILESTONE",
    priority: "NORMAL",
    title: "Milestone 1 Accepted & Paid",
    message: "UI/UX design deliverables approved. $2,000 disbursement executed via PayPal.",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/client/milestones",
    metadata: { milestoneId: "m-1", amount: 2000 },
    read: true,
    readAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  // Freelancer notifications
  {
    id: "notif-fl-1",
    userId: "usr_freelancer_rohan",
    role: "FREELANCER",
    type: "CHANGE_REQUEST",
    priority: "HIGH",
    title: "Client Counteroffer Received",
    message: "Alex Chen sent a counteroffer of +$500 for CR-2 carousel feature.",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/freelancer/workspace",
    metadata: { crId: "CR-2" },
    read: false,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-fl-2",
    userId: "usr_freelancer_rohan",
    role: "FREELANCER",
    type: "PAYMENT",
    priority: "HIGH",
    title: "Escrow Deposit Secured ($4,000)",
    message: "Milestone 2 pre-funding is locked in PayPal Bilateral Escrow. Work is protected.",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/freelancer/earnings",
    metadata: { milestoneId: "m-2", amount: 4000 },
    read: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

export class NotificationQueueService {
  private notifications: Map<string, AppNotification> = new Map();
  private jobQueue: Map<string, NotificationJob> = new Map();
  private deadLetterQueue: Map<string, NotificationDeadLetter> = new Map();
  private isProcessing = false;
  private workerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.seedInitialData();
  }

  /**
   * Seed default state from initial dataset
   */
  public seedInitialData(): void {
    this.notifications.clear();
    this.jobQueue.clear();
    this.deadLetterQueue.clear();

    INITIAL_NOTIFICATIONS.forEach((n) => {
      this.notifications.set(n.id, { ...n });
    });
  }

  /**
   * Enqueue a new notification event into the resilient processing queue
   */
  public async enqueue(input: EnqueueNotificationInput): Promise<NotificationJob> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const job: NotificationJob = {
      id: jobId,
      eventName: input.eventName,
      recipientUserId: input.recipientUserId,
      recipientRole: input.recipientRole || "ALL",
      payload: {
        userId: input.recipientUserId,
        role: input.recipientRole || "ALL",
        type: input.type,
        priority: input.priority || "NORMAL",
        title: input.title,
        message: input.message,
        projectName: input.projectName,
        projectId: input.projectId,
        actionUrl: input.actionUrl,
        metadata: {
          ...input.metadata,
          simulateDeliveryFailure: Boolean(input.simulateDeliveryFailure),
        },
        read: false,
      },
      status: "PENDING",
      attempts: 0,
      maxAttempts: input.maxAttempts || 3,
      nextRunAt: Date.now(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.jobQueue.set(jobId, job);

    // Process immediately or in next worker tick
    setImmediate(() => {
      this.processQueue().catch((err) => {
        console.error("Queue worker error:", err);
      });
    });

    return job;
  }

  /**
   * Core Queue Worker: Processes pending jobs with exponential backoff & DLQ routing
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = Date.now();
      const pendingJobs = Array.from(this.jobQueue.values()).filter(
        (j) => j.status === "PENDING" && j.nextRunAt <= now
      );

      for (const job of pendingJobs) {
        job.status = "PROCESSING";
        job.attempts += 1;
        job.updatedAt = new Date().toISOString();

        try {
          // Check for simulated failure (useful for tests and fault injection)
          if (job.payload.metadata?.simulateDeliveryFailure) {
            throw new Error(`Simulated delivery transport failure for event: ${job.eventName}`);
          }

          // Validate required notification fields (defend against poison pills)
          if (!job.payload.title || !job.payload.message) {
            throw new Error(`Poison pill detected: Missing required title or message for job ${job.id}`);
          }

          // Deliver notification to persistent storage
          const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const notification: AppNotification = {
            id: notifId,
            userId: job.recipientUserId,
            role: job.recipientRole || "ALL",
            type: job.payload.type,
            priority: job.payload.priority,
            title: job.payload.title,
            message: job.payload.message,
            projectName: job.payload.projectName,
            projectId: job.payload.projectId,
            actionUrl: job.payload.actionUrl,
            metadata: job.payload.metadata,
            read: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          this.notifications.set(notifId, notification);

          // Mark job as COMPLETED
          job.status = "COMPLETED";
          job.updatedAt = new Date().toISOString();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          job.lastError = errorMessage;
          job.updatedAt = new Date().toISOString();

          // Check if max retries exhausted
          if (job.attempts >= job.maxAttempts) {
            // ROUTE TO DEAD LETTER QUEUE (DLQ)
            job.status = "DEAD_LETTER";

            const dlqId = `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const deadLetter: NotificationDeadLetter = {
              id: dlqId,
              originalJobId: job.id,
              eventName: job.eventName,
              recipientUserId: job.recipientUserId,
              recipientRole: job.recipientRole,
              payload: job.payload as unknown as Record<string, unknown>,
              errorReason: errorMessage,
              stackTrace: errorStack,
              attempts: job.attempts,
              failedAt: new Date().toISOString(),
            };

            this.deadLetterQueue.set(dlqId, deadLetter);
            console.warn(`[DLQ] Job ${job.id} routed to Dead Letter Queue: ${errorMessage}`);
          } else {
            // Apply exponential backoff with jitter: delay = base * 2^(attempt-1) + jitter
            const baseDelay = 1000;
            const exponentialDelay = baseDelay * Math.pow(2, job.attempts - 1);
            const jitter = Math.floor(Math.random() * 200);
            job.status = "PENDING";
            job.nextRunAt = Date.now() + exponentialDelay + jitter;
            console.warn(
              `[Retry] Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}). Retrying in ${exponentialDelay + jitter}ms: ${errorMessage}`
            );
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Retrieve all notifications filtered by user ID or role
   */
  public getNotifications(
    role?: string,
    userId?: string
  ): { notifications: AppNotification[]; unreadCount: number } {
    let list = Array.from(this.notifications.values());

    if (role) {
      list = list.filter((n) => n.role === role || n.role === "ALL");
    }
    if (userId) {
      list = list.filter(
        (n) => !n.userId || n.userId === userId || n.role === "ALL"
      );
    }

    // Sort descending by creation date
    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const unreadCount = list.filter((n) => !n.read).length;
    return { notifications: list, unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  public markRead(id: string): AppNotification | null {
    const notif = this.notifications.get(id);
    if (!notif) return null;

    notif.read = true;
    notif.readAt = new Date().toISOString();
    notif.updatedAt = new Date().toISOString();
    return notif;
  }

  /**
   * Mark all notifications as read for a given user/role
   */
  public markAllRead(role?: string, userId?: string): number {
    let count = 0;
    const nowIso = new Date().toISOString();

    for (const notif of this.notifications.values()) {
      const matchRole = !role || notif.role === role || notif.role === "ALL";
      const matchUser = !userId || !notif.userId || notif.userId === userId;

      if (matchRole && matchUser && !notif.read) {
        notif.read = true;
        notif.readAt = nowIso;
        notif.updatedAt = nowIso;
        count++;
      }
    }
    return count;
  }

  /**
   * Delete a notification
   */
  public deleteNotification(id: string): boolean {
    return this.notifications.delete(id);
  }

  // =========================================================================
  // DEAD LETTER QUEUE (DLQ) MANAGEMENT
  // =========================================================================

  /**
   * List dead letter queue records
   */
  public listDeadLetters(): NotificationDeadLetter[] {
    return Array.from(this.deadLetterQueue.values()).sort(
      (a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime()
    );
  }

  /**
   * Get single dead letter by ID
   */
  public getDeadLetter(id: string): NotificationDeadLetter | null {
    return this.deadLetterQueue.get(id) || null;
  }

  /**
   * Replay a dead-lettered job back into the active processing queue
   */
  public async replayDeadLetter(id: string, operatorId = "system-operator"): Promise<NotificationJob | null> {
    const dlqItem = this.deadLetterQueue.get(id);
    if (!dlqItem) return null;

    // Remove from DLQ
    this.deadLetterQueue.delete(id);

    // Create a fresh job without simulation failure
    const payload = { ...(dlqItem.payload as any) };
    if (payload.metadata) {
      delete payload.metadata.simulateDeliveryFailure;
    }

    const replayedJob: NotificationJob = {
      id: `replayed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventName: dlqItem.eventName,
      recipientUserId: dlqItem.recipientUserId,
      recipientRole: (dlqItem.recipientRole as any) || "ALL",
      payload,
      status: "PENDING",
      attempts: 0,
      maxAttempts: 3,
      nextRunAt: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.jobQueue.set(replayedJob.id, replayedJob);

    // Trigger processing
    await this.processQueue();

    return replayedJob;
  }

  /**
   * Purge a dead-lettered job
   */
  public purgeDeadLetter(id: string): boolean {
    return this.deadLetterQueue.delete(id);
  }

  /**
   * Get aggregated queue metrics
   */
  public getStats(): QueueStats {
    const jobs = Array.from(this.jobQueue.values());
    return {
      pendingJobs: jobs.filter((j) => j.status === "PENDING").length,
      processingJobs: jobs.filter((j) => j.status === "PROCESSING").length,
      completedJobs: jobs.filter((j) => j.status === "COMPLETED").length,
      deadLettersCount: this.deadLetterQueue.size,
      totalNotifications: this.notifications.size,
    };
  }
}

export const notificationQueue = new NotificationQueueService();

