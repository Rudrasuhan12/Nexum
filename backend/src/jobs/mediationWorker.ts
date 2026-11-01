import { PrismaClient, MessageDeliveryStatus, MediationState, ProposedAction } from "@prisma/client";
import { classifyMessage } from "../domain/mediation/classify.js";
import { validateMediationOutput } from "../domain/mediation/validate.js";
import { buildSafeProjectContext } from "../domain/mediation/context.js";
import { appendAuditEvent } from "../lib/audit.js";

export async function processMediationJob(
  messageId: string,
  prisma: PrismaClient,
  options: { simulatedFailure?: boolean; simulatedTimeout?: boolean; forcedSummary?: string } = {}
): Promise<{ status: string; mediationState: string }> {
  const startTime = Date.now();

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: true,
      sender: true,
    },
  });

  if (!message) {
    return { status: "NOT_FOUND", mediationState: "NONE" };
  }

  if (message.status === MessageDeliveryStatus.DELIVERED || message.status === MessageDeliveryStatus.DISCARDED) {
    return { status: message.status, mediationState: message.mediationState };
  }

  // 1. Check for timeout or simulated failure
  if (options.simulatedTimeout) {
    // Deliver as NOT_REVIEWED with original text
    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: MessageDeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
        mediationState: MediationState.NOT_REVIEWED,
      },
    });

    await appendAuditEvent({
      actorId: message.senderId,
      action: "MESSAGE_MEDIATION_TIMEOUT_FALLBACK",
      objectType: "MESSAGE",
      objectId: messageId,
      metadata: { reason: "TIMED_OUT_20S_FALLBACK" },
    });

    return { status: "DELIVERED", mediationState: "NOT_REVIEWED" };
  }

  // 2. Build context
  const context = await buildSafeProjectContext(message.conversation.projectId, prisma);
  const senderRole = message.sender?.role === "CLIENT" ? "CLIENT" : "FREELANCER";

  // 3. Classify
  const classification = classifyMessage(message.originalBody, senderRole, context);

  // If forced summary (e.g. testing validators)
  if (options.forcedSummary) {
    classification.summaryForRecipient = options.forcedSummary;
  }

  // 4. Validate
  const validation = validateMediationOutput(classification, message.originalBody, context);

  if (!validation.valid || options.simulatedFailure) {
    // Log AI call rejection
    if (message.senderId) {
      await prisma.aICall.create({
        data: {
          userId: message.senderId,
          purpose: "MEDIATE_MESSAGE",
          model: "gemini-2.5-flash",
          promptVersion: "v1.0",
          inputRecordRefs: [messageId],
          status: "REJECTED",
          latencyMs: Date.now() - startTime,
        },
      });
    }

    // Fallback: Deliver original as NOT_REVIEWED
    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: MessageDeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
        mediationState: MediationState.NOT_REVIEWED,
      },
    });

    await appendAuditEvent({
      actorId: message.senderId,
      action: "MESSAGE_MEDIATION_REJECTED_FALLBACK",
      objectType: "MESSAGE",
      objectId: messageId,
      metadata: { errors: validation.errors },
    });

    return { status: "DELIVERED", mediationState: "NOT_REVIEWED" };
  }

  // 5. Validation passed: record mediation result
  await prisma.mediationResult.upsert({
    where: { messageId },
    create: {
      messageId,
      classification: classification.classification,
      confidence: classification.confidence,
      summaryForRecipient: classification.summaryForRecipient,
      structuredPayload: classification.cardPayload || {},
      proposedAction: classification.proposedAction,
      requiresSenderConfirmation: classification.requiresSenderConfirmation,
      status: classification.requiresSenderConfirmation ? "DRAFT" : "DELIVERED",
      model: "gemini-2.5-flash",
      promptVersion: "v1.0",
      validatorResults: { valid: true },
    },
    update: {
      classification: classification.classification,
      confidence: classification.confidence,
      summaryForRecipient: classification.summaryForRecipient,
      structuredPayload: classification.cardPayload || {},
      proposedAction: classification.proposedAction,
      requiresSenderConfirmation: classification.requiresSenderConfirmation,
      status: classification.requiresSenderConfirmation ? "DRAFT" : "DELIVERED",
    },
  });

  // Record AI Call success
  if (message.senderId) {
    await prisma.aICall.create({
      data: {
        userId: message.senderId,
        purpose: "MEDIATE_MESSAGE",
        model: "gemini-2.5-flash",
        promptVersion: "v1.0",
        inputRecordRefs: [messageId],
        status: "SUCCESS",
        latencyMs: Date.now() - startTime,
      },
    });
  }

  // 6. Transition message
  const nextStatus = classification.requiresSenderConfirmation
    ? MessageDeliveryStatus.AWAITING_SENDER_CONFIRMATION
    : MessageDeliveryStatus.DELIVERED;

  await prisma.message.update({
    where: { id: messageId },
    data: {
      messageClass: classification.classification,
      status: nextStatus,
      mediationState: MediationState.REVIEWED,
      deliveredAt: nextStatus === MessageDeliveryStatus.DELIVERED ? new Date() : null,
      cardType: classification.cardType || null,
      cardPayload: classification.cardPayload ? classification.cardPayload : undefined,
      relatedId: classification.linkedMilestoneId || null,
      relatedType: classification.linkedMilestoneId ? "MILESTONE" : null,
    },
  });

  await appendAuditEvent({
    actorId: message.senderId,
    action: "MESSAGE_MEDIATED",
    objectType: "MESSAGE",
    objectId: messageId,
    newStatus: nextStatus,
    metadata: {
      classification: classification.classification,
      requiresSenderConfirmation: classification.requiresSenderConfirmation,
    },
  });

  return { status: nextStatus, mediationState: "REVIEWED" };
}
