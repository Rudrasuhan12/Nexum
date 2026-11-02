import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { prisma } from "../../prisma.js";
import { processAssistantMessage } from "../../domain/assistant/agent.js";
import { ValidationError } from "../../lib/errors.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

const chatMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(5000),
  chatId: z.string().optional(),
});

/**
 * POST /api/freelancer/assistant/chat
 * Reads data using scoped read-only tools and returns factual answers.
 * Strictly declines state-modifying requests.
 */
router.post("/chat", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = chatMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid chat request", parsed.error.flatten().fieldErrors, 422);
    }

    const userId = req.user!.id;
    const { content, chatId } = parsed.data;

    let targetChatId = chatId;
    if (!targetChatId) {
      const chat = await prisma.aIChat.create({
        data: {
          ownerId: userId,
          title: content.slice(0, 40),
        },
      });
      targetChatId = chat.id;
    }

    // Persist user message
    await prisma.aIChatMessage.create({
      data: {
        chatId: targetChatId,
        role: "USER",
        content,
      },
    });

    // Execute scoped read-only assistant logic
    const assistantResult = await processAssistantMessage(userId, content);

    // Persist assistant reply
    await prisma.aIChatMessage.create({
      data: {
        chatId: targetChatId,
        role: "ASSISTANT",
        content: assistantResult.reply,
      },
    });

    res.status(200).json({
      success: true,
      chatId: targetChatId,
      message: assistantResult.reply,
      refusal: assistantResult.refusal || false,
      toolCalled: assistantResult.toolCalled,
      data: assistantResult.data,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
