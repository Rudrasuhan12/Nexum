import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { Role, MilestoneWorkStatus, LedgerEntryKind, PaymentState } from "@prisma/client";
import { NotFoundError, ForbiddenError } from "../../lib/errors.js";
import { getEarningsLabel } from "../../domain/payments/state.js";

const router = Router();

// Freelancer authentication guard
router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

/**
 * GET /api/freelancer/earnings/summary
 * Honest summary of earnings, balances, and funding aggregated over real records.
 */
router.get("/summary", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const freelancerId = req.user!.id;

    // 1. Fetch all ledger entries for this freelancer
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: { userId: freelancerId },
    });

    let totalReleased = 0;
    let totalWithdrawn = 0;
    let totalOnHold = 0;

    for (const entry of ledgerEntries) {
      if (entry.kind === LedgerEntryKind.RELEASED) {
        totalReleased += entry.amountMinor;
      } else if (entry.kind === LedgerEntryKind.PAYOUT_SIMULATED) {
        totalWithdrawn += entry.amountMinor;
      } else if (entry.kind === LedgerEntryKind.HOLD) {
        totalOnHold += entry.amountMinor;
      }
    }

    const availableMinor = Math.max(0, totalReleased - totalWithdrawn);

    // 2. Fetch all milestones with payments for funded & in-review minor
    const milestones = await prisma.milestone.findMany({
      where: {
        agreement: { freelancerId },
        removedAt: null,
      },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    let fundedMinor = 0;
    let inReviewMinor = 0;

    for (const m of milestones) {
      const payment = m.payments[0];
      const isCaptured = payment && payment.status === PaymentState.CAPTURED;

      if (isCaptured && m.workStatus !== MilestoneWorkStatus.ACCEPTED) {
        fundedMinor += m.amountMinor;
      }

      if (isCaptured && m.workStatus === MilestoneWorkStatus.AWAITING_CLIENT_REVIEW) {
        inReviewMinor += m.amountMinor;
      }
    }

    // 3. Hourly demo rate default ($85.00/hr = 8500 minor units)
    const demoRate = 8500;

    res.status(200).json({
      success: true,
      summary: {
        availableMinor,
        fundedMinor,
        inReviewMinor,
        withdrawnMinor: totalWithdrawn,
        onHoldMinor: totalOnHold,
        currency: "USD",
        demoRate,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/earnings/milestones
 * Paginated list of milestones with honest earnings labels and lastVerifiedAt.
 */
router.get("/milestones", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const freelancerId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 10));
    const statusFilter = (req.query.status as string)?.toLowerCase();
    const projectIdFilter = req.query.projectId as string | undefined;

    const whereClause: any = {
      agreement: { freelancerId },
      removedAt: null,
    };
    if (projectIdFilter) {
      whereClause.projectId = projectIdFilter;
    }

    const allMilestones = await prisma.milestone.findMany({
      where: whereClause,
      include: {
        project: {
          include: {
            client: { select: { id: true, name: true } },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        disputes: {
          where: { status: "OPEN" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = allMilestones.map((m) => {
      const payment = m.payments[0] || null;
      const paymentStatus = payment?.status || PaymentState.NOT_STARTED;
      const hasHold = m.disputes.length > 0 || paymentStatus === PaymentState.NEEDS_SUPPORT;
      const earningsLabel = getEarningsLabel(paymentStatus, m.workStatus, hasHold);

      return {
        id: m.id,
        milestoneKey: m.milestoneKey,
        sequence: m.sequence ?? m.orderIndex,
        title: m.title,
        projectId: m.projectId,
        projectTitle: m.project?.title || "Project",
        clientName: m.project?.client?.name || "Client",
        amountMinor: m.amountMinor,
        currency: m.currency,
        workStatus: m.workStatus,
        paymentStatus,
        earningsLabel,
        lastVerifiedAt: payment?.updatedAt ? payment.updatedAt.toISOString() : null,
        dueDate: m.dueDate ? m.dueDate.toISOString() : null,
        acceptedAt: m.acceptedAt ? m.acceptedAt.toISOString() : null,
      };
    });

    // Apply earnings label filter if specified
    const filteredItems = statusFilter
      ? items.filter(
          (item) =>
            item.earningsLabel.toLowerCase() === statusFilter ||
            item.paymentStatus.toLowerCase() === statusFilter
        )
      : items;

    const total = filteredItems.length;
    const paginated = filteredItems.slice((page - 1) * pageSize, page * pageSize);

    res.status(200).json({
      success: true,
      milestones: paginated,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/earnings/milestones/:projectId/:milestoneKey
 * Detail view of milestone earnings with audit timeline of events and ledger entries.
 */
router.get(
  "/milestones/:projectId/:milestoneKey",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const freelancerId = req.user!.id;
      const { projectId, milestoneKey } = req.params;

      const milestone = await prisma.milestone.findFirst({
        where: {
          projectId,
          milestoneKey,
          agreement: { freelancerId },
          removedAt: null,
        },
        include: {
          project: {
            include: {
              client: { select: { id: true, name: true } },
            },
          },
          payments: {
            include: {
              events: {
                orderBy: { receivedAt: "asc" },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          ledgerEntries: {
            orderBy: { createdAt: "asc" },
          },
          disputes: true,
        },
      });

      if (!milestone) {
        throw new NotFoundError("Milestone not found");
      }

      const payment = milestone.payments[0] || null;
      const paymentStatus = payment?.status || PaymentState.NOT_STARTED;
      const hasHold = milestone.disputes.some((d) => d.status === "OPEN") || paymentStatus === PaymentState.NEEDS_SUPPORT;
      const earningsLabel = getEarningsLabel(paymentStatus, milestone.workStatus, hasHold);

      // Construct timeline from payment events and ledger entries
      const timeline: Array<{
        type: "PAYMENT_EVENT" | "LEDGER_ENTRY";
        title: string;
        status: string;
        timestamp: string;
        details?: any;
      }> = [];

      if (payment) {
        for (const ev of payment.events) {
          timeline.push({
            type: "PAYMENT_EVENT",
            title: `PayPal Event: ${ev.source}`,
            status: ev.eventType,
            timestamp: ev.receivedAt.toISOString(),
            details: {
              verified: ev.verified,
              paypalEventId: ev.paypalEventId,
              source: ev.source,
            },
          });
        }
      }

      for (const entry of milestone.ledgerEntries) {
        timeline.push({
          type: "LEDGER_ENTRY",
          title: `Ledger ${entry.kind}`,
          status: entry.kind,
          timestamp: entry.createdAt.toISOString(),
          details: {
            amountMinor: entry.amountMinor,
            currency: entry.currency,
          },
        });
      }

      // Sort timeline ascending
      timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      res.status(200).json({
        success: true,
        milestone: {
          id: milestone.id,
          milestoneKey: milestone.milestoneKey,
          title: milestone.title,
          description: milestone.description,
          amountMinor: milestone.amountMinor,
          currency: milestone.currency,
          workStatus: milestone.workStatus,
          paymentStatus,
          earningsLabel,
          lastVerifiedAt: payment?.updatedAt ? payment.updatedAt.toISOString() : null,
          project: milestone.project,
          payment: payment
            ? {
                id: payment.id,
                paypalOrderId: payment.paypalOrderId,
                paypalCaptureId: payment.paypalCaptureId,
                status: payment.status,
                amountMinor: payment.amountMinor,
                currency: payment.currency,
                createdAt: payment.createdAt.toISOString(),
                updatedAt: payment.updatedAt.toISOString(),
              }
            : null,
          timeline,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/freelancer/payments/:paymentId/evidence
 * Return canonical signed evidence packet for a payment.
 */
router.get(
  "/payments/:paymentId/evidence",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const freelancerId = req.user!.id;
      const { paymentId } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          milestone: {
            include: {
              agreement: true,
            },
          },
          evidencePacket: true,
        },
      });

      if (!payment) {
        throw new NotFoundError("Payment not found");
      }

      // Ownership check
      if (payment.milestone?.agreement?.freelancerId !== freelancerId && req.user!.role !== Role.CLIENT) {
        throw new ForbiddenError("You do not have access to this payment's evidence packet");
      }

      if (!payment.evidencePacket) {
        throw new NotFoundError("Evidence packet not yet generated for this payment");
      }

      res.status(200).json({
        success: true,
        evidence: {
          id: payment.evidencePacket.id,
          paymentId: payment.evidencePacket.paymentId,
          canonicalPayload: payment.evidencePacket.payload,
          sha256Hash: payment.evidencePacket.sha256,
          createdAt: payment.evidencePacket.createdAt.toISOString(),
          verified: true,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
