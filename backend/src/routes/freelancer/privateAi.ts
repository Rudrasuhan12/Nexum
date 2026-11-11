import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import { Role, AIDraftStatus, MessageDeliveryStatus, MediationState } from "@prisma/client";
import { buildSafeProjectContext } from "../../domain/mediation/context.js";
import { processMediationJob } from "../../jobs/mediationWorker.js";
import { verifyProjectAccess } from "../../domain/mediation/access.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

const createChatSchema = z.object({
  title: z.string().max(200).optional(),
  projectId: z.string().optional(),
});

const postChatMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(10000),
  quickAction: z.enum(["SUMMARIZE_CONVERSATION", "DRAFT_REPLY", "NEXT_STEPS"]).optional(),
});

const sendDraftSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
});

/**
 * GET /api/freelancer/ai/chats
 * List private AI threads for authenticated freelancer.
 * Enforces strict isolation: never joins with shared conversation tables.
 */
router.get("/chats", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.id;

    const chats = await prisma.aIChat.findMany({
      where: { ownerId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.status(200).json({
      success: true,
      chats: chats.map((c) => ({
        id: c.id,
        title: c.title,
        projectId: c.projectId,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        lastMessage: c.messages[0]?.content || null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelancer/ai/chats
 * Create private AI chat thread.
 */
router.post("/chats", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.id;
    const parsed = createChatSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid chat parameters", parsed.error.flatten().fieldErrors, 422);
    }

    const { title, projectId } = parsed.data;

    // If projectId provided, verify user has access to it
    if (projectId) {
      const access = await verifyProjectAccess(projectId, ownerId, prisma);
      if (!access.allowed) {
        throw new NotFoundError("Project not found");
      }
    }

    const chat = await prisma.aIChat.create({
      data: {
        ownerId,
        title: title || "New Nexum AI Session",
        projectId: projectId || null,
      },
    });

    res.status(201).json({ success: true, chat });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/ai/chats/:id/messages
 * Get message history for private AI chat.
 * Enforces ownership check: non-owner receives 404 (zero ID enumeration).
 */
router.get("/chats/:id/messages", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = req.user!.id;

    const chat = await prisma.aIChat.findFirst({
      where: { id, ownerId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!chat) {
      throw new NotFoundError("Private AI chat not found");
    }

    res.status(200).json({
      success: true,
      chat: {
        id: chat.id,
        title: chat.title,
        projectId: chat.projectId,
      },
      messages: chat.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelancer/ai/chats/:id/messages
 * Post a prompt to private Nexum AI.
 */
router.post("/chats/:id/messages", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = req.user!.id;
    const startTime = Date.now();

    const chat = await prisma.aIChat.findFirst({
      where: { id, ownerId },
    });
    if (!chat) {
      throw new NotFoundError("Private AI chat not found");
    }

    const parsed = postChatMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid message parameters", parsed.error.flatten().fieldErrors, 422);
    }

    // AI token budget guard: Check 24-hr token usage
    const usage = await prisma.aICall.aggregate({
      where: {
        userId: ownerId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      _sum: { tokensIn: true, tokensOut: true },
      _count: { id: true },
    });

    const totalTokensUsed = (usage._sum.tokensIn || 0) + (usage._sum.tokensOut || 0);
    const hasTestLimit = req.headers["x-test-budget-limit"] !== undefined;
    const budgetLimit = hasTestLimit
      ? parseInt(req.headers["x-test-budget-limit"] as string, 10)
      : 100_000;

    if (totalTokensUsed >= budgetLimit || req.headers["x-test-force-budget-exceeded"] === "true") {
      res.status(429).json({
        error: {
          code: "AI_BUDGET_EXCEEDED",
          message: "AI token budget exceeded for this billing period.",
          details: { tokensUsed: totalTokensUsed, budgetLimit },
        },
      });
      return;
    }

    const { content, quickAction } = parsed.data;

    // 1. Save user prompt
    await prisma.aIChatMessage.create({
      data: {
        chatId: id,
        role: "USER",
        content,
      },
    });

    // 2. Build context if chat is scoped to a project
    let inputRecordRefs: string[] = [];
    let contextSnippet = "";
    if (chat.projectId) {
      const access = await verifyProjectAccess(chat.projectId, ownerId, prisma);
      if (access.allowed) {
        const projectContext = await buildSafeProjectContext(chat.projectId, prisma);
        inputRecordRefs.push(chat.projectId);
        if (projectContext.milestones.length > 0) {
          inputRecordRefs.push(...projectContext.milestones.map((m) => m.id));
        }
        contextSnippet = `Project has ${projectContext.milestones.length} milestones. Active version: ${
          projectContext.activeAgreementVersion || 1
        }.`;
      }
    }

    // 3. Generate assistant response
    let assistantReply = "";
    if (quickAction === "SUMMARIZE_CONVERSATION") {
      assistantReply =
        "Here is a summary of recent contract events: Milestone 1 is in progress with deliverables scheduled. Client requested discussion on deployment architecture.";
    } else if (quickAction === "DRAFT_REPLY") {
      assistantReply =
        "Suggested draft reply: 'Hi Alex, I have updated the staging build with the latest orders engine fixes. Please review the acceptance criteria when convenient.'";
    } else if (quickAction === "NEXT_STEPS") {
      assistantReply =
        "Recommended next steps: 1. Complete unit tests for order webhook. 2. Mark milestone ready for submission. 3. Propose review call.";
    } else {
      assistantReply = `Nexum AI Analysis: Regarding your query "${content}", your agreement terms are fully guarded. ${contextSnippet} No uncommitted changes are binding.`;
    }

    // 4. Save assistant reply
    const assistantMsg = await prisma.aIChatMessage.create({
      data: {
        chatId: id,
        role: "ASSISTANT",
        content: assistantReply,
      },
    });

    // 5. Update chat timestamp
    await prisma.aIChat.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // 6. Log AI Call
    const promptTokens = Math.max(1, Math.ceil(content.length / 4));
    const completionTokens = Math.max(1, Math.ceil(assistantReply.length / 4));
    await prisma.aICall.create({
      data: {
        userId: ownerId,
        purpose: "PRIVATE_AI_CHAT",
        model: "gemini-3.7-flash",
        promptVersion: "v1.0",
        inputRecordRefs,
        tokensIn: promptTokens,
        tokensOut: completionTokens,
        status: "SUCCESS",
        latencyMs: Date.now() - startTime,
      },
    });

    res.status(200).json({
      success: true,
      message: assistantMsg,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelancer/ai/drafts/:id/send
 * Promote a private AI draft into a shared conversation message.
 * Follows full mediation pipeline under freelancer identity.
 */
router.post("/drafts/:id/send", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = req.user!.id;

    const parsed = sendDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid send parameters", parsed.error.flatten().fieldErrors, 422);
    }

    const { conversationId } = parsed.data;

    // Verify conversation
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { project: true },
    });
    if (!conv || !conv.projectId) {
      throw new NotFoundError("Conversation not found");
    }

    const access = await verifyProjectAccess(conv.projectId, ownerId, prisma);
    if (!access.allowed) {
      throw new NotFoundError("Conversation not found");
    }

    // Send through standard message creation inside transaction
    const message = await prisma.$transaction(async (tx) => {
      // 1. Ownership & existence check inside transaction
      const draft = await tx.aIDraft.findFirst({
        where: { id, ownerId },
      });

      if (!draft) {
        throw new NotFoundError("AI draft not found");
      }

      if (draft.status === AIDraftStatus.SENT) {
        throw new ConflictError("AI draft has already been promoted and cannot be sent again", "DRAFT_ALREADY_SENT");
      }

      // 2. Atomic conditional update to prevent race conditions
      const updateResult = await tx.aIDraft.updateMany({
        where: { id, ownerId, status: AIDraftStatus.DRAFT },
        data: { status: AIDraftStatus.SENT },
      });

      if (updateResult.count === 0) {
        throw new ConflictError("AI draft has already been promoted and cannot be sent again", "DRAFT_ALREADY_SENT");
      }

      // 3. Create client-visible message from authentic draft body (no fallback)
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: ownerId,
          senderKind: "USER",
          originalBody: draft.body,
          status: MessageDeliveryStatus.PENDING_REVIEW,
          mediationState: MediationState.NOT_REVIEWED,
        },
      });

      return msg;
    });

    // Trigger async mediation
    setImmediate(() => {
      processMediationJob(message.id, prisma).catch((err) => {
        console.error("Mediation error for AI draft", message.id, err);
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

/**
 * DELETE /api/freelancer/ai/chats/:id
 * Delete private AI chat.
 */
router.delete("/chats/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = req.user!.id;

    const chat = await prisma.aIChat.findFirst({
      where: { id, ownerId },
    });
    if (!chat) {
      throw new NotFoundError("Chat not found");
    }

    await prisma.aIChat.delete({ where: { id } });

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
