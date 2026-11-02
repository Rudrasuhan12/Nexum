import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { NotFoundError, ValidationError, ConflictError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import {
  Role,
  AgreementVersionStatus,
  AgreementSource,
  ChangeRequestStatus,
} from "@prisma/client";
import { applyChangeToTerms, MilestoneLockedError } from "../../domain/agreements/applyChangeToTerms.js";
import { AgreementTerms } from "../../domain/agreements/createTerms.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

const deltaSchema = z.object({
  addMilestones: z
    .array(
      z.object({
        title: z.string().min(1, "Milestone title is required"),
        description: z.string().optional(),
        amountMinor: z.number().int("Amount must be an integer"),
        durationWeeks: z.number().optional(),
        criteria: z
          .array(
            z.union([
              z.string(),
              z.object({
                id: z.string().optional(),
                text: z.string().min(1),
              }),
            ])
          )
          .optional(),
        dueDate: z.string().nullable().optional(),
      })
    )
    .optional(),
  updateMilestones: z
    .array(
      z.object({
        key: z.string(),
        changes: z.record(z.any()),
      })
    )
    .optional(),
  removeMilestoneKeys: z.array(z.string()).optional(),
});

const quoteChangeRequestSchema = z.object({
  classification: z.string().optional().default("NEW_MILESTONE"),
  delta: deltaSchema,
  note: z.string().optional(),
});

const declineChangeRequestSchema = z.object({
  reason: z.string().min(1, "Decline reason is required"),
});

/**
 * GET /api/freelancer/change-requests
 * List change requests involving the freelancer.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const freelancerId = req.user!.id;
    const { project } = req.query;

    const where: any = {
      agreement: { freelancerId },
    };

    if (project && typeof project === "string") {
      where.projectId = project;
    }

    const changeRequests = await prisma.changeRequest.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = changeRequests.map((cr) => ({
      id: cr.id,
      projectId: cr.projectId,
      projectTitle: cr.project.title,
      client: cr.project.client,
      agreementId: cr.agreementId,
      baseVersionId: cr.baseVersionId,
      raisedByRole: cr.raisedByRole,
      description: cr.description,
      classification: cr.classification,
      status: cr.status,
      proposedVersionId: cr.proposedVersionId,
      priceImpactCents: cr.priceImpactCents,
      scheduleImpactDays: cr.scheduleImpactDays,
      createdAt: cr.createdAt.toISOString(),
      updatedAt: cr.updatedAt.toISOString(),
    }));

    res.status(200).json({ success: true, changeRequests: items });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/change-requests/:id
 * Retrieve details of a specific change request.
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const cr = await prisma.changeRequest.findFirst({
      where: {
        id,
        agreement: { freelancerId },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!cr) {
      throw new NotFoundError("Change request not found");
    }

    let proposedVersion = null;
    if (cr.proposedVersionId) {
      proposedVersion = await prisma.agreementVersion.findUnique({
        where: { id: cr.proposedVersionId },
        include: { approvals: true },
      });
    }

    res.status(200).json({
      success: true,
      changeRequest: {
        id: cr.id,
        projectId: cr.projectId,
        projectTitle: cr.project.title,
        client: cr.project.client,
        agreementId: cr.agreementId,
        baseVersionId: cr.baseVersionId,
        raisedByRole: cr.raisedByRole,
        description: cr.description,
        classification: cr.classification,
        status: cr.status,
        proposedVersionId: cr.proposedVersionId,
        proposedVersion,
        priceImpactCents: cr.priceImpactCents,
        scheduleImpactDays: cr.scheduleImpactDays,
        differences: cr.differences,
        createdAt: cr.createdAt.toISOString(),
        updatedAt: cr.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelancer/change-requests/:id/quote
 * Freelancer quotes a change request with a structured delta.
 */
router.post("/:id/quote", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const parsed = quoteChangeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid quote parameters", parsed.error.flatten().fieldErrors, 422);
    }

    const { classification, delta, note } = parsed.data;

    // Fetch change request & verify ownership
    const cr = await prisma.changeRequest.findFirst({
      where: {
        id,
        agreement: { freelancerId },
      },
      include: {
        agreement: {
          include: {
            versions: {
              orderBy: { versionNumber: "desc" },
            },
          },
        },
      },
    });

    if (!cr) {
      throw new NotFoundError("Change request not found");
    }

    if (cr.status !== ChangeRequestStatus.OPEN && cr.status !== ChangeRequestStatus.QUOTE_SUBMITTED) {
      throw new ConflictError(
        `Cannot quote on a change request in status ${cr.status}`,
        "INVALID_STATE"
      );
    }

    const agreement = cr.agreement;
    if (!agreement || !agreement.activeVersionId) {
      throw new ConflictError("No active agreement version exists to amend", "NO_ACTIVE_VERSION");
    }

    const activeVersion = agreement.versions.find((v) => v.id === agreement.activeVersionId);
    if (!activeVersion) {
      throw new ConflictError("Active agreement version not found", "NO_ACTIVE_VERSION");
    }

    // Get current statuses of existing milestones
    const existingMilestones = await prisma.milestone.findMany({
      where: { agreementId: agreement.id, removedAt: null },
    });
    const statusMap = new Map<string, string>();
    for (const m of existingMilestones) {
      statusMap.set(m.milestoneKey || m.id, m.workStatus);
    }

    // Apply delta to active terms
    let termsResult: { newTerms: AgreementTerms; contentHash: string };
    try {
      termsResult = applyChangeToTerms(activeVersion.terms as unknown as AgreementTerms, delta, statusMap);
    } catch (err: any) {
      if (err instanceof MilestoneLockedError) {
        res.status(err.statusCode || 422).json({
          error: {
            code: err.code,
            message: err.message,
            details: {},
          },
        });
        return;
      }
      throw err;
    }

    const { newTerms, contentHash } = termsResult;
    const nextVerNum = (agreement.versions[0]?.versionNumber ?? 1) + 1;
    const priceImpactCents =
      newTerms.totalAmountMinor - (activeVersion.terms as any).totalAmountMinor;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create proposed AgreementVersion in PENDING_APPROVAL
      const proposedVer = await tx.agreementVersion.create({
        data: {
          agreementId: agreement.id,
          versionNumber: nextVerNum,
          parentVersionId: activeVersion.id,
          source: AgreementSource.CHANGE_REQUEST,
          sourceRefId: cr.id,
          terms: newTerms as any,
          contentHash,
          status: AgreementVersionStatus.PENDING_APPROVAL,
        },
      });

      // 2. Update change request
      const updatedCr = await tx.changeRequest.update({
        where: { id: cr.id },
        data: {
          status: ChangeRequestStatus.QUOTE_SUBMITTED,
          classification,
          proposedVersionId: proposedVer.id,
          priceImpactCents,
          differences: { delta, note },
        },
      });

      // 3. Append audit event
      await appendAuditEvent(
        {
          actorId: freelancerId,
          action: "CHANGE_REQUEST_QUOTE_SUBMITTED",
          objectType: "CHANGE_REQUEST",
          objectId: cr.id,
          previousStatus: cr.status,
          newStatus: ChangeRequestStatus.QUOTE_SUBMITTED,
          metadata: {
            proposedVersionId: proposedVer.id,
            versionNumber: nextVerNum,
            priceImpactCents,
            classification,
          },
        },
        tx
      );

      return { updatedCr, proposedVer };
    });

    res.status(200).json({
      success: true,
      changeRequest: result.updatedCr,
      proposedVersion: result.proposedVer,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelancer/change-requests/:id/decline
 * Freelancer declines a change request.
 */
router.post("/:id/decline", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const parsed = declineChangeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid decline parameters", parsed.error.flatten().fieldErrors);
    }

    const { reason } = parsed.data;

    const cr = await prisma.changeRequest.findFirst({
      where: {
        id,
        agreement: { freelancerId },
      },
    });

    if (!cr) {
      throw new NotFoundError("Change request not found");
    }

    if (
      cr.status !== ChangeRequestStatus.OPEN &&
      cr.status !== ChangeRequestStatus.QUOTE_SUBMITTED
    ) {
      throw new ConflictError(
        `Cannot decline change request in status ${cr.status}`,
        "INVALID_STATE"
      );
    }

    const updatedCr = await prisma.$transaction(async (tx) => {
      const updated = await tx.changeRequest.update({
        where: { id: cr.id },
        data: {
          status: ChangeRequestStatus.DECLINED,
        },
      });

      if (cr.proposedVersionId) {
        await tx.agreementVersion.updateMany({
          where: {
            id: cr.proposedVersionId,
            status: AgreementVersionStatus.PENDING_APPROVAL,
          },
          data: {
            status: AgreementVersionStatus.REJECTED,
          },
        });
      }

      await appendAuditEvent(
        {
          actorId: freelancerId,
          action: "CHANGE_REQUEST_DECLINED",
          objectType: "CHANGE_REQUEST",
          objectId: cr.id,
          previousStatus: cr.status,
          newStatus: ChangeRequestStatus.DECLINED,
          metadata: { reason },
        },
        tx
      );

      return updated;
    });

    res.status(200).json({
      success: true,
      changeRequest: updatedCr,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
