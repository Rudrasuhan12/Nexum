/**
 * TEMPORARY DEV-ONLY CLIENT STAND-IN ROUTER FOR AGREEMENTS
 */
import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../prisma.js";
import { Role, ApprovalDecision, AgreementVersionStatus } from "@prisma/client";
import { NotFoundError, ConflictError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import { tryActivateAgreementVersion } from "../../domain/agreements/activation.js";

const router = Router();

// Dev guard middleware
router.use((_req: Request, _res: Response, next: NextFunction) => {
  const isDevToolsEnabled = process.env.ENABLE_DEV_TOOLS === "true";
  const isNotProduction = process.env.NODE_ENV !== "production";

  if (!isDevToolsEnabled || !isNotProduction) {
    throw new NotFoundError("Dev tools endpoints are disabled in this environment");
  }
  next();
});

/**
 * POST /api/dev/agreements/:id/versions/:versionId/client-approve
 * Simulate client approving an agreement version.
 */
router.post("/:id/versions/:versionId/client-approve", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, versionId } = req.params;

    const agreement = await prisma.agreement.findUnique({
      where: { id },
    });
    if (!agreement) {
      throw new NotFoundError("Agreement not found");
    }

    const version = await prisma.agreementVersion.findFirst({
      where: { id: versionId, agreementId: agreement.id },
      include: { approvals: true },
    });
    if (!version) {
      throw new NotFoundError("Agreement version not found");
    }

    if (version.status !== AgreementVersionStatus.PENDING_APPROVAL) {
      throw new ConflictError("Version is not PENDING_APPROVAL", "INVALID_STATE");
    }

    // Upsert or create approval for CLIENT
    const existing = version.approvals.find((a) => a.partyRole === Role.CLIENT);
    if (existing) {
      if (existing.decision === ApprovalDecision.APPROVED) {
        throw new ConflictError("Client has already approved this version", "ALREADY_DECIDED");
      }
      await prisma.agreementApproval.update({
        where: { id: existing.id },
        data: {
          decision: ApprovalDecision.APPROVED,
          contentHash: version.contentHash,
          decidedAt: new Date(),
        },
      });
    } else {
      await prisma.agreementApproval.create({
        data: {
          agreementVersionId: version.id,
          partyRole: Role.CLIENT,
          userId: agreement.clientId,
          decision: ApprovalDecision.APPROVED,
          contentHash: version.contentHash,
          decidedAt: new Date(),
        },
      });
    }

    // Attempt bilateral activation
    const { activated } = await tryActivateAgreementVersion(version.id, prisma);

    await appendAuditEvent({
      actorId: agreement.clientId,
      action: "AGREEMENT_VERSION_APPROVED",
      objectType: "AGREEMENT_VERSION",
      objectId: version.id,
      previousStatus: "PENDING_APPROVAL",
      newStatus: activated ? "ACTIVE" : "PENDING_APPROVAL",
      metadata: { partyRole: "CLIENT", actorRole: Role.CLIENT, activated },
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

export default router;
