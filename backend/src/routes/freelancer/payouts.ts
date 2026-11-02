import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { Role, LedgerEntryKind, PayoutStatus } from "@prisma/client";
import { ConflictError, ValidationError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

const payoutAccountSchema = z.object({
  label: z.string().default("Personal PayPal"),
  accountEmail: z.string().email("Valid email required"),
  last4: z.string().max(4, "Last 4 digits cannot exceed 4 characters").default("0000"),
});

const payoutRequestSchema = z.object({
  amountMinor: z.number().int().positive("Amount must be a positive integer in minor units"),
  currency: z.string().default("USD"),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
});

/**
 * GET /api/freelancer/payout-account
 * Fetch active simulated payout account for the freelancer.
 */
router.get("/payout-account", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const freelancerId = req.user!.id;

    const account = await prisma.payoutAccount.findUnique({
      where: { freelancerId },
    });

    res.status(200).json({
      success: true,
      account: account
        ? {
            id: account.id,
            label: account.label,
            accountEmail: account.accountEmail,
            last4: account.last4,
            createdAt: account.createdAt.toISOString(),
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelancer/payout-account
 * Register or update simulated payout account.
 */
router.post("/payout-account", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const freelancerId = req.user!.id;
    const parsed = payoutAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid payout account details", parsed.error.flatten().fieldErrors);
    }

    const { label, accountEmail, last4 } = parsed.data;

    const account = await prisma.payoutAccount.upsert({
      where: { freelancerId },
      create: {
        freelancerId,
        label,
        accountEmail,
        last4,
      },
      update: {
        label,
        accountEmail,
        last4,
      },
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "PAYOUT_ACCOUNT_SAVED",
      objectType: "PAYOUT_ACCOUNT",
      objectId: account.id,
      metadata: { label, last4 },
    });

    res.status(201).json({
      success: true,
      account: {
        id: account.id,
        label: account.label,
        accountEmail: account.accountEmail,
        last4: account.last4,
        createdAt: account.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/freelancer/payout-account
 * Delete simulated payout account.
 */
router.delete("/payout-account", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const freelancerId = req.user!.id;

    await prisma.payoutAccount.deleteMany({
      where: { freelancerId },
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "PAYOUT_ACCOUNT_DELETED",
      objectType: "PAYOUT_ACCOUNT",
      objectId: freelancerId,
    });

    res.status(200).json({
      success: true,
      message: "Payout account deleted",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelancer/payouts
 * Request a simulated payout with strict balance checks and idempotency.
 */
router.post("/payouts", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const freelancerId = req.user!.id;
    const parsed = payoutRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid payout request", parsed.error.flatten().fieldErrors);
    }

    const { amountMinor, currency, idempotencyKey } = parsed.data;

    // 1. Idempotency check: if payout already exists with this key, return it
    const existingPayout = await prisma.payout.findUnique({
      where: { idempotencyKey },
    });

    if (existingPayout) {
      res.status(200).json({
        success: true,
        payout: {
          id: existingPayout.id,
          amountMinor: existingPayout.amountMinor,
          currency: existingPayout.currency,
          status: existingPayout.status,
          methodLabel: existingPayout.methodLabel,
          idempotencyKey: existingPayout.idempotencyKey,
          createdAt: existingPayout.createdAt.toISOString(),
        },
      });
      return;
    }

    // 2. Account check
    const account = await prisma.payoutAccount.findUnique({
      where: { freelancerId },
    });
    if (!account) {
      throw new ConflictError("No active payout account found. Add an account first.", "NO_PAYOUT_ACCOUNT");
    }

    // 3. Balance verification over real ledger entries
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: { userId: freelancerId },
      select: { kind: true, amountMinor: true, projectId: true },
    });

    let totalReleased = 0;
    let totalWithdrawn = 0;
    let projectId = ledgerEntries[0]?.projectId || "";

    for (const entry of ledgerEntries) {
      if (entry.kind === LedgerEntryKind.RELEASED) {
        totalReleased += entry.amountMinor;
      } else if (entry.kind === LedgerEntryKind.PAYOUT_SIMULATED) {
        totalWithdrawn += entry.amountMinor;
      }
    }

    const availableMinor = Math.max(0, totalReleased - totalWithdrawn);
    if (amountMinor > availableMinor) {
      throw new ConflictError(
        `Insufficient available funds. Requested: ${amountMinor}, Available: ${availableMinor}`,
        "INSUFFICIENT_FUNDS"
      );
    }

    if (!projectId) {
      // Find a project the freelancer is part of
      const ag = await prisma.agreement.findFirst({
        where: { freelancerId },
        select: { projectId: true },
      });
      projectId = ag?.projectId || "";
    }

    // 4. Create payout and append-only ledger entry in transaction
    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          freelancerId,
          amountMinor,
          currency,
          status: PayoutStatus.SIMULATED_PAID,
          methodLabel: account.label,
          idempotencyKey,
        },
      });

      if (projectId) {
        await tx.ledgerEntry.create({
          data: {
            userId: freelancerId,
            projectId,
            amountMinor,
            currency,
            kind: LedgerEntryKind.PAYOUT_SIMULATED,
          },
        });
      }

      return payout;
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "PAYOUT_COMPLETED",
      objectType: "PAYOUT",
      objectId: result.id,
      metadata: { amountMinor, currency, idempotencyKey },
    });

    res.status(201).json({
      success: true,
      payout: {
        id: result.id,
        amountMinor: result.amountMinor,
        currency: result.currency,
        status: result.status,
        methodLabel: result.methodLabel,
        idempotencyKey: result.idempotencyKey,
        createdAt: result.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/payouts
 * History of payouts for the authenticated freelancer.
 */
router.get("/payouts", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const freelancerId = req.user!.id;

    const payouts = await prisma.payout.findMany({
      where: { freelancerId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      payouts: payouts.map((p) => ({
        id: p.id,
        amountMinor: p.amountMinor,
        currency: p.currency,
        status: p.status,
        methodLabel: p.methodLabel,
        idempotencyKey: p.idempotencyKey,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
