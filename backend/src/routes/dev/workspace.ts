import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { NotFoundError, ValidationError, ConflictError } from "../../lib/errors.js";
import { MessageDeliveryStatus, MediationState, MessageClass, Role, ChangeClassification } from "@prisma/client";
import { processMediationJob } from "../../jobs/mediationWorker.js";

const router = Router();

// Guard with ENABLE_DEV_TOOLS flag
router.use((_req: Request, _res: Response, next: NextFunction) => {
  if (process.env.ENABLE_DEV_TOOLS !== "true") {
    throw new NotFoundError("Dev endpoint not found");
  }
  next();
});

const clientMessageSchema = z.object({
  body: z.string().min(1).max(5000),
  clientMessageId: z.string().optional(),
  options: z
    .object({
      simulatedTimeout: z.boolean().optional(),
      simulatedFailure: z.boolean().optional(),
      forcedSummary: z.string().optional(),
    })
    .optional(),
});

/**
 * POST /api/dev/projects/:id/ensure-conversation
 * Ensures a conversation and participants exist for testing.
 */
router.post("/projects/:id/ensure-conversation", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!project) throw new NotFoundError("Project not found");

    const conv = await prisma.conversation.upsert({
      where: { projectId: id },
      create: { projectId: id },
      update: {},
    });

    // Ensure participants
    if (project.clientId) {
      await prisma.conversationParticipant.upsert({
        where: {
          conversationId_userId: {
            conversationId: conv.id,
            userId: project.clientId,
          },
        },
        create: {
          conversationId: conv.id,
          userId: project.clientId,
          role: "CLIENT",
        },
        update: {},
      });
    }

    const agreement = await prisma.agreement.findUnique({ where: { projectId: id } });
    const freelancerId = agreement?.freelancerId;
    if (freelancerId) {
      await prisma.conversationParticipant.upsert({
        where: {
          conversationId_userId: {
            conversationId: conv.id,
            userId: freelancerId,
          },
        },
        create: {
          conversationId: conv.id,
          userId: freelancerId,
          role: "FREELANCER",
        },
        update: {},
      });
    }

    res.status(200).json({ success: true, conversation: conv });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/dev/conversations/:id/client-message
 * Simulates a message sent by client.
 */
router.post("/conversations/:id/client-message", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = clientMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid dev message parameters", parsed.error.flatten().fieldErrors, 422);
    }

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!conv) throw new NotFoundError("Conversation not found");

    const clientId = conv.project.clientId;

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: clientId,
        senderKind: "USER",
        originalBody: parsed.data.body,
        clientMessageId: parsed.data.clientMessageId || null,
        status: MessageDeliveryStatus.PENDING_REVIEW,
        mediationState: MediationState.NOT_REVIEWED,
      },
    });

    // Execute mediation with options
    const mediationResult = await processMediationJob(message.id, prisma, parsed.data.options || {});

    const updatedMessage = await prisma.message.findUnique({
      where: { id: message.id },
      include: { mediationResult: true },
    });

    res.status(200).json({
      success: true,
      message: updatedMessage,
      mediationResult,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/dev/messages/:id/client-confirm
 * Simulates client confirming a message requiring confirmation.
 */
router.post("/messages/:id/client-confirm", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        conversation: { include: { project: true } },
        mediationResult: true,
      },
    });

    if (!message) throw new NotFoundError("Message not found");

    let changeRequestId: string | null = null;
    if (
      message.messageClass === MessageClass.SCOPE_CHANGE ||
      message.messageClass === MessageClass.PRICE_OR_DEADLINE
    ) {
      const activeAgreement = await prisma.agreement.findUnique({
        where: { projectId: message.conversation.projectId },
      });

      if (activeAgreement && activeAgreement.activeVersionId) {
        const cr = await prisma.changeRequest.create({
          data: {
            projectId: message.conversation.projectId,
            agreementId: activeAgreement.id,
            baseVersionId: activeAgreement.activeVersionId,
            raisedByRole: Role.CLIENT,
            raisedById: message.senderId || message.conversation.project.clientId,
            description: message.mediationResult?.summaryForRecipient || message.originalBody,
            classification:
              message.messageClass === MessageClass.SCOPE_CHANGE
                ? ChangeClassification.NEW_MILESTONE
                : ChangeClassification.AMENDMENT,
            status: "OPEN",
            sourceMessageId: message.id,
          },
        });
        changeRequestId = cr.id;
      }
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        status: MessageDeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
        cardPayload: changeRequestId
          ? { ...(message.cardPayload as any), changeRequestId }
          : (message.cardPayload as any),
      },
    });

    res.status(200).json({ success: true, message: updated, changeRequestId });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dev/conversations/:id/as-client
 * View conversation exactly as client would see it.
 */
router.get("/conversations/:id/as-client", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!conv) throw new NotFoundError("Conversation not found");

    const clientId = conv.project.clientId;

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        OR: [
          { status: MessageDeliveryStatus.DELIVERED },
          { senderId: clientId }, // Client sees own unconfirmed messages
        ],
        AND: [
          {
            OR: [{ visibleToUserId: null }, { visibleToUserId: clientId }],
          },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        attachments: { include: { file: true } },
        mediationResult: true,
      },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json({
      success: true,
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender?.name || (m.senderKind === "NEXUM" ? "Nexum AI" : "System"),
        originalBody: m.originalBody,
        summaryText: m.mediationResult?.summaryForRecipient || m.originalBody,
        status: m.status,
        cardType: m.cardType,
        cardPayload: m.cardPayload,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
