import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getConversation,
  createConversation,
  addMessage,
} from "@/lib/ai/conversation-store";
import { generateGeminiResponse } from "@/lib/ai/gemini";

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

    // If no conversationId provided or conversation doesn't exist, create one
    if (!conversationId) {
      const newConv = createConversation(user.id);
      conversationId = newConv.id;
    }

    let conv = getConversation(user.id, conversationId);
    if (!conv) {
      const newConv = createConversation(user.id);
      conversationId = newConv.id;
      conv = getConversation(user.id, conversationId);
    }

    if (!conv) {
      return NextResponse.json(
        { error: "Could not create or find conversation" },
        { status: 500 }
      );
    }

    // 1. Persist the user message
    const userMsg = addMessage(user.id, conversationId, "user", content.trim());
    if (!userMsg) {
      return NextResponse.json(
        { error: "Failed to persist user message" },
        { status: 500 }
      );
    }

    // Reload conversation to get full context including newly added message
    const updatedConv = getConversation(user.id, conversationId);
    const messagesHistory = updatedConv?.messages || [userMsg];

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
        conversationId,
        "assistant",
        `⚠️ Gemini Generation Error: ${error.message}\n\nPlease retry.`
      );
      return NextResponse.json(
        {
          error: error.message,
          conversationId,
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
      conversationId,
      "assistant",
      aiResponse.text
    );

    return NextResponse.json({
      success: true,
      conversationId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      reply: aiResponse.text,
      model: aiResponse.model,
      isFallback: aiResponse.isFallback,
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
