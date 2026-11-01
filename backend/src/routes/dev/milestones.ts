/**
 * TEMPORARY DEV-ONLY CLIENT STAND-IN ROUTER FOR MILESTONES & CHANGE REQUESTS
 */
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import {
  Role,
  MilestoneWorkStatus,
  SubmissionStatus,
  ReviewDecision,
  DisputeStatus,
  ChangeRequestStatus,
  AgreementStatus,
  ProjectState,
} from "@prisma/client";
import { NotFoundError, ConflictError, ValidationError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import { transitionMilestone } from "../../domain/milestones/stateMachine.js";

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

const clientActionSchema = z.object({
  action: z.enum(["accept", "request_revisions", "dispute", "resolve"]),
  unmetCriteria: z.array(z.string()).optional(),
  feedback: z.string().optional(),
  reason: z.string().optional(),
});

/**
 * POST /api/dev/milestones/:id/client
 * Client stand-in actions on milestones: accept, request_revisions, dispute, resolve.
 */
router.post("/:id/client", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = clientActionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid client milestone action", parsed.error.flatten().fieldErrors);
    }

    const { action, unmetCriteria, feedback, reason } = parsed.data;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        agreement: {
          include: {
            project: true,
          },
        },
        submissions: {
          orderBy: { revisionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!milestone) {
      throw new NotFoundError("Milestone not found");
    }

    const agreement = milestone.agreement;
    if (!agreement) {
      throw new ConflictError("Milestone has no associated agreement", "NO_AGREEMENT");
    }

    const clientId = agreement.clientId;
    const currentStatus = milestone.workStatus;

    if (action === "accept") {
      transitionMilestone(currentStatus, "accept", Role.CLIENT);

      const latestSub = milestone.submissions[0];
      if (!latestSub) {
        throw new ConflictError("No submission found to accept", "NO_SUBMISSION");
      }

      const updatedMilestone = await prisma.$transaction(async (tx) => {
        // 1. Create milestone review
        await tx.milestoneReview.create({
          data: {
            submissionId: latestSub.id,
            decision: ReviewDecision.ACCEPTED,
            unmetCriteria: [],
            feedback: feedback || "Accepted by client",
            agreementVersionId: agreement.activeVersionId || milestone.lastAgreementVersionId || "",
            decidedBy: clientId,
            decidedAt: new Date(),
          },
        });

        // 2. Update submission
        await tx.milestoneSubmission.update({
          where: { id: latestSub.id },
          data: {
            status: SubmissionStatus.ACCEPTED,
            reviewedAt: new Date(),
          },
        });

        // 3. Update milestone
        const mUpdated = await tx.milestone.update({
          where: { id: milestone.id },
          data: {
            workStatus: MilestoneWorkStatus.ACCEPTED,
            acceptedAt: new Date(),
          },
        });

        // 4. Check if all milestones are accepted
        const remainingUnaccepted = await tx.milestone.count({
          where: {
            agreementId: agreement.id,
            removedAt: null,
            workStatus: { not: MilestoneWorkStatus.ACCEPTED },
          },
        });

        if (remainingUnaccepted === 0) {
          await tx.agreement.update({
            where: { id: agreement.id },
            data: { status: AgreementStatus.COMPLETED },
          });
          await tx.project.update({
            where: { id: agreement.projectId },
            data: { state: ProjectState.COMPLETED },
          });
        }

        // 5. Append audit event
        await appendAuditEvent(
          {
            actorId: clientId,
            action: "MILESTONE_ACCEPTED",
            objectType: "MILESTONE",
            objectId: milestone.id,
            previousStatus: currentStatus,
            newStatus: MilestoneWorkStatus.ACCEPTED,
            metadata: { actorRole: Role.CLIENT, submissionId: latestSub.id, feedback },
          },
          tx
        );

        return mUpdated;
      });

      res.status(200).json({ success: true, milestone: updatedMilestone });
      return;
    }

    if (action === "request_revisions") {
      // Validate unmetCriteria
      if (!unmetCriteria || unmetCriteria.length === 0) {
        throw new ValidationError("At least one unmet criterion ID is required to request revisions", {
        unmetCriteria: ["Must not be empty"],
      }, 422);
      }

      // Ensure each criterion ID belongs to this milestone
      const rawCriteria = (milestone.criteria as any[]) || [];
      const validCriterionIds = new Set(
        rawCriteria.map((c) => (typeof c === "string" ? c : c.id))
      );

      for (const critId of unmetCriteria) {
        if (!validCriterionIds.has(critId)) {
          throw new ValidationError(
            `Criterion '${critId}' does not belong to this milestone`,
            { unmetCriteria: [`Invalid criterion ID: ${critId}`] },
            422
          );
        }
      }

      transitionMilestone(currentStatus, "request_revisions", Role.CLIENT, {
        unmetCriteriaCount: unmetCriteria.length,
      });

      const latestSub = milestone.submissions[0];
      if (!latestSub) {
        throw new ConflictError("No submission found to request revisions on", "NO_SUBMISSION");
      }

      const updatedMilestone = await prisma.$transaction(async (tx) => {
        // 1. Create review
        await tx.milestoneReview.create({
          data: {
            submissionId: latestSub.id,
            decision: ReviewDecision.REVISIONS_REQUESTED,
            unmetCriteria: unmetCriteria,
            feedback: feedback || "Revisions requested",
            agreementVersionId: agreement.activeVersionId || milestone.lastAgreementVersionId || "",
            decidedBy: clientId,
            decidedAt: new Date(),
          },
        });

        // 2. Update submission
        await tx.milestoneSubmission.update({
          where: { id: latestSub.id },
          data: {
            status: SubmissionStatus.REVISIONS_REQUESTED,
            reviewedAt: new Date(),
          },
        });

        // 3. Update milestone
        const mUpdated = await tx.milestone.update({
          where: { id: milestone.id },
          data: {
            workStatus: MilestoneWorkStatus.REVISIONS_REQUESTED,
          },
        });

        // 4. Append audit event
        await appendAuditEvent(
          {
            actorId: clientId,
            action: "MILESTONE_REVISIONS_REQUESTED",
            objectType: "MILESTONE",
            objectId: milestone.id,
            previousStatus: currentStatus,
            newStatus: MilestoneWorkStatus.REVISIONS_REQUESTED,
            metadata: { actorRole: Role.CLIENT, submissionId: latestSub.id, unmetCriteria, feedback },
          },
          tx
        );

        return mUpdated;
      });

      res.status(200).json({ success: true, milestone: updatedMilestone });
      return;
    }

    if (action === "dispute") {
      transitionMilestone(currentStatus, "dispute", Role.CLIENT);

      const updatedMilestone = await prisma.$transaction(async (tx) => {
        const mUpdated = await tx.milestone.update({
          where: { id: milestone.id },
          data: {
            workStatus: MilestoneWorkStatus.DISPUTED,
            statusBeforeDispute: currentStatus,
          },
        });

        await tx.dispute.create({
          data: {
            milestoneId: milestone.id,
            openedByRole: Role.CLIENT,
            reason: reason || "Client opened dispute",
            status: DisputeStatus.OPEN,
          },
        });

        await appendAuditEvent(
          {
            actorId: clientId,
            action: "MILESTONE_DISPUTED",
            objectType: "MILESTONE",
            objectId: milestone.id,
            previousStatus: currentStatus,
            newStatus: MilestoneWorkStatus.DISPUTED,
            metadata: { actorRole: Role.CLIENT, reason },
          },
          tx
        );

        return mUpdated;
      });

      res.status(200).json({ success: true, milestone: updatedMilestone });
      return;
    }

    if (action === "resolve") {
      transitionMilestone(currentStatus, "resolve", Role.CLIENT, {
        statusBeforeDispute: milestone.statusBeforeDispute,
      });

      const targetStatus = milestone.statusBeforeDispute || MilestoneWorkStatus.IN_PROGRESS;

      const updatedMilestone = await prisma.$transaction(async (tx) => {
        const mUpdated = await tx.milestone.update({
          where: { id: milestone.id },
          data: {
            workStatus: targetStatus,
            statusBeforeDispute: null,
          },
        });

        await tx.dispute.updateMany({
          where: {
            milestoneId: milestone.id,
            status: DisputeStatus.OPEN,
          },
          data: {
            status: DisputeStatus.RESOLVED,
            resolutionNote: reason || "Dispute resolved by agreement",
            resolvedAt: new Date(),
          },
        });

        await appendAuditEvent(
          {
            actorId: clientId,
            action: "MILESTONE_DISPUTE_RESOLVED",
            objectType: "MILESTONE",
            objectId: milestone.id,
            previousStatus: currentStatus,
            newStatus: targetStatus,
            metadata: { actorRole: Role.CLIENT, resolutionNote: reason },
          },
          tx
        );

        return mUpdated;
      });

      res.status(200).json({ success: true, milestone: updatedMilestone });
      return;
    }
  } catch (err) {
    next(err);
  }
});

const createChangeRequestSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

/**
 * POST /api/dev/projects/:id/change-requests
 * Simulate client creating an open change request.
 */
router.post("/projects/:id/change-requests", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: projectId } = req.params;

    const parsed = createChangeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid change request parameters", parsed.error.flatten().fieldErrors);
    }

    const { description } = parsed.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        agreement: true,
      },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const agreement = project.agreement;
    if (!agreement) {
      throw new ConflictError("Project has no associated agreement", "NO_AGREEMENT");
    }

    if (!agreement.activeVersionId) {
      throw new ConflictError("Agreement has no active version", "NO_ACTIVE_VERSION");
    }

    const cr = await prisma.$transaction(async (tx) => {
      const created = await tx.changeRequest.create({
        data: {
          projectId: project.id,
          agreementId: agreement.id,
          baseVersionId: agreement.activeVersionId,
          raisedByRole: Role.CLIENT,
          raisedById: project.clientId,
          description,
          status: ChangeRequestStatus.OPEN,
        },
      });

      await appendAuditEvent(
        {
          actorId: project.clientId,
          action: "CHANGE_REQUEST_CREATED",
          objectType: "CHANGE_REQUEST",
          objectId: created.id,
          previousStatus: "NONE",
          newStatus: ChangeRequestStatus.OPEN,
          metadata: { actorRole: Role.CLIENT, projectId: project.id, agreementId: agreement.id },
        },
        tx
      );

      return created;
    });

    res.status(201).json({ success: true, changeRequest: cr });
  } catch (err) {
    next(err);
  }
});

export default router;
