import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchClientMilestones,
  approveClientMilestone,
  requestClientMilestoneCorrections,
} from "../src/lib/api-client";
import { CLIENT_MILESTONES } from "../src/lib/mock-milestones";

describe("Client Milestones, Telemetry Stats & Review Modal Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should compute exact telemetry stats for client baseline milestones", async () => {
    const upcomingCount = CLIENT_MILESTONES.filter(
      (m) => m.workflowStatus === "UPCOMING" || m.workflowStatus === "IN_PROGRESS"
    ).length;
    const awaitingReviewCount = CLIENT_MILESTONES.filter(
      (m) => m.workflowStatus === "AWAITING_REVIEW"
    ).length;
    const overdueCount = CLIENT_MILESTONES.filter(
      (m) => m.isOverdue || m.workflowStatus === "OVERDUE"
    ).length;
    const completedCount = CLIENT_MILESTONES.filter(
      (m) => m.workflowStatus === "ACCEPTED"
    ).length;

    // Matches the visual numbers displayed in Image 1:
    expect(upcomingCount).toBe(4);
    expect(awaitingReviewCount).toBe(1);
    expect(overdueCount).toBe(2);
    expect(completedCount).toBe(3);
    expect(CLIENT_MILESTONES.length).toBe(10);
  });

  it("should fetch client milestones and parse response correctly", async () => {
    const mockResponse = {
      success: true,
      count: 10,
      data: CLIENT_MILESTONES,
      stats: {
        upcomingCount: 4,
        awaitingReviewCount: 1,
        overdueCount: 2,
        completedCount: 3,
      },
      distinctProjects: [
        { id: "proj_1", name: "Bilateral E-Commerce Payment Rails" },
        { id: "proj_2", name: "CloudMesh AI Gateway Unification" },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const result = await fetchClientMilestones("usr_client_alex");
    expect(result.success).toBe(true);
    expect(result.count).toBe(10);
    expect(result.stats.awaitingReviewCount).toBe(1);
    expect(result.stats.upcomingCount).toBe(4);
    expect(result.stats.overdueCount).toBe(2);
    expect(result.stats.completedCount).toBe(3);
  });

  it("should dispatch approveClientMilestone with order ID and client ID", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "Milestone deliverable approved and PayPal funds released successfully.",
        milestoneId: "ms_m2_paypal",
      }),
    } as any);

    const result = await approveClientMilestone("ms_m2_paypal", {
      clientId: "usr_client_alex",
      orderId: "6DE714998H998261C",
    });

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/client/milestones/ms_m2_paypal/approve",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          clientId: "usr_client_alex",
          orderId: "6DE714998H998261C",
        }),
      })
    );
  });

  it("should dispatch requestClientMilestoneCorrections with unmet criteria checklist and revision notes", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "Correction request logged on immutable audit trail and sent to contractor.",
        milestoneId: "ms_m2_paypal",
      }),
    } as any);

    const result = await requestClientMilestoneCorrections("ms_m2_paypal", {
      notes: "Please add signature check for webhook headers",
      unmetCriteria: ["ac_2"],
      clientId: "usr_client_alex",
    });

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/client/milestones/ms_m2_paypal/corrections",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          notes: "Please add signature check for webhook headers",
          unmetCriteria: ["ac_2"],
          clientId: "usr_client_alex",
        }),
      })
    );
  });
});
