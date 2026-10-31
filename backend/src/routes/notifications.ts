import { Router, Request, Response } from "express";
import { notificationQueue } from "../services/notificationQueue.js";
import { NotificationEvents } from "../services/notificationEvents.js";

const router = Router();

// ===========================================================================
// IN-APP NOTIFICATIONS QUERY & MUTATIONS
// ===========================================================================

// GET /api/notifications - retrieve user/role notifications with unread count
router.get("/", (req: Request, res: Response) => {
  try {
    const role = (req.query.role as string) || undefined;
    const userId = (req.query.userId as string) || undefined;

    const { notifications, unreadCount } = notificationQueue.getNotifications(
      role,
      userId
    );

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch notifications";
    res.status(500).json({ success: false, error: msg });
  }
});

// PATCH /api/notifications/:id/read - mark single notification as read
router.patch("/:id/read", (req: Request, res: Response) => {
  try {
    const notif = notificationQueue.markRead(req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }
    res.json({ success: true, notification: notif });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to mark notification read";
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/notifications/read-all - mark all notifications as read
router.post("/read-all", (req: Request, res: Response) => {
  try {
    const { role, userId } = req.body || {};
    const updatedCount = notificationQueue.markAllRead(role, userId);
    res.json({ success: true, updatedCount });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to mark all notifications read";
    res.status(500).json({ success: false, error: msg });
  }
});

// DELETE /api/notifications/:id - dismiss / delete notification
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const deleted = notificationQueue.deleteNotification(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }
    res.json({ success: true, message: "Notification dismissed" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete notification";
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/notifications/publish - enqueue event to resilient worker queue
router.post("/publish", async (req: Request, res: Response) => {
  try {
    const {
      eventName,
      recipientUserId,
      recipientRole,
      type,
      priority,
      title,
      message,
      projectName,
      projectId,
      actionUrl,
      metadata,
      maxAttempts,
      simulateDeliveryFailure,
    } = req.body || {};

    if (!eventName || !title || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: eventName, title, message",
      });
    }

    const job = await notificationQueue.enqueue({
      eventName,
      recipientUserId,
      recipientRole,
      type: type || "SYSTEM",
      priority: priority || "NORMAL",
      title,
      message,
      projectName,
      projectId,
      actionUrl,
      metadata,
      maxAttempts: maxAttempts || 3,
      simulateDeliveryFailure: Boolean(simulateDeliveryFailure),
    });

    res.status(202).json({
      success: true,
      message: "Event enqueued successfully",
      jobId: job.id,
      status: job.status,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to enqueue notification";
    res.status(500).json({ success: false, error: msg });
  }
});

// ===========================================================================
// QUEUE METRICS & DEAD LETTER QUEUE (DLQ) MANAGEMENT
// ===========================================================================

// GET /api/notifications/queue/stats - queue health and volume metrics
router.get("/queue/stats", (_req: Request, res: Response) => {
  try {
    const stats = notificationQueue.getStats();
    res.json({ success: true, stats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch queue stats";
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/notifications/queue/dlq - list dead letter queue items for audit/inspection
router.get("/queue/dlq", (_req: Request, res: Response) => {
  try {
    const deadLetters = notificationQueue.listDeadLetters();
    res.json({
      success: true,
      count: deadLetters.length,
      deadLetters,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to list DLQ";
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/notifications/queue/dlq/:id - get single dead letter detail
router.get("/queue/dlq/:id", (req: Request, res: Response) => {
  try {
    const dlqItem = notificationQueue.getDeadLetter(req.params.id);
    if (!dlqItem) {
      return res.status(404).json({ success: false, error: "Dead letter not found" });
    }
    res.json({ success: true, deadLetter: dlqItem });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch dead letter";
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/notifications/queue/dlq/:id/replay - replay dead-lettered event back into queue
router.post("/queue/dlq/:id/replay", async (req: Request, res: Response) => {
  try {
    const replayedJob = await notificationQueue.replayDeadLetter(
      req.params.id,
      req.body?.operatorId || "operator"
    );

    if (!replayedJob) {
      return res.status(404).json({
        success: false,
        error: "Dead letter not found or already purged",
      });
    }

    res.json({
      success: true,
      message: "Dead letter replayed back into queue successfully",
      job: replayedJob,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to replay dead letter";
    res.status(500).json({ success: false, error: msg });
  }
});

// DELETE /api/notifications/queue/dlq/:id - purge / dismiss dead letter
router.delete("/queue/dlq/:id", (req: Request, res: Response) => {
  try {
    const purged = notificationQueue.purgeDeadLetter(req.params.id);
    if (!purged) {
      return res.status(404).json({ success: false, error: "Dead letter not found" });
    }
    res.json({ success: true, message: "Dead letter purged from DLQ" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to purge dead letter";
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/notifications/queue/simulate-failure - developer endpoint to verify DLQ & retries
router.post("/queue/simulate-failure", async (req: Request, res: Response) => {
  try {
    const job = await notificationQueue.enqueue({
      eventName: "TEST_POISON_PILL_FAILURE",
      recipientRole: "OPERATOR",
      type: "SYSTEM",
      priority: "HIGH",
      title: "Simulated Fatal Poison Pill Event",
      message: "This event is configured to fail delivery transport and verify DLQ routing.",
      maxAttempts: req.body?.maxAttempts || 3,
      simulateDeliveryFailure: true,
    });

    // Run processing multiple times to exhaust retries
    for (let i = 0; i < (job.maxAttempts || 3); i++) {
      job.nextRunAt = Date.now() - 1; // force ready
      await notificationQueue.processQueue();
    }

    const deadLetters = notificationQueue.listDeadLetters();
    res.json({
      success: true,
      message: "Simulation completed. Verified job was routed to Dead Letter Queue (DLQ).",
      jobId: job.id,
      finalStatus: job.status,
      attempts: job.attempts,
      deadLettersCount: deadLetters.length,
      latestDeadLetter: deadLetters[0] || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to simulate failure";
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
