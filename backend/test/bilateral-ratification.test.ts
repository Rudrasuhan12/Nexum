import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, Role, ProposalStatus, AgreementVersionStatus, AgreementStatus, ProjectState, ApprovalDecision } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "path";
import { tryActivateAgreementVersion } from "../src/domain/agreements/activation.js";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
neonConfig.webSocketConstructor = ws;

describe("Bilateral Agreement Ratification Governance Protocol", () => {
  let prisma: PrismaClient;
  const testSuffix = Date.now().toString().slice(-6);
  let clientId: string;
  let freelancerId: string;
  let projectId: string;
  let agreementId: string;
  let versionId: string;

  beforeAll(async () => {
    const poolConfig = {
      host: new URL(process.env.DATABASE_URL!).hostname,
      user: new URL(process.env.DATABASE_URL!).username,
      password: new URL(process.env.DATABASE_URL!).password,
      database: new URL(process.env.DATABASE_URL!).pathname.slice(1),
      ssl: true,
    };
    prisma = new PrismaClient({ adapter: new PrismaNeon(poolConfig) });

    // Create test Client & Freelancer
    const client = await prisma.user.create({
      data: {
        email: `ratify_client_${testSuffix}@example.com`,
        name: `Client Ratifier ${testSuffix}`,
        role: Role.CLIENT,
      },
    });
    clientId = client.id;

    const freelancer = await prisma.user.create({
      data: {
        email: `ratify_freelancer_${testSuffix}@example.com`,
        name: `Freelancer Ratifier ${testSuffix}`,
        role: Role.FREELANCER,
      },
    });
    freelancerId = freelancer.id;

    // Create test project
    const project = await prisma.project.create({
      data: {
        title: `Bilateral Ratification Test Project ${testSuffix}`,
        description: "Testing bilateral ratification human approvals",
        clientId,
        budgetCents: 500000,
        currency: "USD",
        state: ProjectState.MATCHING,
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    // Cleanup
    if (agreementId) {
      await prisma.agreementApproval.deleteMany({ where: { agreementVersion: { agreementId } } });
      await prisma.agreementVersion.deleteMany({ where: { agreementId } });
      await prisma.milestone.deleteMany({ where: { agreementId } });
      await prisma.agreement.deleteMany({ where: { id: agreementId } });
    }
    if (projectId) {
      await prisma.milestone.deleteMany({ where: { projectId } });
      await prisma.project.deleteMany({ where: { id: projectId } });
    }
    if (clientId) await prisma.user.deleteMany({ where: { id: clientId } });
    if (freelancerId) await prisma.user.deleteMany({ where: { id: freelancerId } });
    await prisma.$disconnect();
  });

  it("Step 1: Agreement is synthesized with ZERO pre-filled approvals (human approval required)", async () => {
    // Simulate proposal acceptance creating agreement
    const agreement = await prisma.agreement.create({
      data: {
        projectId,
        clientId,
        freelancerId,
        status: AgreementStatus.DRAFT,
      },
    });
    agreementId = agreement.id;

    const version = await prisma.agreementVersion.create({
      data: {
        agreementId,
        versionNumber: 1,
        contentHash: "hash_test_ratify_v1",
        status: AgreementVersionStatus.PENDING_APPROVAL,
        terms: {
          totalAmountMinor: 500000,
          currency: "USD",
          milestones: [
            { key: "m1", title: "Phase 1 Delivery", amountMinor: 500000 },
          ],
        },
      },
    });
    versionId = version.id;

    // Verify: No pre-filled approvals!
    const approvals = await prisma.agreementApproval.findMany({
      where: { agreementVersionId: versionId },
    });
    expect(approvals.length).toBe(0);

    // Verify activation fails because neither party has approved
    const actResult = await tryActivateAgreementVersion(versionId, prisma);
    expect(actResult.activated).toBe(false);

    const projectCheck = await prisma.project.findUnique({ where: { id: projectId } });
    expect(projectCheck?.state).toBe(ProjectState.MATCHING);
  });

  it("Step 2: Client ratifies agreement -> Still not activated until Freelancer ratifies", async () => {
    await prisma.agreementApproval.create({
      data: {
        agreementVersionId: versionId,
        partyRole: Role.CLIENT,
        userId: clientId,
        decision: ApprovalDecision.APPROVED,
        contentHash: "hash_test_ratify_v1",
      },
    });

    const approvals = await prisma.agreementApproval.findMany({
      where: { agreementVersionId: versionId },
    });
    expect(approvals.length).toBe(1);
    expect(approvals[0].partyRole).toBe("CLIENT");

    // Still not activated because Freelancer hasn't signed
    const actResult = await tryActivateAgreementVersion(versionId, prisma);
    expect(actResult.activated).toBe(false);

    const versionCheck = await prisma.agreementVersion.findUnique({ where: { id: versionId } });
    expect(versionCheck?.status).toBe(AgreementVersionStatus.PENDING_APPROVAL);
  });

  it("Step 3: Freelancer ratifies agreement -> Both approved triggers atomic activation", async () => {
    await prisma.agreementApproval.create({
      data: {
        agreementVersionId: versionId,
        partyRole: Role.FREELANCER,
        userId: freelancerId,
        decision: ApprovalDecision.APPROVED,
        contentHash: "hash_test_ratify_v1",
      },
    });

    const approvals = await prisma.agreementApproval.findMany({
      where: { agreementVersionId: versionId },
    });
    expect(approvals.length).toBe(2);

    // Both have approved -> Must activate atomically!
    const actResult = await tryActivateAgreementVersion(versionId, prisma);
    expect(actResult.activated).toBe(true);

    const versionCheck = await prisma.agreementVersion.findUnique({ where: { id: versionId } });
    expect(versionCheck?.status).toBe(AgreementVersionStatus.ACTIVE);

    const agreementCheck = await prisma.agreement.findUnique({ where: { id: agreementId } });
    expect(agreementCheck?.status).toBe(AgreementStatus.ACTIVE);
    expect(agreementCheck?.activeVersionId).toBe(versionId);

    const projectCheck = await prisma.project.findUnique({ where: { id: projectId } });
    expect(projectCheck?.state).toBe(ProjectState.ACTIVE);
  });
});

