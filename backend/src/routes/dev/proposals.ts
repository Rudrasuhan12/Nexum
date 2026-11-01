import { createAgreementTermsFromProposalVersion } from "../../domain/agreements/createTerms.js";
import { AgreementStatus, AgreementVersionStatus } from "@prisma/client";
/**
 * TEMPORARY DEV-ONLY CLIENT STAND-IN ROUTER
 *
 * This router provides stand-in endpoints simulating client actions on proposals
 * (review, shortlist, discuss, counteroffer, accept, reject) until the client backend
 * is fully built.
 *
 * SECURITY ENFORCEMENT:
 * - Returns 404 NOT_FOUND unless ENABLE_DEV_TOOLS === "true" and NODE_ENV !== "production".
 * - Calls the exact same domain state machine transitionProposal and version-creation logic.
 */

import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { prisma } from "../../prisma.js";
import { Role, ProposalStatus } from "@prisma/client";
import { NotFoundError, ConflictError, ValidationError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import { transitionProposal, ProposalEventName } from "../../domain/proposals/stateMachine.js";

const router = Router();

// Dev guard middleware: Disabled in production and unless ENABLE_DEV_TOOLS === "true"
router.use((_req: Request, _res: Response, next: NextFunction) => {
  const isDevToolsEnabled = process.env.ENABLE_DEV_TOOLS === "true";
  const isNotProduction = process.env.NODE_ENV !== "production";

  if (!isDevToolsEnabled || !isNotProduction) {
    throw new NotFoundError("Dev tools endpoints are disabled in this environment");
  }
  next();
});

interface DevClientActionBody {
  action: "review" | "shortlist" | "discuss" | "counteroffer" | "accept" | "reject";
  terms?: {
    totalAmountMinor?: number;
    hourlyRateMinor?: number;
    estimatedHours?: number;
    estimatedDurationWeeks?: number;
    scopeText?: string;
    deliverables?: any[];
    milestones?: any[];
  };
  feedback?: string;
}

/**
 * POST /api/dev/proposals/:id/client
 * Temporary client stand-in action dispatcher.
 */
router.post("/:id/client", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, terms, feedback } = req.body as DevClientActionBody;

    if (!action) {
      throw new ValidationError("action is required ('review', 'shortlist', 'discuss', 'counteroffer', 'accept', 'reject')");
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        project: true,
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });

    if (!proposal) {
      throw new NotFoundError("Proposal not found");
    }

    let eventName: ProposalEventName;
    if (action === "review") eventName = "start_review";
    else if (action === "shortlist") eventName = "shortlist";
    else if (action === "discuss") eventName = "start_discussion";
    else if (action === "counteroffer") eventName = "counteroffer";
    else if (action === "accept") eventName = "accept";
    else if (action === "reject") eventName = "reject";
    else {
      throw new ValidationError(`Unsupported client action: ${action}`);
    }

    // Call domain state machine
    const nextStatus = transitionProposal(proposal.status, eventName, Role.CLIENT);
    const currentVersion = proposal.versions[0];
    const now = new Date();

    const [updatedProposal, newVersion] = await prisma.$transaction(async (tx) => {
      let createdVersion: any = null;
      let newCurrentVersionId = proposal.currentVersionId;

      // For counteroffer, create a new version authored by CLIENT
      if (eventName === "counteroffer") {
        const nextVerNum = (currentVersion?.version || 1) + 1;
        const vHash = `hash_${proposal.id}_v${nextVerNum}_client_counter_${Date.now()}`;

        createdVersion = await tx.proposalVersion.create({
          data: {
            proposalId: proposal.id,
            projectId: proposal.projectId,
            freelancerId: proposal.freelancerId,
            version: nextVerNum,
            versionNumber: nextVerNum,
            authorRole: Role.CLIENT,
            parentVersionId: currentVersion?.id || null,
            versionHash: vHash,
            contentHash: vHash,
            coverLetter: currentVersion?.coverLetter,
            scopeText: terms?.scopeText || currentVersion?.scopeText,
            scope: terms?.scopeText || currentVersion?.scope || "",
            paymentModel: currentVersion?.paymentModel,
            totalAmountMinor: terms?.totalAmountMinor ?? currentVersion?.totalAmountMinor,
            hourlyRateMinor: terms?.hourlyRateMinor ?? currentVersion?.hourlyRateMinor,
            estimatedHours: terms?.estimatedHours ?? currentVersion?.estimatedHours,
            amountCents: terms?.totalAmountMinor ?? currentVersion?.amountCents ?? 0,
            currency: currentVersion?.currency || "USD",
            estimatedDurationWeeks: terms?.estimatedDurationWeeks ?? currentVersion?.estimatedDurationWeeks,
            deliverables: terms?.deliverables || currentVersion?.deliverables || [],
            milestonesJson: terms?.milestones || currentVersion?.milestonesJson || [],
            status: ProposalStatus.COUNTEROFFER_RECEIVED,
            submittedAt: now,
          },
        });
        newCurrentVersionId = createdVersion.id;
      }

      if (eventName === "accept") {
        const existingAgreement = await tx.agreement.findUnique({
          where: { projectId: proposal.projectId },
        });
        if (!existingAgreement && currentVersion) {
          const { terms: agTerms, contentHash } = createAgreementTermsFromProposalVersion(currentVersion);
          await tx.agreement.create({
            data: {
              projectId: proposal.projectId,
              proposalId: proposal.id,
              clientId: proposal.project.clientId,
              freelancerId: proposal.freelancerId,
              status: AgreementStatus.PENDING_APPROVAL,
              versions: {
                create: {
                  versionNumber: 1,
                  source: "PROPOSAL",
                  sourceRefId: proposal.id,
                  terms: agTerms as any,
                  contentHash,
                  status: AgreementVersionStatus.PENDING_APPROVAL,
                },
              },
            },
          });
        }
      }

      // Update proposal
      const p = await tx.proposal.update({
        where: { id: proposal.id },
        data: {
          status: nextStatus,
          currentVersionId: newCurrentVersionId,
          rejectionFeedback: eventName === "reject" ? feedback || "Declined by client" : proposal.rejectionFeedback,
          lastActivityAt: now,
        },
      });

      // Create ProposalEvent
      await tx.proposalEvent.create({
        data: {
          proposalId: p.id,
          proposalVersionId: newCurrentVersionId,
          actorRole: Role.CLIENT,
          actorId: proposal.project.clientId,
          type: action.toUpperCase(),
          fromStatus: proposal.status,
          toStatus: nextStatus,
          metadata: {
            action,
            feedback: feedback || null,
            terms: terms || null,
            note: "Simulated client action via temporary dev stand-in",
          },
        },
      });

      return [p, createdVersion];
    });

    // Audit event
    await appendAuditEvent({
      actorId: proposal.project.clientId,
      action: `PROPOSAL_CLIENT_${action.toUpperCase()}`,
      objectType: "Proposal",
      objectId: proposal.id,
      previousStatus: proposal.status,
      newStatus: nextStatus,
      metadata: { action, feedback, terms },
    });

    res.status(200).json({
      success: true,
      proposal: updatedProposal,
      newVersion,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
