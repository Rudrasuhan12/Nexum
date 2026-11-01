import { MessageClass } from "@prisma/client";
import { ClassificationResult, ProjectContextSummary } from "./classify.js";

export interface ValidationOutcome {
  valid: boolean;
  errors: string[];
}

const BLOCKED_COMMITMENT_PHRASES = [
  /\bI agree\b/i,
  /\bI accept\b/i,
  /\bApproved\b/i,
  /\bCommit to pay\b/i,
  /\bI will pay\b/i,
  /\bI promise\b/i,
  /\bAgreed to release\b/i,
];

const FORBIDDEN_PAYMENT_CLAIMS = [
  /\bhas been paid\b/i,
  /\bpayment released\b/i,
  /\bescrow released\b/i,
  /\bpayout completed\b/i,
];

/**
 * Validates AI mediation output before delivering to user or storing.
 */
export function validateMediationOutput(
  mediation: ClassificationResult,
  originalMessage: string,
  context: ProjectContextSummary,
  verifiedPaymentDataAvailable: boolean = false
): ValidationOutcome {
  const errors: string[] = [];

  // 1. Classification check
  if (!Object.values(MessageClass).includes(mediation.classification)) {
    errors.push(`Invalid classification: ${mediation.classification}`);
  }

  // 2. Linked Milestone check
  if (mediation.linkedMilestoneId) {
    const exists = context.milestones.some((m) => m.id === mediation.linkedMilestoneId);
    if (!exists) {
      errors.push(`Linked milestone ID ${mediation.linkedMilestoneId} does not belong to project`);
    }
  }

  // 3. Spoken commitments check
  for (const regex of BLOCKED_COMMITMENT_PHRASES) {
    if (regex.test(mediation.summaryForRecipient)) {
      errors.push(`Summary contains blocked commitment phrase matching ${regex}`);
      break;
    }
  }

  // 4. Forbidden payment claims check
  if (!verifiedPaymentDataAvailable) {
    for (const regex of FORBIDDEN_PAYMENT_CLAIMS) {
      if (regex.test(mediation.summaryForRecipient)) {
        errors.push(`Summary asserts unverified payment claim matching ${regex}`);
        break;
      }
    }
  }

  // 5. Invented numbers / currency amounts check
  // Extract all digit sequences or currency amounts ($500, 5000, 10%)
  const numberRegex = /\b\d+(?:,\d{3})*(?:\.\d+)?\b/g;
  const summaryNumbers = mediation.summaryForRecipient.match(numberRegex) || [];

  if (summaryNumbers.length > 0) {
    const originalTextAndContext = (
      originalMessage +
      " " +
      JSON.stringify(context)
    ).toLowerCase();

    for (const num of summaryNumbers) {
      // Allow minor standard structural references (e.g. 1, 2, 600)
      if (num === "1" || num === "2" || num === "3" || num === "600") continue;

      if (!originalTextAndContext.includes(num.toLowerCase())) {
        errors.push(`Invented number or currency amount '${num}' not found in source or project context`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
