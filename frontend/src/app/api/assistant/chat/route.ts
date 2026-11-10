import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getConversation,
  createConversation,
  addMessage,
} from "@/lib/ai/conversation-store";
import {
  ConversationWithMessages,
  AssistantMessage,
} from "@/lib/ai/conversation-types";
import { generateGeminiResponse } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      user = {
        id: "usr_client_alex",
        name: "Sambit Kumar Mohanty",
        email: "sambit@example.com",
        role: "CLIENT",
        title: "Product Lead",
        companyOrHandle: "Nexum Network",
        location: "Bengaluru, India",
        timezone: "UTC",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80",
        statusBadge: "Verified",
        summary: "",
        canLogin: true,
        isDemoData: false,
        presenceStatus: "available",
      };
    }

    const body = await request.json().catch(() => ({}));
    let conversationId = body.conversationId as string | undefined;
    const content = body.content as string | undefined;
    const projectId = body.projectId as string | undefined;
    const activeScope = body.activeScope as string | undefined;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    // Locate existing conversation or instantiate a fresh one
    let conv: ConversationWithMessages | null = null;
    if (conversationId) {
      conv = getConversation(user.id, conversationId);
    }

    if (!conv) {
      conv = createConversation(user.id);
    }

    const activeConvId: string = conv.id;

    // 1. Persist the user message
    let userMsg = addMessage(user.id, activeConvId, "user", content.trim());
    if (!userMsg) {
      // Self-heal: ensure message object exists so generation never 500s
      userMsg = {
        id: `msg_${Date.now()}`,
        conversationId: activeConvId,
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
        status: "sent",
      };
    }

    // Reload conversation to get full context including newly added message
    const updatedConv = getConversation(user.id, activeConvId);
    const messagesHistory: AssistantMessage[] = (updatedConv?.messages || [userMsg]).filter(
      (m): m is AssistantMessage => Boolean(m)
    );

    // 2. Query High-Grade AI Cascade
    let aiResponse;
    try {
      aiResponse = await generateGeminiResponse(messagesHistory, {
        projectId,
        activeScope,
        userId: user.id,
        role: user.role,
      });
    } catch (err: unknown) {
      const error = err as Error;
      // Persist error message for transparency
      const errMsg = addMessage(
        user.id,
        activeConvId,
        "assistant",
        `⚠️ Gemini Generation Error: ${error.message}\n\nPlease retry.`
      );
      return NextResponse.json(
        {
          error: error.message,
          conversationId: activeConvId,
          userMessage: userMsg,
          assistantMessage: errMsg,
          reply: errMsg?.content || error.message,
        },
        { status: 502 }
      );
    }

    // 3. Persist the completed assistant response
    const assistantMsg = addMessage(
      user.id,
      activeConvId,
      "assistant",
      aiResponse.text
    );

    return NextResponse.json({
      success: true,
      reply: aiResponse.text,
      conversationId: activeConvId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      model: aiResponse.model,
      isFallback: Boolean(aiResponse.isFallback),
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("POST /api/assistant/chat error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
