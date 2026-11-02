import { describe, it, expect, beforeEach } from "vitest";
import { clientOverviewService } from "../src/services/clientOverviewService.js";

describe("Client Milestones Backend Service & Consensus Escrow Engine", () => {
  beforeEach(() => {
    clientOverviewService.reset();
  });

  it("should return baseline milestones and exact telemetry stats for Alex", async () => {
    const res = await clientOverviewService.getMilestones("usr_client_alex");
    expect(res.success).toBe(true);
    expect(res.count).toBe(10);
    expect(res.stats.upcomingCount).toBe(4);
    expect(res.stats.awaitingReviewCount).toBe(1);
    expect(res.stats.overdueCount).toBe(2);
    expect(res.stats.completedCount).toBe(3);
    expect(res.distinctProjects.length).toBeGreaterThan(0);
  });

  it("should return clean empty state for a new client with zero milestones", async () => {
    const res = await clientOverviewService.getMilestones("usr_new_client_empty");
    expect(res.success).toBe(true);
    expect(res.count).toBe(0);
    expect(res.data.length).toBe(0);
    expect(res.stats.upcomingCount).toBe(0);
    expect(res.stats.awaitingReviewCount).toBe(0);
    expect(res.stats.overdueCount).toBe(0);
    expect(res.stats.completedCount).toBe(0);
    expect(res.distinctProjects.length).toBe(0);
  });

  it("should approve a milestone, update its payment and workflow state to CAPTURED / ACCEPTED, and transition telemetry stats", async () => {
    // Initial state: awaiting review = 1, completed = 3
    const initial = await clientOverviewService.getMilestones("usr_client_alex");
    expect(initial.stats.awaitingReviewCount).toBe(1);
    expect(initial.stats.completedCount).toBe(3);

    // Approve M2 PayPal Webhook Engine
    const approveResult = await clientOverviewService.approveMilestone("ms_m2_paypal", "usr_client_alex");
    expect(approveResult.success).toBe(true);

    // State after approval: awaiting review = 0, completed = 4
    const updated = await clientOverviewService.getMilestones("usr_client_alex");
    expect(updated.stats.awaitingReviewCount).toBe(0);
    expect(updated.stats.completedCount).toBe(4);

    const approvedItem = updated.data.find((m) => m.id === "ms_m2_paypal");
    expect(approvedItem?.workflowStatus).toBe("ACCEPTED");
    expect(approvedItem?.paymentState).toBe("CAPTURED");
    expect(approvedItem?.paymentDetails?.captureId).toBe("CAP_SANDBOX_RELEASE_SUCCESS");
    expect(approvedItem?.nextClientAction?.actionType).toBe("VIEW_RECEIPT");
  });

  it("should record milestone corrections requested with unmet criteria and revision notes", async () => {
    const result = await clientOverviewService.requestMilestoneCorrections(
      "ms_m2_paypal",
      {
        notes: "HMAC signatures failing on test runner",
        unmetCriteria: ["ac_2"],
      },
      "usr_client_alex"
    );

    expect(result.success).toBe(true);

    const updated = await clientOverviewService.getMilestones("usr_client_alex");
    const item = updated.data.find((m) => m.id === "ms_m2_paypal");
    expect(item?.workflowStatus).toBe("AWAITING_REVIEW");
    expect(item?.workflowStatusLabel).toBe("Corrections Requested");
    expect(item?.correctionsRequestedNotes).toBe("HMAC signatures failing on test runner");
  });

  it("should dynamically synchronize milestones created from a new client project into the milestones list", async () => {
    const clientId = "usr_client_dynamic_creator";

    // Create a new project with 2 milestones
    await clientOverviewService.createProject({
      clientId,
      title: "FinTech Compliance Service",
      description: "Automated transaction compliance checker",
      budgetCents: 200000,
      milestones: [
        { title: "Compliance Rules Engine", amountCents: 100000 },
        { title: "Audit Log Immutability", amountCents: 100000 },
      ],
    });

    const res = await clientOverviewService.getMilestones(clientId);
    expect(res.success).toBe(true);
    expect(res.count).toBe(2);
    // Milestone 1 starts in Awaiting Review, Milestone 2 is upcoming
    expect(res.stats.awaitingReviewCount).toBe(1);
    expect(res.stats.upcomingCount).toBe(1);
    expect(res.distinctProjects.some((p) => p.name === "FinTech Compliance Service")).toBe(true);
  });
});

