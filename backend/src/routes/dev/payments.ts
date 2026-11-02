import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { createPayPalOrder, capturePayPalOrder } from "../../domain/payments/paypal.js";
import { PaymentEventSource, PaymentState } from "@prisma/client";
import { NotFoundError, ConflictError, ValidationError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";

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

const createOrderSchema = z.object({
  milestoneId: z.string().min(1, "milestoneId is required"),
});

const captureSchema = z.object({
  paymentId: z.string().optional(),
  orderId: z.string().optional(),
});

const simulateStateSchema = z.object({
  paymentId: z.string().min(1, "paymentId is required"),
  status: z.nativeEnum(PaymentState),
});

/**
 * POST /api/dev/payments/create-order
 * Stand-in client endpoint: creates a PayPal Orders v2 order for a milestone.
 */
router.post("/create-order", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid create-order payload", parsed.error.flatten().fieldErrors);
    }

    const { milestoneId } = parsed.data;

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        agreement: true,
        payments: {
          where: { status: PaymentState.CAPTURED },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundError("Milestone not found");
    }

    if (milestone.payments.length > 0) {
      throw new ConflictError("Milestone is already funded or captured", "ALREADY_FUNDED");
    }

    const requestId = crypto.randomUUID();
    const order = await createPayPalOrder({
      amountMinor: milestone.amountMinor,
      currency: milestone.currency,
      referenceId: milestone.id,
      requestId,
      description: `Payment for milestone: ${milestone.title}`,
    });

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          projectId: (milestone.projectId || milestone.agreement?.projectId)!,
          milestoneId: milestone.id,
          milestoneKey: milestone.milestoneKey || null,
          paypalOrderId: order.orderId,
          status: PaymentState.CREATED,
          amountMinor: milestone.amountMinor,
          currency: milestone.currency,
          requestId,
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: p.id,
          source: PaymentEventSource.DEV,
          eventType: "CHECKOUT.ORDER.CREATED",
          verified: true,
          rawPayload: order,
        },
      });

      return p;
    });

    await appendAuditEvent({
      actorId: "DEV_CLIENT",
      action: "PAYMENT_ORDER_CREATED",
      objectType: "PAYMENT",
      objectId: payment.id,
      metadata: { milestoneId, orderId: order.orderId },
    });

    res.status(201).json({
      success: true,
      payment: {
        id: payment.id,
        milestoneId: payment.milestoneId,
        paypalOrderId: payment.paypalOrderId,
        status: payment.status,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
      },
      order,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/dev/payments/capture
 * Stand-in client endpoint: captures an approved PayPal order.
 */
router.post("/capture", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = captureSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid capture payload", parsed.error.flatten().fieldErrors);
    }

    const { paymentId, orderId } = parsed.data;
    if (!paymentId && !orderId) {
      throw new ValidationError("Either paymentId or orderId must be provided");
    }

    const payment = await prisma.payment.findFirst({
      where: paymentId ? { id: paymentId } : { paypalOrderId: orderId },
      include: { milestone: true },
    });

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    const paypalOrderId = payment.paypalOrderId || orderId!;
    const requestId = crypto.randomUUID();
    const captureResult = await capturePayPalOrder(paypalOrderId, requestId);

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentState.CAPTURED,
          paypalCaptureId: captureResult.captureId,
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          source: PaymentEventSource.DEV,
          eventType: "PAYMENT.CAPTURE.COMPLETED",
          verified: true,
          rawPayload: captureResult,
        },
      });

      return p;
    });

    await appendAuditEvent({
      actorId: "DEV_CLIENT",
      action: "PAYMENT_CAPTURED",
      objectType: "PAYMENT",
      objectId: payment.id,
      metadata: { captureId: captureResult.captureId, milestoneId: payment.milestoneId },
    });

    res.status(200).json({
      success: true,
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        paypalOrderId: updatedPayment.paypalOrderId,
        paypalCaptureId: updatedPayment.paypalCaptureId,
      },
      capture: captureResult,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/dev/payments/simulate-state
 * Simulates arbitrary payment status transitions (UNKNOWN, DENIED, REFUNDED) for testing.
 */
router.post("/simulate-state", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = simulateStateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid simulate-state payload", parsed.error.flatten().fieldErrors);
    }

    const { paymentId, status } = parsed.data;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    const prevStatus = payment.status;

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status,
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId,
          source: PaymentEventSource.DEV,
          eventType: `SIMULATED_${status}`,
          verified: true,
          rawPayload: { simulated: true, requestedStatus: status },
        },
      });

      return p;
    });

    await appendAuditEvent({
      actorId: "DEV_SIMULATION",
      action: `PAYMENT_SIMULATED_${status}`,
      objectType: "PAYMENT",
      objectId: paymentId,
      previousStatus: prevStatus,
      newStatus: status,
    });

    res.status(200).json({
      success: true,
      payment: {
        id: updated.id,
        status: updated.status,
        previousStatus: prevStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
