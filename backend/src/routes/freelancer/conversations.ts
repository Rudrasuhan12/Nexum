import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import { Role, MessageDeliveryStatus, MediationState, MessageClass, ChangeClassification } from "@prisma/client";
import { processMediationJob } from "../../jobs/mediationWorker.js";
import { verifyProjectAccess } from "../../domain/mediation/access.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

// In-memory sliding window rate limiter: max 20 msgs/min per user
const userMessageTimestamps = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const timestamps = (userMessageTimestamps.get(userId) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= 20) {
    return false;
  }
  timestamps.push(now);
  userMessageTimestamps.set(userId, timestamps);
  return true;
}

/**
 * GET /api/freelancer/conversations
 * List conversation threads with unread counts and previews.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const freelancerId = req.user!.id;
    const filter = (req.query.filter as string) || "all";
    const q = ((req.query.q as string) || "").trim().toLowerCase();

    // Find conversations where user is a participant OR owner of the project
    const conversations = await prisma.conversation.findMany({
      where: {
        project: {
          OR: [
            { agreement: { freelancerId } },
            { projectProposals: { some: { freelancerId, status: "ACCEPTED" } } },
            { invitations: { some: { freelancerId } } },
          ],
        },
      },
      include: {
        project: {
          include: {
            client: { select: { id: true, name: true } },
            agreement: true,
          },
        },
        participants: {
          where: { userId: freelancerId },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            mediationResult: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const items = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants[0];
        const lastMsg = conv.messages[0];

        // Unread count: messages created after lastReadAt or not equal to lastReadMessageId
        let unreadCount = 0;
        if (participant?.lastReadAt) {
          unreadCount = await prisma.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: freelancerId },
              createdAt: { gt: participant.lastReadAt },
              status: MessageDeliveryStatus.DELIVERED,
            },
          });
        } else {
          unreadCount = await prisma.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: freelancerId },
              status: MessageDeliveryStatus.DELIVERED,
            },
          });
        }

        let previewText = "No messages yet";
        if (lastMsg) {
          if (lastMsg.status === MessageDeliveryStatus.DELIVERED) {
            previewText = lastMsg.mediationResult?.summaryForRecipient || lastMsg.originalBody;
          } else if (lastMsg.senderId === freelancerId) {
            previewText = `You: ${lastMsg.originalBody.slice(0, 50)}...`;
          }
        }

        return {
          id: conv.id,
          type: "PROJECT",
          projectId: conv.projectId,
          title: conv.project.title,
          counterpartName: conv.project.client?.name || "Client",
          lastPreview: previewText,
          lastMessageAt: lastMsg ? lastMsg.createdAt.toISOString() : conv.createdAt.toISOString(),
          unreadCount,
          projectStatus: conv.project.state,
        };
      })
    );

    let filtered = items;
    if (filter === "unread") {
      filtered = filtered.filter((i) => i.unreadCount > 0);
    }
    if (q) {
      filtered = filtered.filter(
        (i) => i.title.toLowerCase().includes(q) || i.counterpartName.toLowerCase().includes(q)
      );
    }

    res.status(200).json({ success: true, conversations: filtered });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/conversations/:id/messages
 * Cursor-based message history.
 */
router.get("/:id/messages", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;
    const after = req.query.after as string | undefined;
    const before = req.query.before as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 100);

    // Verify participant
    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!conv || !conv.projectId) {
      throw new NotFoundError("Conversation not found");
    }

    const access = await verifyProjectAccess(conv.projectId, freelancerId, prisma);
    if (!access.allowed) {
      throw new NotFoundError("Conversation not found");
    }

    const whereClause: any = {
      conversationId: id,
      OR: [
        { status: MessageDeliveryStatus.DELIVERED },
        { senderId: freelancerId }, // sender can see their pending messages
      ],
      AND: [
        {
          OR: [{ visibleToUserId: null }, { visibleToUserId: freelancerId }],
        },
      ],
    };

    if (after) {
      whereClause.createdAt = { gt: new Date(after) };
    } else if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: { select: { id: true, name: true, role: true } },
        attachments: { include: { file: true } },
        mediationResult: true,
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    res.status(200).json({
      success: true,
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: m.sender?.name || (m.senderKind === "NEXUM" ? "Nexum AI" : "System"),
        senderKind: m.senderKind,
        originalBody: m.originalBody,
        messageClass: m.messageClass,
        status: m.status,
        mediationState: m.mediationState,
        summaryText: m.mediationResult?.summaryForRecipient || m.originalBody,
        cardType: m.cardType,
        cardPayload: m.cardPayload,
        requiresConfirmation: m.status === MessageDeliveryStatus.AWAITING_SENDER_CONFIRMATION,
        attachments: m.attachments.map((a) => ({
          id: a.file.id,
          name: a.file.originalName,
          sizeBytes: a.file.sizeBytes,
          mime: a.file.mime,
        })),
        createdAt: m.createdAt.toISOString(),
        deliveredAt: m.deliveredAt ? m.deliveredAt.toISOString() : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const postMessageSchema = z.object({
  body: z.string().min(1, "Message body cannot be empty").max(5000, "Message body exceeds 5000 chars"),
  attachmentFileIds: z.array(z.string()).max(5, "Maximum 5 attachments allowed").default([]),
  clientMessageId: z.string().optional(),
});

/**
 * POST /api/freelancer/conversations/:id/messages
 * Submits message -> Enqueues mediation -> returns 202 immediately.
 */
router.post("/:id/messages", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    if (!checkRateLimit(freelancerId)) {
      res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many messages sent. Please wait before sending again.",
          details: { limitPerMinute: 20 },
        },
      });
      return;
    }

    const parsed = postMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid message parameters", parsed.error.flatten().fieldErrors, 422);
    }

    const { body, attachmentFileIds, clientMessageId } = parsed.data;

    // Verify conversation access
    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!conv || !conv.projectId) {
      throw new NotFoundError("Conversation not found");
    }

    const access = await verifyProjectAccess(conv.projectId, freelancerId, prisma);
    if (!access.allowed) {
      throw new NotFoundError("Conversation not found");
    }

    // Idempotency check: if clientMessageId already exists in this conversation, return existing message
    if (clientMessageId) {
      const existing = await prisma.message.findUnique({
        where: {
          conversationId_clientMessageId: {
            conversationId: id,
            clientMessageId,
          },
        },
      });
      if (existing) {
        res.status(200).json({
          success: true,
          message: existing,
          status: existing.status,
          idempotent: true,
        });
        return;
      }
    }

    // Create message in PENDING_REVIEW
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: id,
          senderId: freelancerId,
          senderKind: "USER",
          originalBody: body,
          clientMessageId: clientMessageId || null,
          status: MessageDeliveryStatus.PENDING_REVIEW,
          mediationState: MediationState.NOT_REVIEWED,
          attachments: {
            create: attachmentFileIds.map((fId) => ({ fileId: fId })),
          },
        },
      });

      // Update conversation updatedAt
      await tx.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "MESSAGE_CREATED",
      objectType: "MESSAGE",
      objectId: message.id,
      newStatus: "PENDING_REVIEW",
      metadata: { conversationId: id, attachmentCount: attachmentFileIds.length },
    });

    // Enqueue mediation job asynchronously
    setImmediate(() => {
      processMediationJob(message.id, prisma).catch((err) => {
        console.error("Mediation job failed for message", message.id, err);
      });
    });

    res.status(202).json({
      success: true,
      messageId: message.id,
      status: MessageDeliveryStatus.PENDING_REVIEW,
    });
  } catch (err) {
    next(err);
  }
});

const confirmMessageSchema = z.object({
  editedSummary: z.string().optional(),
});

/**
 * POST /api/freelancer/messages/:id/confirm
 * Sender confirms a mediated message awaiting confirmation.
 */
router.post("/messages/:id/confirm", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;
    const parsed = confirmMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid confirm parameters", parsed.error.flatten().fieldErrors, 422);
    }

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        conversation: { include: { project: true } },
        mediationResult: true,
      },
    });

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    if (message.senderId !== freelancerId) {
      throw new ForbiddenError("Only the sender can confirm this message");
    }

    if (message.status !== MessageDeliveryStatus.AWAITING_SENDER_CONFIRMATION) {
      throw new ConflictError(
        `Message is in status ${message.status}, expected AWAITING_SENDER_CONFIRMATION`,
        "INVALID_STATE"
      );
    }

    // Transactional, idempotent confirmation
    const { updatedMessage, createdChangeRequestId } = await prisma.$transaction(async (tx) => {
      // 1. Atomically check and transition message status
      const updatedCount = await tx.message.updateMany({
        where: {
          id,
          status: MessageDeliveryStatus.AWAITING_SENDER_CONFIRMATION,
        },
        data: {
          status: MessageDeliveryStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });

      if (updatedCount.count === 0) {
        throw new ConflictError(
          "Message is not in AWAITING_SENDER_CONFIRMATION status or has already been decided",
          "ALREADY_DECIDED"
        );
      }

      let changeRequestId: string | null = null;
      if (
        message.messageClass === MessageClass.SCOPE_CHANGE ||
        message.messageClass === MessageClass.PRICE_OR_DEADLINE
      ) {
        const activeAgreement = await tx.agreement.findUnique({
          where: { projectId: message.conversation.projectId },
        });

        if (activeAgreement && activeAgreement.activeVersionId) {
          const cr = await tx.changeRequest.create({
            data: {
              projectId: message.conversation.projectId,
              agreementId: activeAgreement.id,
              baseVersionId: activeAgreement.activeVersionId,
              raisedByRole: Role.FREELANCER,
              raisedById: freelancerId,
              description:
                parsed.data?.editedSummary ||
                message.mediationResult?.summaryForRecipient ||
                message.originalBody,
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

      if (parsed.data?.editedSummary && message.mediationResult) {
        await tx.mediationResult.update({
          where: { messageId: id },
          data: {
            summaryForRecipient: parsed.data.editedSummary,
            status: "CONFIRMED",
          },
        });
      }

      const finalMsg = await tx.message.update({
        where: { id },
        data: {
          cardPayload: changeRequestId
            ? { ...(message.cardPayload as any), changeRequestId }
            : (message.cardPayload as any),
        },
      });

      return { updatedMessage: finalMsg, createdChangeRequestId: changeRequestId };
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "MESSAGE_CONFIRMED",
      objectType: "MESSAGE",
      objectId: id,
      newStatus: "DELIVERED",
      metadata: { changeRequestId: createdChangeRequestId },
    });

    res.status(200).json({
      success: true,
      message: updatedMessage,
      changeRequestId: createdChangeRequestId,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelancer/messages/:id/discard
 * Sender discards message from AWAITING_SENDER_CONFIRMATION.
 */
router.post("/messages/:id/discard", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) throw new NotFoundError("Message not found");
    if (message.senderId !== freelancerId) {
      throw new ForbiddenError("Only the sender can discard this message");
    }

    if (message.status !== MessageDeliveryStatus.AWAITING_SENDER_CONFIRMATION) {
      throw new ConflictError("Can only discard messages awaiting confirmation", "INVALID_STATE");
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { status: MessageDeliveryStatus.DISCARDED },
    });

    await appendAuditEvent({
      actorId: freelancerId,
      action: "MESSAGE_DISCARDED",
      objectType: "MESSAGE",
      objectId: id,
      newStatus: "DISCARDED",
    });

    res.status(200).json({ success: true, message: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/messages/:id/original
 * View unredacted original message body and attachments.
 */
router.get("/messages/:id/original", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        conversation: { include: { project: true } },
        attachments: { include: { file: true } },
      },
    });

    if (!message) throw new NotFoundError("Message not found");

    const access = await verifyProjectAccess(message.conversation.projectId, freelancerId, prisma);
    if (!access.allowed && message.senderId !== freelancerId) {
      throw new ForbiddenError("You do not have permission to view this message original");
    }

    res.status(200).json({
      success: true,
      originalBody: message.originalBody,
      senderKind: message.senderKind,
      createdAt: message.createdAt.toISOString(),
      attachments: message.attachments.map((a) => ({
        id: a.file.id,
        name: a.file.originalName,
        sizeBytes: a.file.sizeBytes,
        mime: a.file.mime,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelancer/conversations/:id/read
 * Mark messages up to messageId as read.
 */
router.post("/:id/read", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;
    const upToMessageId = req.body?.upToMessageId as string | undefined;

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!conv || !conv.projectId) {
      throw new NotFoundError("Conversation not found");
    }

    const access = await verifyProjectAccess(conv.projectId, freelancerId, prisma);
    if (!access.allowed) {
      throw new NotFoundError("Conversation not found");
    }

    await prisma.conversationParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: freelancerId,
        },
      },
      create: {
        conversationId: id,
        userId: freelancerId,
        role: Role.FREELANCER as any,
        lastReadMessageId: upToMessageId || null,
        lastReadAt: new Date(),
      },
      update: {
        lastReadMessageId: upToMessageId || undefined,
        lastReadAt: new Date(),
      },
    });

    res.status(200).json({ success: true, readAt: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/conversations/:id/context
 * Right panel context: project overview, milestones, files, tasks, meetings, AI actions.
 */
router.get("/:id/context", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const freelancerId = req.user!.id;

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: { select: { id: true, name: true } },
            agreement: {
              include: {
                versions: { where: { status: "ACTIVE" }, take: 1 },
              },
            },
            projectMilestones: { where: { removedAt: null }, orderBy: { sequence: "asc" } },
            projectFiles: { orderBy: { createdAt: "desc" }, take: 5, include: { file: true } },
            workspaceTasks: {
              where: {
                OR: [{ visibility: "SHARED" }, { createdBy: freelancerId }],
              },
              orderBy: { createdAt: "desc" },
            },
            meetings: {
              where: { startsAt: { gte: new Date() } },
              orderBy: { startsAt: "asc" },
              take: 3,
            },
            projectDecisions: { orderBy: { createdAt: "desc" }, take: 5 },
          },
        },
      },
    });

    if (!conv || !conv.projectId) {
      throw new NotFoundError("Conversation context not found");
    }

    const access = await verifyProjectAccess(conv.projectId, freelancerId, prisma);
    if (!access.allowed) {
      throw new NotFoundError("Conversation context not found");
    }

    const p = conv.project;
    const activeVersion = p.agreement?.versions[0];
    const terms = (activeVersion?.terms as any) || {};

    res.status(200).json({
      success: true,
      context: {
        project: {
          id: p.id,
          title: p.title,
          state: p.state,
          client: p.client,
          totalBudgetMinor: terms.totalAmountMinor || p.budgetMaxCents || 0,
          currency: terms.currency || "USD",
          activeAgreementVersion: activeVersion?.versionNumber || 1,
        },
        milestones: p.projectMilestones.map((m) => ({
          id: m.id,
          number: m.sequence,
          title: m.title,
          amountMinor: m.amountMinor,
          workStatus: m.workStatus,
          dueDate: m.dueDate ? m.dueDate.toISOString() : null,
        })),
        recentFiles: p.projectFiles.map((pf) => ({
          id: pf.id,
          name: pf.name,
          category: pf.category,
          sizeBytes: pf.file.sizeBytes,
          createdAt: pf.createdAt.toISOString(),
        })),
        tasks: p.workspaceTasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          visibility: t.visibility,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        })),
        upcomingMeetings: p.meetings.map((m) => ({
          id: m.id,
          title: m.title,
          startsAt: m.startsAt.toISOString(),
          endsAt: m.endsAt.toISOString(),
          joinUrl: m.joinUrl,
          status: m.status,
        })),
        decisions: p.projectDecisions.map((d) => ({
          id: d.id,
          title: d.title,
          kind: d.kind,
          binding: d.binding,
          createdAt: d.createdAt.toISOString(),
        })),
        quickAiActions: [
          { action: "SUMMARIZE_CONVERSATION", label: "Summarize recent conversation" },
          { action: "DRAFT_REPLY", label: "Draft response to client" },
          { action: "NEXT_STEPS", label: "Analyze next milestone steps" },
        ],
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
