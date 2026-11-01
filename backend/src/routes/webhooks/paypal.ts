import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../prisma.js";
import { verifyPayPalWebhookSignature } from "../../domain/payments/paypal.js";
import { validatePaymentTransition } from "../../domain/payments/state.js";
import { PaymentEventSource, PaymentState } from "@prisma/client";
import { appendAuditEvent } from "../../lib/audit.js";

const router = Router();

/**
 * POST /api/webhooks/paypal
 * Cryptographically verifies PayPal webhook signatures against unparsed raw body.
 * Idempotently processes events, transitions payment state, and writes immutable audit logs.
 */
router.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawBuffer = (req as any).rawBody;
    const rawBody = rawBuffer ? rawBuffer.toString("utf-8") : JSON.stringify(req.body);

    const webhookId = process.env.PAYPAL_WEBHOOK_ID || "SANDBOX_MOCK_WEBHOOK_ID";

    // 1. Verify signature
    const isValid = await verifyPayPalWebhookSignature({
      headers: req.headers as Record<string, string | string[] | undefined>,
      rawBody,
      webhookId,
    });

    let event: any;
    try {
      event = typeof req.body === "object" && req.body !== null ? req.body : JSON.parse(rawBody);
    } catch {
      res.status(400).json({
        error: {
          code: "INVALID_JSON",
          message: "Could not parse webhook JSON payload",
          details: null,
        },
      });
      return;
    }

    const eventId = event?.id || `unverified_${Date.now()}`;
    const eventType = event?.event_type || "UNKNOWN";
    const resource = event?.resource || {};

    // If signature verification fails: log unverified event and return 400
    if (!isValid) {
      const possibleOrderId = resource.id || resource.supplementary_data?.related_ids?.order_id;
      const matchedPayment = possibleOrderId
        ? await prisma.payment.findFirst({
            where: {
              OR: [{ paypalOrderId: possibleOrderId }, { paypalCaptureId: possibleOrderId }],
            },
          })
        : null;

      if (matchedPayment) {
        await prisma.paymentEvent.create({
          data: {
            paymentId: matchedPayment.id,
            source: PaymentEventSource.WEBHOOK,
            paypalEventId: eventId,
            eventType,
            verified: false,
            rawPayload: event,
          },
        });
      }

      res.status(400).json({
        error: {
          code: "INVALID_WEBHOOK_SIGNATURE",
          message: "PayPal webhook signature verification failed",
          details: null,
        },
      });
      return;
    }

    // 2. Deduplication check: if event already processed, return 200 immediately
    const existingEvent = await prisma.paymentEvent.findFirst({
      where: { paypalEventId: eventId, verified: true },
    });

    if (existingEvent) {
      res.status(200).json({
        success: true,
        deduplicated: true,
        message: "Webhook event already processed",
      });
      return;
    }

    // 3. Match payment in database
    const orderId =
      resource.supplementary_data?.related_ids?.order_id ||
      (resource.intent ? resource.id : undefined) ||
      resource.custom_id;
    const captureId = resource.intent ? undefined : resource.id;

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          orderId ? { paypalOrderId: orderId } : undefined,
          captureId ? { paypalCaptureId: captureId } : undefined,
          resource.custom_id ? { id: resource.custom_id } : undefined,
        ].filter(Boolean) as any,
      },
      include: {
        milestone: true,
      },
    });

    if (!payment) {
      // Valid signature but untracked payment; acknowledge PayPal
      res.status(200).json({
        success: true,
        processed: false,
        message: "Webhook received but payment not found in system",
      });
      return;
    }

    // 4. Determine state transition
    let targetStatus: PaymentState | null = null;
    let actualCaptureId = payment.paypalCaptureId;

    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      targetStatus = PaymentState.APPROVED;
    } else if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      targetStatus = PaymentState.CAPTURED;
      actualCaptureId = resource.id || payment.paypalCaptureId;
    } else if (eventType === "PAYMENT.CAPTURE.DENIED") {
      targetStatus = PaymentState.DENIED;
    } else if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
      targetStatus = PaymentState.REFUNDED;
    }

    if (!targetStatus) {
      // Unhandled event type, record verified log
      await prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          source: PaymentEventSource.WEBHOOK,
          paypalEventId: eventId,
          eventType,
          verified: true,
          rawPayload: event,
        },
      });

      res.status(200).json({ success: true, processed: true, eventType });
      return;
    }

    // Validate transition
    validatePaymentTransition(payment.status, targetStatus);

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: targetStatus!,
          paypalCaptureId: actualCaptureId,
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          source: PaymentEventSource.WEBHOOK,
          paypalEventId: eventId,
          eventType,
          verified: true,
          rawPayload: event,
        },
      });
    });

    await appendAuditEvent({
      actorId: "PAYPAL_WEBHOOK",
      action: `PAYMENT_${targetStatus}`,
      objectType: "PAYMENT",
      objectId: payment.id,
      previousStatus: payment.status,
      newStatus: targetStatus,
      metadata: { eventId, eventType },
    });

    res.status(200).json({
      success: true,
      processed: true,
      paymentId: payment.id,
      status: targetStatus,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
