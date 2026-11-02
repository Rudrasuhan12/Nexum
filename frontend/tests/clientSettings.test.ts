import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchClientSettings,
  updateClientSettings,
  changeClientPassword,
  revokeOtherClientSessions,
  submitClientSupportTicket,
} from "../src/lib/api-client";

describe("Client Workspace Settings Frontend API & Integration Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch complete workspace settings for client", async () => {
    const mockSettings = {
      profile: {
        name: "Alex Rivera",
        email: "alex.rivera@nexum.demo",
        company: "Horizon Commerce LLC",
        location: "San Francisco, CA, USA",
        timezone: "America/Los_Angeles (UTC-8)",
        phone: "+1 (415) 892-4100",
        website: "https://horizoncommerce.demo",
        bio: "Head of Product",
        avatar: "https://images.unsplash.com/avatar.jpg",
      },
      security: {
        twoFactorEnabled: true,
        passwordLastChanged: "Oct 15, 2026",
        activeSessions: [{ id: "sess_curr", isCurrent: true, device: "Chrome macOS" }],
      },
      payments: {
        autoFundMilestones: true,
        disputeMediationBuffer: true,
        paypalSandboxStatus: "CONNECTED",
      },
      notifications: {
        milestonesEmail: true,
        milestonesInApp: true,
      },
      hiring: {
        budgetMin: 40,
        budgetMax: 90,
        preferredSkills: ["PayPal v2", "Next.js"],
      },
      privacy: {
        profileVisibility: "VERIFIED_ONLY",
        shareAuditTelemetry: true,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockSettings }),
    });

    const res = await fetchClientSettings("usr_client_alex");
    expect(res.success).toBe(true);
    expect(res.data.profile.name).toBe("Alex Rivera");
    expect(res.data.security.twoFactorEnabled).toBe(true);
    expect(res.data.payments.paypalSandboxStatus).toBe("CONNECTED");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/client/settings?clientId=usr_client_alex"),
      expect.any(Object)
    );
  });

  it("should send partial updates to client settings and return updated data", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          profile: { name: "Alex Rivera Updated", company: "Horizon Global" },
          hiring: { budgetMax: 150 },
        },
        message: "Settings successfully saved.",
      }),
    });

    const res = await updateClientSettings(
      {
        profile: { name: "Alex Rivera Updated", company: "Horizon Global" } as any,
        hiring: { budgetMax: 150 } as any,
      },
      "usr_client_alex"
    );

    expect(res.success).toBe(true);
    expect(res.data?.profile.name).toBe("Alex Rivera Updated");
    expect(fetch).toHaveBeenCalledWith(
      "/api/client/settings",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("Alex Rivera Updated"),
      })
    );
  });

  it("should change client password with secure validation", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "Password successfully updated across all Nexum authentication nodes.",
      }),
    });

    const res = await changeClientPassword({
      currentPassword: "demo1234",
      newPassword: "nexumNewPassword2026!",
      userId: "usr_client_alex",
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain("successfully updated");
    expect(fetch).toHaveBeenCalledWith(
      "/api/client/settings/change-password",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("nexumNewPassword2026!"),
      })
    );
  });

  it("should revoke all other active device sessions", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        remainingSessions: 1,
        message: "Signed out of all other active device sessions.",
      }),
    });

    const res = await revokeOtherClientSessions("usr_client_alex");
    expect(res.success).toBe(true);
    expect(res.remainingSessions).toBe(1);
    expect(fetch).toHaveBeenCalledWith(
      "/api/client/settings/sessions/revoke-others",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("should submit a priority support or mediation ticket", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        ticketId: "tkt_1793500123",
        message: "Support ticket created.",
      }),
    });

    const res = await submitClientSupportTicket({
      category: "Milestone Mediation",
      issue: "Dispute clarification requested on PayPal webhook delivery",
      userId: "usr_client_alex",
    });

    expect(res.success).toBe(true);
    expect(res.ticketId).toBe("tkt_1793500123");
    expect(fetch).toHaveBeenCalledWith(
      "/api/client/settings/support",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("Milestone Mediation"),
      })
    );
  });
});

