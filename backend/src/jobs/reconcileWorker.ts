import { prisma } from "../prisma.js";
import { getPayPalOrder } from "../domain/payments/paypal.js";
import { PaymentEventSource, PaymentState } from "@prisma/client";
import { appendAuditEvent } from "../lib/audit.js";

/**
 * Reconcile Worker
 * Periodically polls PayPal Orders v2 for unconfirmed, pending, or UNKNOWN payments.
 * Prevents phantom states by confirming real status directly with PayPal.
 */
export async function reconcileStalePayments(
  olderThanMs: number = 2 * 60 * 1000
): Promise<{ reconciledCount: number; results: any[] }> {
  const cutoff = new Date(Date.now() - olderThanMs);

  const stalePayments = await prisma.payment.findMany({
    where: {
      status: {
        in: [
          PaymentState.CREATED,
          PaymentState.APPROVED,
          PaymentState.CAPTURE_PENDING,
          PaymentState.UNKNOWN,
        ],
      },
      updatedAt: { lte: cutoff },
      paypalOrderId: { not: null },
    },
    take: 50,
  });

  const results: any[] = [];

  for (const payment of stalePayments) {
    const orderId = payment.paypalOrderId!;
    try {
      const order = await getPayPalOrder(orderId);
      const paypalStatus = order.status;
      const prevStatus = payment.status;
      let newStatus: PaymentState = prevStatus;
      let captureId = payment.paypalCaptureId;

      if (paypalStatus === "COMPLETED") {
        newStatus = PaymentState.CAPTURED;
        if (order.captureId) {
          captureId = order.captureId;
        }
      } else if (paypalStatus === "APPROVED") {
        newStatus = PaymentState.APPROVED;
      } else if (paypalStatus === "VOIDED") {
        newStatus = PaymentState.DENIED;
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            paypalCaptureId: captureId,
          },
        });

        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            source: PaymentEventSource.RECONCILE,
            eventType: `RECONCILED_${paypalStatus}`,
            verified: true,
            rawPayload: order,
          },
        });
      });

      await appendAuditEvent({
        actorId: "RECONCILE_WORKER",
        action: "PAYMENT_RECONCILED",
        objectType: "PAYMENT",
        objectId: payment.id,
        previousStatus: prevStatus,
        newStatus,
        metadata: { paypalStatus },
      });

      results.push({
        paymentId: payment.id,
        paypalOrderId: orderId,
        previousStatus: prevStatus,
        newStatus,
        success: true,
      });
    } catch (err: any) {
      console.warn(`[ReconcileWorker] Failed to reconcile payment ${payment.id} (order: ${orderId}):`, err.message);
      results.push({
        paymentId: payment.id,
        paypalOrderId: orderId,
        error: err.message,
        success: false,
      });
    }
  }

  return { reconciledCount: results.filter((r) => r.success).length, results };
}
