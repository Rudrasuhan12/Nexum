import fs from "fs";
import path from "path";
import os from "os";
import {
  AssistantConversation,
  AssistantMessage,
  ConversationWithMessages,
  MessageRole,
} from "./conversation-types";

interface StorageSchema {
  conversations: Record<string, AssistantConversation>;
  messages: Record<string, AssistantMessage[]>; // Keyed by conversationId
}

// In-memory persistent cache across serverless warm requests and runtime environments
declare global {
  // eslint-disable-next-line no-var
  var __nexum_ai_memory_store: StorageSchema | undefined;
}

if (!globalThis.__nexum_ai_memory_store) {
  globalThis.__nexum_ai_memory_store = {
    conversations: {},
    messages: {},
  };
}

const memoryStore: StorageSchema = globalThis.__nexum_ai_memory_store;

function getStoragePaths(): { dir: string; file: string } {
  // In serverless (e.g. Vercel, AWS Lambda), the root filesystem is read-only.
  // os.tmpdir() (/tmp) is the only writable storage.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDir = path.join(os.tmpdir(), "nexum_ai_data");
    return {
      dir: tmpDir,
      file: path.join(tmpDir, "conversations.json"),
    };
  }

  // Standard development environment: prefer local .data, fall back to os.tmpdir()
  try {
    const localDir = path.join(process.cwd(), ".data");
    return {
      dir: localDir,
      file: path.join(localDir, "conversations.json"),
    };
  } catch {
    const tmpDir = path.join(os.tmpdir(), "nexum_ai_data");
    return {
      dir: tmpDir,
      file: path.join(tmpDir, "conversations.json"),
    };
  }
}

function ensureStorage(): StorageSchema {
  const { dir, file } = getStoragePaths();

  try {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (mkdirErr) {
        // If mkdir fails (e.g. read-only filesystem), continue in-memory
        console.warn("[ConversationStore] Directory creation fallback to memory:", mkdirErr);
        return memoryStore;
      }
    }

    if (!fs.existsSync(file)) {
      try {
        fs.writeFileSync(file, JSON.stringify(memoryStore, null, 2), "utf-8");
      } catch (writeErr) {
        console.warn("[ConversationStore] Initial file write fallback to memory:", writeErr);
      }
      return memoryStore;
    }

    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw) as StorageSchema;

    // Merge file data into memory store so both stay synchronized
    if (parsed.conversations) {
      Object.assign(memoryStore.conversations, parsed.conversations);
    }
    if (parsed.messages) {
      Object.assign(memoryStore.messages, parsed.messages);
    }

    return memoryStore;
  } catch (err) {
    console.warn("[ConversationStore] Reading storage fallback to memory:", err);
    return memoryStore;
  }
}

function saveStorage(data: StorageSchema): void {
  // Always update memory store first
  Object.assign(memoryStore.conversations, data.conversations);
  Object.assign(memoryStore.messages, data.messages);

  const { dir, file } = getStoragePaths();

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = `${file}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, file);
  } catch (err) {
    // If disk write fails in read-only serverless, memory store remains intact!
    console.warn("[ConversationStore] Disk save skipped, memory store preserved:", err);
  }
}

export function listConversations(userId: string): AssistantConversation[] {
  const data = ensureStorage();
  const list = Object.values(data.conversations).filter((c) => c.userId === userId);
  return list.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getConversation(
  userId: string,
  conversationId: string
): ConversationWithMessages | null {
  const data = ensureStorage();
  const conv = data.conversations[conversationId];
  if (!conv || conv.userId !== userId) {
    return null;
  }
  const messages = data.messages[conversationId] || [];
  return {
    ...conv,
    messages: [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
  };
}

export function createConversation(
  userId: string,
  initialTitle = "New Conversation"
): ConversationWithMessages {
  const data = ensureStorage();
  const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const conv: AssistantConversation = {
    id,
    userId,
    title: initialTitle,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
  };

  data.conversations[id] = conv;
  data.messages[id] = [];
  saveStorage(data);

  return { ...conv, messages: [] };
}

export function renameConversation(
  userId: string,
  conversationId: string,
  title: string
): AssistantConversation | null {
  const data = ensureStorage();
  const conv = data.conversations[conversationId];
  if (!conv || conv.userId !== userId) {
    return null;
  }

  conv.title = title.trim() || "Untitled Conversation";
  conv.updatedAt = new Date().toISOString();
  saveStorage(data);
  return conv;
}

export function deleteConversation(userId: string, conversationId: string): boolean {
  const data = ensureStorage();
  const conv = data.conversations[conversationId];
  if (!conv || conv.userId !== userId) {
    return false;
  }

  delete data.conversations[conversationId];
  delete data.messages[conversationId];
  saveStorage(data);
  return true;
}

export function addMessage(
  userId: string,
  conversationId: string,
  role: MessageRole,
  content: string
): AssistantMessage | null {
  const data = ensureStorage();
  let conv = data.conversations[conversationId];

  // Self-heal: If conversation missing in current store, automatically reconstitute it
  if (!conv) {
    const now = new Date().toISOString();
    conv = {
      id: conversationId,
      userId,
      title: "New Conversation",
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };
    data.conversations[conversationId] = conv;
  }

  if (conv.userId !== userId) {
    return null;
  }

  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const msg: AssistantMessage = {
    id: msgId,
    conversationId,
    role,
    content,
    createdAt: now,
    status: "sent",
  };

  if (!data.messages[conversationId]) {
    data.messages[conversationId] = [];
  }
  data.messages[conversationId].push(msg);

  // Update conversation metadata
  conv.updatedAt = now;
  conv.messageCount = data.messages[conversationId].length;
  conv.lastMessageSnippet = content.substring(0, 80);

  // Auto-generate title on first user message if title is default
  if (conv.title === "New Conversation" && role === "user") {
    const cleanSnippet = content.trim().replace(/\n+/g, " ");
    conv.title =
      cleanSnippet.length > 36 ? `${cleanSnippet.substring(0, 36)}...` : cleanSnippet;
  }

  saveStorage(data);
  return msg;
}

export function searchConversations(
  userId: string,
  query: string
): AssistantConversation[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return listConversations(userId);

  const data = ensureStorage();
  const userConvs = Object.values(data.conversations).filter((c) => c.userId === userId);

  return userConvs.filter((conv) => {
    if (conv.title.toLowerCase().includes(clean)) return true;
    const msgs = data.messages[conv.id] || [];
    return msgs.some((m) => m.content.toLowerCase().includes(clean));
  });
}
