import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { NotFoundError, ValidationError, ConflictError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import { Role, ApprovalDecision, AgreementVersionStatus } from "@prisma/client";
import { diffAgreementVersions } from "../../domain/agreements/diffAgreementVersions.js";
import { tryActivateAgreementVersion } from "../../domain/agreements/activation.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

/**
 * GET /api/freelancer/agreements
 * List all agreements for the authenticated freelancer.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const freelancerId = req.user!.id;

    const agreements = await prisma.agreement.findMany({
      where: { freelancerId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            category: true,
            client: { select: { id: true, name: true } },
          },
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = agreements.map((a) => {
      const latestVer = a.versions[0];
      const terms = latestVer?.terms as any;
      return {
        id: a.id,
        projectId: a.projectId,
        projectTitle: a.project.title,
        clientName: a.project.client.name,
        status: a.status,
        activeVersionId: a.activeVersionId,
        currentVersionNumber: latestVer?.versionNumber ?? 1,
        totalAmountMinor: terms?.totalAmountMinor ?? 0,
        currency: terms?.currency ?? "USD",
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      };
    });

    res.status(200).json({ success: true, agreements: items });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/agreements/:id
 * Retrieve details of a specific agreement with versions and milestones.
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const agreement = await prisma.agreement.findFirst({
      where: { id, freelancerId },
      include: {
        project: {
          include: {
            client: { select: { id: true, name: true } },
          },
        },
        versions: {
          include: {
            approvals: true,
          },
          orderBy: { versionNumber: "desc" },
        },
        milestones: {
          where: { removedAt: null },
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!agreement) {
      throw new NotFoundError("Agreement not found");
    }

    const activeVersion =
      agreement.versions.find((v) => v.id === agreement.activeVersionId) ||
      agreement.versions.find((v) => v.status === AgreementVersionStatus.ACTIVE) ||
      agreement.versions[0];

    res.status(200).json({
      success: true,
      agreement: {
        id: agreement.id,
        projectId: agreement.projectId,
        projectTitle: agreement.project.title,
        status: agreement.status,
        activeVersionId: agreement.activeVersionId,
        client: agreement.project.client,
        createdAt: agreement.createdAt.toISOString(),
        updatedAt: agreement.updatedAt.toISOString(),
      },
      activeVersion,
      versions: agreement.versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        parentVersionId: v.parentVersionId,
        source: v.source,
        sourceRefId: v.sourceRefId,
        terms: v.terms,
        contentHash: v.contentHash,
        status: v.status,
        activatedAt: v.activatedAt ? v.activatedAt.toISOString() : null,
        createdAt: v.createdAt.toISOString(),
        approvals: v.approvals.map((app) => ({
          partyRole: app.partyRole,
          decision: app.decision,
          contentHash: app.contentHash,
          decidedAt: app.decidedAt.toISOString(),
        })),
      })),
      milestones: agreement.milestones.map((m) => ({
        id: m.id,
        milestoneKey: m.milestoneKey,
        sequence: m.sequence,
        title: m.title,
        description: m.description,
        criteria: m.criteria,
        amountMinor: m.amountMinor,
        currency: m.currency,
        workStatus: m.workStatus,
        dueDate: m.dueDate ? m.dueDate.toISOString() : null,
        startedAt: m.startedAt ? m.startedAt.toISOString() : null,
        acceptedAt: m.acceptedAt ? m.acceptedAt.toISOString() : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/agreements/:id/diff?from=&to=
 * Generate canonical diff between two agreement versions.
 */
router.get("/:id/diff", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;
    const freelancerId = req.user!.id;

    if (!from || !to) {
      throw new ValidationError("Both 'from' and 'to' version query params are required");
    }

    const agreement = await prisma.agreement.findFirst({
      where: { id, freelancerId },
      include: {
        versions: {
          where: {
            OR: [
              { id: String(from) },
              { id: String(to) },
              { versionNumber: isNaN(Number(from)) ? undefined : Number(from) },
              { versionNumber: isNaN(Number(to)) ? undefined : Number(to) },
            ],
          },
        },
      },
    });

    if (!agreement) {
      throw new NotFoundError("Agreement not found");
    }

    const vFrom =
      agreement.versions.find((v) => v.id === String(from) || v.versionNumber === Number(from));
    const vTo =
      agreement.versions.find((v) => v.id === String(to) || v.versionNumber === Number(to));

    if (!vFrom || !vTo) {
      throw new NotFoundError("One or both agreement versions not found for diff");
    }

    const diff = diffAgreementVersions(vFrom.terms as any, vTo.terms as any);

    res.status(200).json({
      success: true,
      diff,
      fromVersion: { id: vFrom.id, versionNumber: vFrom.versionNumber },
      toVersion: { id: vTo.id, versionNumber: vTo.versionNumber },
    });
  } catch (err) {
    next(err);
  }
});

const approveSchema = z.object({
  contentHash: z.string().min(1, "contentHash is required"),
});

/**
 * POST /api/freelancer/agreements/:id/versions/:versionId/approve
 * Freelancer approves agreement version by cryptographic hash.
 */
router.post("/:id/versions/:versionId/approve", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, versionId } = req.params;
    const freelancerId = req.user!.id;

    const parsed = approveSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid approval payload", { issues: parsed.error.issues });
    }

    const agreement = await prisma.agreement.findFirst({
      where: { id, freelancerId },
    });
    if (!agreement) {
      throw new NotFoundError("Agreement not found");
    }

    const version = await prisma.agreementVersion.findFirst({
      where: { id: versionId, agreementId: agreement.id },
      include: { approvals: true },
    });
    if (!version) {
      throw new NotFoundError("AgreementVersion not found");
    }

    // 1. Version must be PENDING_APPROVAL
    if (version.status !== AgreementVersionStatus.PENDING_APPROVAL) {
      throw new ConflictError(
        `Version is in ${version.status} state, not PENDING_APPROVAL`,
        "INVALID_STATE"
      );
    }

    // 2. Hash check: provided hash must match database contentHash exactly
    if (parsed.data.contentHash !== version.contentHash) {
      throw new ConflictError(
        "Provided contentHash does not match canonical version hash",
        "HASH_MISMATCH"
      );
    }

    // 3. Prevent duplicate voting
    const alreadyDecided = version.approvals.some(
      (a) => a.partyRole === Role.FREELANCER
    );
    if (alreadyDecided) {
      throw new ConflictError(
        "Freelancer has already recorded a decision for this version",
        "ALREADY_DECIDED"
      );
    }

    // 4. Record approval
    try {
      await prisma.agreementApproval.create({
        data: {
          agreementVersionId: version.id,
          partyRole: Role.FREELANCER,
          userId: freelancerId,
          decision: ApprovalDecision.APPROVED,
          contentHash: parsed.data.contentHash,
          decidedAt: new Date(),
        },
      });
    } catch (createErr: any) {
      if (createErr.code === "P2002") {
        throw new ConflictError(
          "Freelancer has already recorded a decision for this version",
          "ALREADY_DECIDED"
        );
      }
      throw createErr;
    }

    // 5. Try activation
    const { activated } = await tryActivateAgreementVersion(version.id, prisma);

    await appendAuditEvent({
      actorId: freelancerId,
      action: "AGREEMENT_VERSION_APPROVED",
      objectType: "AGREEMENT_VERSION",
      objectId: version.id,
      previousStatus: "PENDING_APPROVAL",
      newStatus: activated ? "ACTIVE" : "PENDING_APPROVAL",
      metadata: { partyRole: "FREELANCER", activated },
    });

    res.status(200).json({
      success: true,
      decision: "APPROVED",
      activated,
    });
  } catch (err) {
    next(err);
  }
});

const rejectSchema = z.object({
  reason: z.string().optional(),
});

/**
 * POST /api/freelancer/agreements/:id/versions/:versionId/reject
 * Freelancer rejects agreement version.
 */
router.post("/:id/versions/:versionId/reject", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, versionId } = req.params;
    const freelancerId = req.user!.id;

    const parsed = rejectSchema.safeParse(req.body);
    const reason = parsed.success ? parsed.data.reason : undefined;

    const agreement = await prisma.agreement.findFirst({
      where: { id, freelancerId },
    });
    if (!agreement) {
      throw new NotFoundError("Agreement not found");
    }

    const version = await prisma.agreementVersion.findFirst({
      where: { id: versionId, agreementId: agreement.id },
      include: { approvals: true },
    });
    if (!version) {
      throw new NotFoundError("AgreementVersion not found");
    }

    if (version.status !== AgreementVersionStatus.PENDING_APPROVAL) {
      throw new ConflictError("Version is not PENDING_APPROVAL", "INVALID_STATE");
    }

    const alreadyDecided = version.approvals.some((a) => a.partyRole === Role.FREELANCER);
    if (alreadyDecided) {
      throw new ConflictError("Freelancer has already decided on this version", "ALREADY_DECIDED");
    }

    await prisma.$transaction(async (tx) => {
      await tx.agreementApproval.create({
        data: {
          agreementVersionId: version.id,
          partyRole: Role.FREELANCER,
          userId: freelancerId,
          decision: ApprovalDecision.REJECTED,
          contentHash: version.contentHash,
          reason,
          decidedAt: new Date(),
        },
      });

      await tx.agreementVersion.update({
        where: { id: version.id },
        data: { status: AgreementVersionStatus.REJECTED },
      });

      if (version.source === "CHANGE_REQUEST" && version.sourceRefId) {
        await tx.changeRequest.updateMany({
          where: { id: version.sourceRefId },
          data: { status: "REJECTED" },
        });
      }
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "AGREEMENT_VERSION_REJECTED",
      objectType: "AGREEMENT_VERSION",
      objectId: version.id,
      previousStatus: "PENDING_APPROVAL",
      newStatus: "REJECTED",
      metadata: { reason },
    });

    res.status(200).json({ success: true, decision: "REJECTED" });
  } catch (err) {
    next(err);
  }
});

export default router;
