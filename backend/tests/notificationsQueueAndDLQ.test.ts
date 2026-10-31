import { describe, it, expect, beforeEach } from "vitest";
import { notificationQueue } from "../src/services/notificationQueue.js";
import { NotificationEvents } from "../src/services/notificationEvents.js";

describe("Nexum Resilient Notification Queue & Dead Letter Queue (DLQ)", () => {
  beforeEach(() => {
    notificationQueue.seedInitialData();
  });

  it("should have pre-seeded initial notifications matching the platform consensus state", () => {
    const { notifications, unreadCount } = notificationQueue.getNotifications("CLIENT");
    expect(notifications.length).toBeGreaterThanOrEqual(4);
    expect(unreadCount).toBe(4);
  });

  it("should successfully enqueue and process a deliverable submitted event", async () => {
    const job = await NotificationEvents.deliverableSubmitted({
      clientId: "usr_client_alex",
      freelancerName: "Sambit Kumar",
      milestoneNumber: 3,
      projectName: "TechKart – E-commerce Website",
      projectId: "p-101",
    });

    expect(job).toBeDefined();
    expect(job.status).toBe("PENDING");

    // Process queue
    await notificationQueue.processQueue();

    expect(job.status).toBe("COMPLETED");

    const { notifications } = notificationQueue.getNotifications("CLIENT", "usr_client_alex");
    const latest = notifications[0];
    expect(latest.title).toContain("Milestone 3 Deliverable Submitted");
    expect(latest.type).toBe("DELIVERABLE");
    expect(latest.priority).toBe("HIGH");
  });

  it("should automatically retry transient delivery failures with exponential backoff", async () => {
    const job = await notificationQueue.enqueue({
      eventName: "TEST_TRANSIENT_EVENT",
      recipientRole: "CLIENT",
      type: "SYSTEM",
      title: "Transient Flaky Delivery Event",
      message: "This will fail on attempt 1",
      maxAttempts: 3,
      simulateDeliveryFailure: true,
    });

    expect(job.attempts).toBe(0);

    // Attempt 1: Process queue
    await notificationQueue.processQueue();
    expect(job.attempts).toBe(1);
    expect(job.status).toBe("PENDING");
    expect(job.nextRunAt).toBeGreaterThan(Date.now() - 100);
    expect(notificationQueue.listDeadLetters().length).toBe(0);
  });

  it("should route jobs to the Dead Letter Queue (DLQ) when all retries are exhausted", async () => {
    const job = await notificationQueue.enqueue({
      eventName: "FATAL_POISON_PILL_EVENT",
      recipientRole: "OPERATOR",
      type: "SYSTEM",
      title: "Corrupted Payload Event",
      message: "Simulating fatal delivery error",
      maxAttempts: 3,
      simulateDeliveryFailure: true,
    });

    // Run until max attempts exhausted
    for (let i = 0; i < 3; i++) {
      job.nextRunAt = Date.now() - 1; // force ready
      await notificationQueue.processQueue();
    }

    expect(job.attempts).toBe(3);
    expect(job.status).toBe("DEAD_LETTER");

    // Verify presence in DLQ
    const deadLetters = notificationQueue.listDeadLetters();
    expect(deadLetters.length).toBeGreaterThanOrEqual(1);

    const targetDlq = deadLetters.find((d) => d.originalJobId === job.id);
    expect(targetDlq).toBeDefined();
    expect(targetDlq?.errorReason).toContain("Simulated delivery transport failure");
    expect(targetDlq?.attempts).toBe(3);
  });

  it("should allow an operator to replay a dead-lettered job back into the queue", async () => {
    // 1. Create a dead letter
    const job = await notificationQueue.enqueue({
      eventName: "REPLAYABLE_FAILED_EVENT",
      recipientUserId: "usr_client_alex",
      recipientRole: "CLIENT",
      type: "CONSENSUS",
      title: "Consensus Event To Replay",
      message: "Testing replay mechanics",
      maxAttempts: 2,
      simulateDeliveryFailure: true,
    });

    for (let i = 0; i < 2; i++) {
      job.nextRunAt = Date.now() - 1;
      await notificationQueue.processQueue();
    }

    expect(job.status).toBe("DEAD_LETTER");
    const deadLetters = notificationQueue.listDeadLetters();
    const targetDlq = deadLetters.find((d) => d.originalJobId === job.id);
    expect(targetDlq).toBeDefined();

    // 2. Replay the dead letter
    const replayedJob = await notificationQueue.replayDeadLetter(targetDlq!.id, "admin-operator");
    expect(replayedJob).toBeDefined();
    expect(replayedJob?.status).toBe("COMPLETED");

    // 3. Verify it was removed from DLQ and added to active notifications
    const updatedDeadLetters = notificationQueue.listDeadLetters();
    expect(updatedDeadLetters.some((d) => d.id === targetDlq!.id)).toBe(false);

    const { notifications } = notificationQueue.getNotifications("CLIENT", "usr_client_alex");
    expect(notifications.some((n) => n.title === "Consensus Event To Replay")).toBe(true);
  });

  it("should correctly mark single and all notifications as read", () => {
    // Mark one read
    const single = notificationQueue.markRead("notif-1");
    expect(single?.read).toBe(true);

    const { unreadCount: countAfterOne } = notificationQueue.getNotifications("CLIENT");
    expect(countAfterOne).toBe(3);

    // Mark all read
    const readCount = notificationQueue.markAllRead("CLIENT");
    expect(readCount).toBe(3);

    const { unreadCount: countAfterAll } = notificationQueue.getNotifications("CLIENT");
    expect(countAfterAll).toBe(0);
  });

  it("should provide real-time queue health stats", () => {
    const stats = notificationQueue.getStats();
    expect(stats.totalNotifications).toBeGreaterThan(0);
    expect(typeof stats.pendingJobs).toBe("number");
    expect(typeof stats.deadLettersCount).toBe("number");
  });
});

