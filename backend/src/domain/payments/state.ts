import { PaymentState, MilestoneWorkStatus } from "@prisma/client";
import { ConflictError } from "../../lib/errors.js";

/**
 * Allowed transitions matrix for payment status.
 * Any transition not in this matrix is rejected with ConflictError.
 */
const ALLOWED_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  [PaymentState.NOT_STARTED]: [PaymentState.CREATED],
  [PaymentState.CREATED]: [
    PaymentState.APPROVED,
    PaymentState.UNKNOWN,
    PaymentState.DENIED,
  ],
  [PaymentState.APPROVED]: [
    PaymentState.CAPTURE_PENDING,
    PaymentState.CAPTURED,
    PaymentState.DENIED,
    PaymentState.APPROVAL_REVERSED,
    PaymentState.UNKNOWN,
  ],
  [PaymentState.CAPTURE_PENDING]: [
    PaymentState.CAPTURED,
    PaymentState.UNKNOWN,
    PaymentState.NEEDS_SUPPORT,
  ],
  [PaymentState.CAPTURED]: [
    PaymentState.REFUNDED,
    PaymentState.PARTIALLY_REFUNDED,
  ],
  [PaymentState.DENIED]: [],
  [PaymentState.APPROVAL_REVERSED]: [],
  [PaymentState.UNKNOWN]: [
    PaymentState.CREATED,
    PaymentState.APPROVED,
    PaymentState.CAPTURED,
    PaymentState.DENIED,
    PaymentState.NEEDS_SUPPORT,
  ],
  [PaymentState.NEEDS_SUPPORT]: [
    PaymentState.CAPTURED,
    PaymentState.REFUNDED,
  ],
  [PaymentState.REFUNDED]: [],
  [PaymentState.PARTIALLY_REFUNDED]: [PaymentState.REFUNDED],
};

export function validatePaymentTransition(current: PaymentState, next: PaymentState): void {
  if (current === next) return;

  const allowed = ALLOWED_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw new ConflictError(
      `Illegal payment transition from ${current} to ${next}`,
      "INVALID_TRANSITION"
    );
  }
}

/**
 * Maps payment and milestone state to the honest Earnings label required by Phase 7.
 */
export function getEarningsLabel(
  paymentStatus: PaymentState,
  milestoneWorkStatus?: MilestoneWorkStatus | string | null,
  isDisputed?: boolean
): string {
  if (paymentStatus === PaymentState.UNKNOWN) {
    return "Checking";
  }
  if (isDisputed || paymentStatus === PaymentState.NEEDS_SUPPORT) {
    return "On hold";
  }
  if (paymentStatus === PaymentState.REFUNDED || paymentStatus === PaymentState.PARTIALLY_REFUNDED) {
    return "Refunded";
  }
  if (paymentStatus === PaymentState.NOT_STARTED || paymentStatus === PaymentState.CREATED) {
    return "Not funded";
  }
  if (paymentStatus === PaymentState.APPROVED || paymentStatus === PaymentState.CAPTURE_PENDING) {
    return "Funding in progress";
  }
  if (paymentStatus === PaymentState.CAPTURED) {
    if (milestoneWorkStatus === "ACCEPTED" || milestoneWorkStatus === "COMPLETED") {
      return "Available";
    }
    return "Funded";
  }
  return "Not funded";
}

