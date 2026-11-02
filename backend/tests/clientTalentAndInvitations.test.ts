import { describe, it, expect, beforeEach } from "vitest";
import { clientOverviewService } from "../src/services/clientOverviewService.js";
import { notificationQueue } from "../src/services/notificationQueue.js";

describe("Client Talent Directory & Formal Invitation Engine", () => {
  beforeEach(() => {
    clientOverviewService.reset();
  });

  it("should return the verified freelancer roster for Alex Chen with bookmark and match scores", async () => {
    const res = await clientOverviewService.getFreelancers("usr_client_alex");
    expect(res.success).toBe(true);
    expect(res.count).toBeGreaterThanOrEqual(8);
    expect(res.data.length).toBeGreaterThanOrEqual(8);

    // Verify Rohan Verma (Payment Specialist)
    const rohan = res.data.find((f) => f.name.includes("Rohan"));
    expect(rohan).toBeDefined();
    expect(rohan?.fitScore).toBe(98);
    expect(rohan?.hourlyRateDisplay).toBe("$65.00/hr");

    // Verify Priya Sharma is bookmarked by default for Alex
    const priya = res.data.find((f) => f.name.includes("Priya"));
    expect(priya).toBeDefined();
    expect(priya?.isSaved).toBe(true);
  });

  it("should toggle bookmark/save status for a freelancer candidate and persist across calls", async () => {
    // 1. Initially Marcus Chen is not saved
    const initialList = await clientOverviewService.getFreelancers("usr_client_alex");
    const marcusInitial = initialList.data.find((f) => f.name.includes("Marcus"));
    expect(marcusInitial?.isSaved).toBe(false);

    // 2. Toggle bookmark -> should now be saved
    const toggle1 = await clientOverviewService.toggleSaveFreelancer("usr_marcus", "usr_client_alex");
    expect(toggle1.success).toBe(true);
    expect(toggle1.isSaved).toBe(true);

    const afterSave = await clientOverviewService.getFreelancers("usr_client_alex");
    const marcusSaved = afterSave.data.find((f) => f.name.includes("Marcus"));
    expect(marcusSaved?.isSaved).toBe(true);

    // 3. Toggle again -> should now be un-saved
    const toggle2 = await clientOverviewService.toggleSaveFreelancer("usr_marcus", "usr_client_alex");
    expect(toggle2.success).toBe(true);
    expect(toggle2.isSaved).toBe(false);

    const afterUnsave = await clientOverviewService.getFreelancers("usr_client_alex");
    const marcusUnsaved = afterUnsave.data.find((f) => f.name.includes("Marcus"));
    expect(marcusUnsaved?.isSaved).toBe(false);
  });

  it("should fetch initial invitations for Alex Chen", async () => {
    const res = await clientOverviewService.getInvitations("usr_client_alex");
    expect(res.success).toBe(true);
    expect(res.count).toBe(2);

    const accepted = res.data.find((inv) => inv.status === "ACCEPTED");
    expect(accepted?.freelancerName).toBe("Rohan Verma");

    const pending = res.data.find((inv) => inv.status === "PENDING");
    expect(pending?.freelancerName).toBe("Priya Sharma");
  });

  it("should return clean empty states for a brand new client with zero prior activity", async () => {
    const newClientId = "usr_client_brand_new";

    // 1. Zero invitations
    const invites = await clientOverviewService.getInvitations(newClientId);
    expect(invites.success).toBe(true);
    expect(invites.count).toBe(0);
    expect(invites.data).toEqual([]);

    // 2. Freelancers roster available, but none bookmarked
    const talent = await clientOverviewService.getFreelancers(newClientId);
    expect(talent.success).toBe(true);
    const anySaved = talent.data.some((f) => f.isSaved);
    expect(anySaved).toBe(false);
  });

  it("should dispatch a formal project invitation, record it in persistent store, and trigger notification", async () => {
    const newClientId = "usr_client_custom_recruiter";

    const inviteResult = await clientOverviewService.inviteTalent({
      clientId: newClientId,
      freelancerId: "usr_elena",
      freelancerName: "Elena Rostova",
      freelancerTitle: "Cryptographic Engineer",
      projectId: "proj_crypto_audit",
      projectName: "Cryptographic Audit Trail Engine",
      proposedRate: "$90.00/hr",
      customNote: "Hi Elena, we'd like to invite you to audit our SHA-256 consensus engine.",
    });

    expect(inviteResult.success).toBe(true);
    expect(inviteResult.invitation).toBeDefined();
    expect(inviteResult.invitation.id).toMatch(/^inv_/);
    expect(inviteResult.invitation.status).toBe("PENDING");
    expect(inviteResult.invitation.freelancerName).toBe("Elena Rostova");
    expect(inviteResult.invitation.projectName).toBe("Cryptographic Audit Trail Engine");

    // Verify it is listed in client's invitations
    const clientInvites = await clientOverviewService.getInvitations(newClientId);
    expect(clientInvites.count).toBe(1);
    expect(clientInvites.data[0].freelancerId).toBe("usr_elena");

    // Verify notification queue stats incremented
    const queueStats = notificationQueue.getStats();
    expect(queueStats.totalNotifications).toBeGreaterThan(0);
  });
});

