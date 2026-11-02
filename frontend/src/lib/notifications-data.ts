/**
 * Nexum Notification Store & Types
 * Manages live notification state for Client and Freelancer users.
 * Supports all lifecycle triggers: Deliverables, Escrow, AI Mediation, Consensus, Proposals.
 */

export type NotificationType =
  | "DELIVERABLE"
  | "PAYMENT"
  | "CHANGE_REQUEST"
  | "CONSENSUS"
  | "MILESTONE"
  | "DISPUTE"
  | "PROPOSAL"
  | "SYSTEM"
  | "MESSAGE";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface AppNotification {
  id: string;
  userId?: string;
  role: "CLIENT" | "FREELANCER" | "OPERATOR" | "ALL";
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  projectName?: string;
  projectId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationDeadLetter {
  id: string;
  originalJobId: string;
  eventName: string;
  recipientUserId?: string;
  recipientRole?: string;
  payload: Record<string, unknown>;
  errorReason: string;
  stackTrace?: string;
  attempts: number;
  failedAt: string;
  replayedAt?: string;
}

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

class NotificationStore {
  private notifications: AppNotification[] = [];

  getForUser(role?: string, userId?: string): { notifications: AppNotification[]; unreadCount: number } {
    let filtered = this.notifications;
    if (role) {
      filtered = filtered.filter((n) => n.role === role || n.role === "ALL");
    }
    if (userId) {
      filtered = filtered.filter((n) => !n.userId || n.userId === userId || n.role === "ALL");
    }

    const unreadCount = filtered.filter((n) => !n.read).length;
    return { notifications: filtered, unreadCount };
  }

  markAsRead(id: string): AppNotification | null {
    const item = this.notifications.find((n) => n.id === id);
    if (item) {
      item.read = true;
      item.readAt = new Date().toISOString();
      return item;
    }
    return null;
  }

  markAllAsRead(role?: string, userId?: string): number {
    let count = 0;
    const nowIso = new Date().toISOString();
    this.notifications.forEach((n) => {
      const matchRole = !role || n.role === role || n.role === "ALL";
      const matchUser = !userId || !n.userId || n.userId === userId;
      if (matchRole && matchUser) {
        if (!n.read) {
          n.read = true;
          n.readAt = nowIso;
          count++;
        }
      }
    });
    return count;
  }

  addNotification(notif: Omit<AppNotification, "id" | "createdAt" | "read">): AppNotification {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: "Just now",
      read: false,
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }

  deleteNotification(id: string): boolean {
    const initialLen = this.notifications.length;
    this.notifications = this.notifications.filter((n) => n.id !== id);
    return this.notifications.length < initialLen;
  }

  reset(): void {
    this.notifications = [];
  }
}

export const notificationStore = new NotificationStore();
