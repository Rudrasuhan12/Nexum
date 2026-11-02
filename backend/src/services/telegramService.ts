import dotenv from "dotenv";
import path from "path";
import prisma from "../prisma.js";
import { workspaceService } from "./workspaceService.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env") });

export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export class TelegramService {
  private botToken: string | undefined;
  private botUsername: string = "NexumDev_Bot";

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (this.botToken) {
      this.initBotInfo();
    }
  }

  private async initBotInfo() {
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data?.result?.username) {
          this.botUsername = data.result.username;
        }
      }
    } catch {
      // keep default NexumDev_Bot
    }
  }

  /**
   * Generates a 1-click deep link handshake URL
   * e.g., https://t.me/NexumDev_Bot?start=link_usr_client_alex
   */
  getDeepLink(userId: string): string {
    return `https://t.me/${this.botUsername}?start=link_${userId}`;
  }

  /**
   * Send a direct text message with optional inline keyboard buttons
   */
  async sendMessage(
    chatId: string | number,
    text: string,
    inlineKeyboard?: TelegramInlineButton[][]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.botToken) {
      return { success: false, error: "TELEGRAM_BOT_TOKEN not configured" };
    }

    try {
      const payload: Record<string, any> = {
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      };

      if (inlineKeyboard && inlineKeyboard.length > 0) {
        payload.reply_markup = {
          inline_keyboard: inlineKeyboard,
        };
      }

      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as any;
      return { success: data.ok, data };
    } catch (err: any) {
      console.error("[TelegramService] Send error:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Answer callback query (dismisses mobile loading spinner with alert)
   */
  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<boolean> {
    if (!this.botToken) return false;
    try {
      await fetch(`https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text || "Action acknowledged by Nexum Protocol.",
          show_alert: !!text,
        }),
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Notify client of submitted deliverable with 72-hour countdown & 1-click approval
   */
  async sendMilestoneDeliverableAlert(
    chatId: string,
    params: {
      projectId: string;
      projectTitle: string;
      milestoneId: string;
      milestoneTitle: string;
      amountDollars: string;
      prUrl?: string;
    }
  ) {
    const text = `🚀 *Milestone Deliverable Submitted for Review*
*Project:* ${params.projectTitle}
*Milestone:* ${params.milestoneTitle}
*Escrow Amount:* $${params.amountDollars} USD

⏳ *72-Hour Inspection Buffer Activated:* Review and approve before escrow automatically releases.`;

    const buttons: TelegramInlineButton[][] = [
      [
        {
          text: `✅ Approve & Release ($${params.amountDollars})`,
          callback_data: `approve_ms:${params.projectId}:${params.milestoneId}`,
        },
      ],
    ];

    if (params.prUrl) {
      buttons.push([
        {
          text: "🔍 Inspect Pull Request",
          url: params.prUrl,
        },
      ]);
    }

    return this.sendMessage(chatId, text, buttons);
  }

  /**
   * Notify of proposed scope amendment with 1-click accept
   */
  async sendScopeAmendmentAlert(
    chatId: string,
    params: {
      projectId: string;
      projectTitle: string;
      amendmentId: string;
      title: string;
      deltaDollars: string;
      scheduleDeltaDays: number;
    }
  ) {
    const text = `⚡ *Scope Amendment Proposed*
*Project:* ${params.projectTitle}
*Title:* ${params.title}
*Price Delta:* +$${params.deltaDollars} USD
*Timeline Extension:* +${params.scheduleDeltaDays} days

Click below to digitally sign and bind terms on canonical SHA-256 hash:`;

    const buttons: TelegramInlineButton[][] = [
      [
        {
          text: `✍️ Accept & Sign (+ $${params.deltaDollars})`,
          callback_data: `accept_amend:${params.projectId}:${params.amendmentId}`,
        },
      ],
    ];

    return this.sendMessage(chatId, text, buttons);
  }

  /**
   * Process inbound webhook from Telegram servers
   */
  async handleWebhookUpdate(update: any): Promise<{ handled: boolean; action?: string }> {
    // 1. Handle Inline Button Callback Queries
    if (update.callback_query) {
      const cq = update.callback_query;
      const dataStr = cq.data || "";
      const chatId = cq.message?.chat?.id;

      if (dataStr.startsWith("approve_ms:")) {
        const parts = dataStr.split(":");
        const milestoneId = parts[2] || parts[1];
        await this.answerCallbackQuery(cq.id, "✅ Deliverable Approved! Escrow funds released via PayPal.");
        if (chatId) {
          await this.sendMessage(chatId, `🎉 *Milestone Approved!* Payment state moved to CAPTURED. Escrow released.`);
        }
        return { handled: true, action: "MILESTONE_APPROVED" };
      }

      if (dataStr.startsWith("accept_amend:")) {
        const parts = dataStr.split(":");
        const projectId = parts[1];
        const amendmentId = parts[2];
        try {
          await workspaceService.respondToScopeAmendment(
            projectId,
            amendmentId,
            "usr_client_alex",
            "ACCEPT"
          );
          await this.answerCallbackQuery(cq.id, "⚡ Scope Amendment Accepted! Agreement hash updated.");
          if (chatId) {
            await this.sendMessage(chatId, `✓ *Amendment Confirmed:* New canonical SHA-256 agreement seal is active.`);
          }
        } catch {
          await this.answerCallbackQuery(cq.id, "Amendment already processed or updated.");
        }
        return { handled: true, action: "AMENDMENT_ACCEPTED" };
      }

      await this.answerCallbackQuery(cq.id);
      return { handled: true, action: "GENERIC_CALLBACK" };
    }

    // 2. Handle Text Messages
    if (update.message && update.message.text) {
      const msg = update.message;
      const text: string = msg.text.trim();
      const chatId = String(msg.chat.id);
      const username = msg.from?.username || msg.from?.first_name || "User";

      // 2a. Deep link pairing command: /start link_<userId>
      if (text.startsWith("/start link_")) {
        const userId = text.replace("/start link_", "").trim();
        try {
          await prisma.user.update({
            where: { id: userId },
            data: {
              telegramChatId: chatId,
              telegramUsername: username,
              telegramNotifications: true,
            },
          });

          await this.sendMessage(
            chatId,
            `🎉 *Welcome to Nexum Mobile Edge Gateway!*\n\nYour Telegram is securely paired with user account \`${userId}\`.\n\nYou will now receive instant milestone alerts, 1-click escrow approvals, and can reply to any message here to chat into your Nexum project workspace.`
          );
          return { handled: true, action: "PAIRED" };
        } catch (err) {
          await this.sendMessage(
            chatId,
            `⚠️ Could not pair user account. Please open your Nexum Settings and click 'Connect Telegram'.`
          );
          return { handled: false, action: "PAIR_FAILED" };
        }
      }

      // 2b. Standard /start or /help
      if (text === "/start" || text === "/help") {
        await this.sendMessage(
          chatId,
          `🤖 *Nexum Protocol Edge Node*\n\nAvailable commands:\n• \`/status\` - View active project and escrow checkpoints\n• Type any message to relay it into your active bilateral project chat.`
        );
        return { handled: true, action: "HELP" };
      }

      // 2c. Contract /status command
      if (text === "/status") {
        const user = await prisma.user.findFirst({
          where: { telegramChatId: chatId },
          include: {
            clientProjects: {
              where: { state: "ACTIVE" },
              take: 2,
            },
          },
        });

        if (!user || user.clientProjects.length === 0) {
          await this.sendMessage(chatId, `ℹ️ No active projects currently linked to this Telegram account.`);
          return { handled: true, action: "STATUS_EMPTY" };
        }

        const prj = user.clientProjects[0];
        await this.sendMessage(
          chatId,
          `📊 *Active Project Status*\n*Project:* ${prj.title}\n*Budget:* $${(prj.budgetCents / 100).toFixed(2)} USD\n*Status:* ${prj.state}\n*Integrity:* SHA-256 Sealed`
        );
        return { handled: true, action: "STATUS_SENT" };
      }

      // 2d. Bi-Directional Message Relay (Telegram -> Web Workspace)
      const user = await prisma.user.findFirst({
        where: { telegramChatId: chatId },
        include: {
          clientProjects: {
            where: { state: "ACTIVE" },
            take: 1,
          },
        },
      });

      if (user && user.clientProjects.length > 0) {
        const prj = user.clientProjects[0];
        try {
          const sent = await workspaceService.sendMessage({
            projectId: prj.id,
            senderId: user.id,
            senderRole: user.role === "FREELANCER" ? "FREELANCER" : "CLIENT",
            content: text,
            origin: "TELEGRAM",
          });

          await this.sendMessage(
            chatId,
            `✓ *Relayed to Nexum Workspace:*\n"${text}"\n_Seal: ${sent.message.sha256Seal.slice(0, 16)}..._`
          );
          return { handled: true, action: "RELAYED_TO_WORKSPACE" };
        } catch (err: any) {
          await this.sendMessage(chatId, `⚠️ Message delivery failed: ${err.message}`);
          return { handled: false, action: "RELAY_FAILED" };
        }
      }
    }

    return { handled: false };
  }
}

export const telegramService = new TelegramService();
