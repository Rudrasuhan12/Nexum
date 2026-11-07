import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/prisma.js";
import { handoverService } from "../src/services/handoverService.js";

describe("Phase 11: Project Handover & Deliverable Checklist Protocol", () => {
  let testProjectId: string;
  let testClientId: string;
  let testFreelancerId: string;
  let testMilestoneId: string;
  let testHandoverId: string;
  let testItemId: string;

  beforeAll(async () => {
    // 1. Resolve test client and freelancer
    let clientUser = await prisma.user.findFirst({
      where: { role: "CLIENT" },
    });
    if (!clientUser) {
      clientUser = await prisma.user.create({
        data: {
          email: `client_handover_${Date.now()}@test.com`,
          name: "Test Client",
          role: "CLIENT",
        },
      });
    }

    let freelancerUser = await prisma.user.findFirst({
      where: { role: "FREELANCER" },
    });
    if (!freelancerUser) {
      freelancerUser = await prisma.user.create({
        data: {
          email: `freelancer_handover_${Date.now()}@test.com`,
          name: "Test Developer",
          role: "FREELANCER",
        },
      });
    }

    testClientId = clientUser.id;
    testFreelancerId = freelancerUser.id;

    // 2. Create an active test project
    const project = await prisma.project.create({
      data: {
        title: "E-Commerce Core & Handover Verification",
        description: "Bilateral contract testing handover protocol and deliverable checklists",
        state: "ACTIVE",
        budgetCents: 400000,
        currency: "USD",
      },
    });

    testProjectId = project.id;

    // 3. Create a milestone in IN_PROGRESS status
    const milestone = await prisma.milestone.create({
      data: {
        projectId: testProjectId,
        title: "Sprint 1: Schema & Cart Engine",
        amountMinor: 400000,
        amountCents: 400000,
        currency: "USD",
        workStatus: "IN_PROGRESS",
      },
    });

    testMilestoneId = milestone.id;
  });

  it("1. blocks handover initiation if milestones are not yet accepted", async () => {
    await expect(
      handoverService.initiateHandover({
        projectId: testProjectId,
        clientId: testClientId,
      })
    ).rejects.toThrow(/Cannot initiate handover/);
  });

  it("2. allows handover initiation once all project milestones are marked ACCEPTED", async () => {
    // Transition milestone to ACCEPTED
    await prisma.milestone.update({
      where: { id: testMilestoneId },
      data: { workStatus: "ACCEPTED" },
    });

    const handover = await handoverService.initiateHandover({
      projectId: testProjectId,
      clientId: testClientId,
      items: [
        {
          category: "REPOSITORY",
          title: "Production Repository Transfer",
          description: "GitHub repository ownership transfer or release archive tag.",
          isRequired: true,
        },
        {
          category: "DOCUMENTATION",
          title: "API Architecture Documentation",
          description: "Comprehensive README and API endpoint specs.",
          isRequired: true,
        },
      ],
    });

    expect(handover).toBeDefined();
    expect(handover.projectId).toBe(testProjectId);
    expect(handover.status).toBe("PENDING_SUBMISSION");
    expect(handover.items.length).toBe(2);

    testHandoverId = handover.id;
    testItemId = handover.items[0].id;
  });

  it("3. retrieves the handover checklist and computed progress metrics", async () => {
    const res = await handoverService.getHandover(testProjectId);
    expect(res.hasHandover).toBe(true);
    expect(res.handover).toBeDefined();
    expect(res.handover?.stats?.totalItems).toBe(2);
    expect(res.handover?.stats?.requiredItems).toBe(2);
    expect(res.handover?.stats?.acceptedItems).toBe(0);
    expect(res.handover?.stats?.isFullyVerified).toBe(false);
  });

  it("4. allows freelancer to submit document URL, file key, and verification notes", async () => {
    const updated = await handoverService.submitHandoverItem({
      projectId: testProjectId,
      itemId: testItemId,
      freelancerId: testFreelancerId,
      providedUrl: "https://github.com/nexum-protocol/core-mvp",
      providedFileKey: "production-release-v1.0.tar.gz",
      providedNotes: "Ownership transferred to client organization admin.",
    });

    expect(updated.status).toBe("PROVIDED");
    expect(updated.providedUrl).toBe("https://github.com/nexum-protocol/core-mvp");
    expect(updated.providedNotes).toContain("Ownership transferred");
  });

  it("5. allows client to request corrections on a submitted item", async () => {
    const revised = await handoverService.reviewHandoverItem({
      projectId: testProjectId,
      itemId: testItemId,
      clientId: testClientId,
      decision: "REVISIONS_REQUESTED",
      rejectionReason: "Please grant admin rights to devops@nexum.com as well.",
    });

    expect(revised.status).toBe("REVISIONS_REQUESTED");
    expect(revised.rejectionReason).toContain("grant admin rights");
  });

  it("6. blocks project finalization while any required checklist item remains unaccepted", async () => {
    await expect(
      handoverService.finalizeHandover({
        projectId: testProjectId,
        clientId: testClientId,
      })
    ).rejects.toThrow(/Cannot finalize handover/);
  });

  it("7. allows freelancer resubmission and client acceptance of all items", async () => {
    // 1. Resubmit item 1
    await handoverService.submitHandoverItem({
      projectId: testProjectId,
      itemId: testItemId,
      freelancerId: testFreelancerId,
      providedUrl: "https://github.com/nexum-protocol/core-mvp-updated",
      providedNotes: "DevOps admin permissions verified.",
    });

    // 2. Accept item 1
    const accepted1 = await handoverService.reviewHandoverItem({
      projectId: testProjectId,
      itemId: testItemId,
      clientId: testClientId,
      decision: "ACCEPTED",
    });
    expect(accepted1.status).toBe("ACCEPTED");

    // 3. Submit and accept item 2
    const handover = await handoverService.getHandover(testProjectId);
    const item2 = handover.handover!.items[1];

    await handoverService.submitHandoverItem({
      projectId: testProjectId,
      itemId: item2.id,
      freelancerId: testFreelancerId,
      providedUrl: "https://docs.nexum.dev/architecture",
      providedNotes: "API docs complete.",
    });

    const accepted2 = await handoverService.reviewHandoverItem({
      projectId: testProjectId,
      itemId: item2.id,
      clientId: testClientId,
      decision: "ACCEPTED",
    });
    expect(accepted2.status).toBe("ACCEPTED");
  });

  it("8. finalizes project handover, calculates SHA-256 manifest hash, and completes project", async () => {
    const finalized = await handoverService.finalizeHandover({
      projectId: testProjectId,
      clientId: testClientId,
    });

    expect(finalized.success).toBe(true);
    expect(finalized.contentHash).toBeDefined();
    expect(finalized.contentHash?.length).toBe(64); // Valid SHA-256 hex string

    // Verify Project State in database transitioned to COMPLETED
    const project = await prisma.project.findUnique({
      where: { id: testProjectId },
    });
    expect(project?.state).toBe("COMPLETED");

    // Verify append-only audit event was recorded
    const auditEvent = await prisma.auditEvent.findFirst({
      where: {
        objectId: testHandoverId,
        action: "PROJECT_HANDOVER_COMPLETED",
      },
    });
    expect(auditEvent).toBeDefined();
    expect(auditEvent?.actorId).toBe(testClientId);
  });
});

