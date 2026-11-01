import { MessageClass, ProposedAction } from "@prisma/client";

export interface ClassificationResult {
  classification: MessageClass;
  confidence: number;
  summaryForRecipient: string;
  proposedAction: ProposedAction;
  requiresSenderConfirmation: boolean;
  linkedMilestoneId?: string;
  linkedRequirementId?: string;
  cardType?: string;
  cardPayload?: Record<string, any>;
}

export interface ProjectContextSummary {
  projectId: string;
  hasActiveAgreement: boolean;
  activeAgreementVersion?: number;
  pendingVersionId?: string;
  pendingVersionNumber?: number;
  milestones: Array<{ id: string; title: string; sequence: number }>;
}

/**
 * Classifies a message from user and generates summary / actions.
 */
export function classifyMessage(
  text: string,
  senderRole: "CLIENT" | "FREELANCER",
  context: ProjectContextSummary
): ClassificationResult {
  const lower = text.toLowerCase();

  // 1. DISPUTE
  if (
    lower.includes("this work is wrong") ||
    lower.includes("not what i ordered") ||
    lower.includes("refuse to pay") ||
    lower.includes("open a dispute") ||
    lower.includes("raise a dispute") ||
    lower.includes("unacceptable work")
  ) {
    return {
      classification: MessageClass.DISPUTE,
      confidence: 0.95,
      summaryForRecipient:
        senderRole === "CLIENT"
          ? "Client has raised concerns regarding delivered work and noted potential dispute guidance."
          : "Freelancer expressed concerns regarding project execution.",
      proposedAction: ProposedAction.NONE,
      requiresSenderConfirmation: true,
      cardType: "DISPUTE_GUIDANCE",
      cardPayload: {
        note: "Nexum mediation guidelines recommend reviewing acceptance criteria before escalating.",
      },
    };
  }

  // 2. SCOPE_CHANGE
  if (
    lower.includes("also add") ||
    lower.includes("add a blog") ||
    lower.includes("new feature") ||
    lower.includes("extra scope") ||
    lower.includes("include another") ||
    lower.includes("scope change") ||
    lower.includes("can we also include")
  ) {
    return {
      classification: MessageClass.SCOPE_CHANGE,
      confidence: 0.92,
      summaryForRecipient:
        senderRole === "CLIENT"
          ? "Client requested an addition to scope. A change request proposal is recommended."
          : "Freelancer noted scope expansion.",
      proposedAction: ProposedAction.DRAFT_CHANGE_REQUEST,
      requiresSenderConfirmation: true,
      cardType: "SCOPE_CHANGE_CARD",
      cardPayload: {
        status: "NEEDS_QUOTE",
      },
    };
  }

  // 3. PRICE_OR_DEADLINE
  if (
    lower.includes("do it for less") ||
    lower.includes("can you do it for less") ||
    lower.includes("lower the price") ||
    lower.includes("extend deadline") ||
    lower.includes("discount") ||
    lower.includes("change the price") ||
    (lower.includes("deadline") && lower.includes("change"))
  ) {
    return {
      classification: MessageClass.PRICE_OR_DEADLINE,
      confidence: 0.9,
      summaryForRecipient:
        senderRole === "CLIENT"
          ? "Client proposed an adjustment to price or deadline terms."
          : "Freelancer proposed an adjustment to price or deadline terms.",
      proposedAction: context.hasActiveAgreement
        ? ProposedAction.DRAFT_CHANGE_REQUEST
        : ProposedAction.RELAY,
      requiresSenderConfirmation: true,
      cardType: "AMENDMENT_CARD",
      cardPayload: {
        status: "PROPOSED_AMENDMENT",
      },
    };
  }

  // 4. APPROVAL_LIKE
  if (
    lower.includes("looks good, proceed") ||
    lower.includes("looks good") ||
    lower.includes("proceed") ||
    lower.includes("approved") ||
    lower.includes("go ahead") ||
    lower.includes("i approve") ||
    lower.includes("you can start")
  ) {
    return {
      classification: MessageClass.APPROVAL_LIKE,
      confidence: 0.88,
      summaryForRecipient:
        senderRole === "CLIENT"
          ? "Client indicated satisfaction with the proposal or deliverable."
          : "Freelancer acknowledged approval indication.",
      proposedAction: context.pendingVersionId
        ? ProposedAction.LINK_PENDING_VERSION
        : ProposedAction.NONE,
      requiresSenderConfirmation: false,
      cardType: "PENDING_VERSION_LINK",
      cardPayload: {
        pendingVersionId: context.pendingVersionId,
        versionNumber: context.pendingVersionNumber,
        notice: "Informal message only; approval requires explicit cryptographic acceptance.",
      },
    };
  }

  // 5. PAYMENT_QUESTION
  if (
    lower.includes("has it been paid") ||
    lower.includes("when will i get paid") ||
    lower.includes("where is payment") ||
    lower.includes("payout status") ||
    lower.includes("escrow status") ||
    lower.includes("payment status")
  ) {
    return {
      classification: MessageClass.PAYMENT_QUESTION,
      confidence: 0.85,
      summaryForRecipient:
        senderRole === "CLIENT"
          ? "Client inquired regarding payment or escrow status."
          : "Freelancer inquired regarding milestone payment release.",
      proposedAction: ProposedAction.RELAY,
      requiresSenderConfirmation: false,
      cardType: "PAYMENT_STATUS_CARD",
      cardPayload: {
        verified: false,
        note: "Payment status verified via consensus ledger only.",
      },
    };
  }

  // 6. FEEDBACK
  if (
    lower.includes("feedback") ||
    lower.includes("review comment") ||
    lower.includes("needs adjustment") ||
    lower.includes("change the color") ||
    lower.includes("fix the font")
  ) {
    const linkedMilestone = context.milestones[0];
    return {
      classification: MessageClass.FEEDBACK,
      confidence: 0.85,
      summaryForRecipient:
        senderRole === "CLIENT"
          ? "Client provided feedback on project deliverables."
          : "Freelancer addressed feedback points.",
      proposedAction: ProposedAction.RELAY,
      requiresSenderConfirmation: false,
      linkedMilestoneId: linkedMilestone?.id,
      cardType: "FEEDBACK_CARD",
    };
  }

  // 7. QUESTION / CLARIFICATION
  if (
    text.includes("?") ||
    lower.includes("how does") ||
    lower.includes("what is") ||
    lower.includes("can you clarify") ||
    lower.includes("could you explain")
  ) {
    const linkedMilestone = context.milestones[0];
    return {
      classification: MessageClass.QUESTION,
      confidence: 0.85,
      summaryForRecipient:
        senderRole === "CLIENT"
          ? "Client requested clarification regarding project requirements."
          : "Freelancer asked a clarifying question regarding implementation.",
      proposedAction: ProposedAction.RELAY,
      requiresSenderConfirmation: false,
      linkedMilestoneId: linkedMilestone?.id,
      cardType: "QUESTION_CARD",
    };
  }

  // 8. GENERAL
  return {
    classification: MessageClass.GENERAL,
    confidence: 0.95,
    summaryForRecipient: text.length > 600 ? text.slice(0, 597) + "..." : text,
    proposedAction: ProposedAction.RELAY,
    requiresSenderConfirmation: false,
  };
}
