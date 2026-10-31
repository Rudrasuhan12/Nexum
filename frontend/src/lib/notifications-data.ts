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

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    userId: "usr_client_alex",
    role: "CLIENT",
    title: "Milestone 2 Deliverables Submitted",
    message: "Sambit Kumar submitted code and Loom demo for Milestone 2: Backend APIs & PayPal Order Capture.",
    type: "DELIVERABLE",
    priority: "HIGH",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/client/workspace",
    read: false,
    createdAt: "10m ago",
  },
  {
    id: "notif-2",
    userId: "usr_client_alex",
    role: "CLIENT",
    title: "PayPal Escrow Pre-Funding Confirmed",
    message: "Bilateral escrow capture confirmed for $4,000.00 USD via PayPal Sandbox Orders v2.",
    type: "PAYMENT",
    priority: "HIGH",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/client/payments",
    read: false,
    createdAt: "2h ago",
  },
  {
    id: "notif-3",
    userId: "usr_client_alex",
    role: "CLIENT",
    title: "Counteroffer Drafted by Nexum AI",
    message: "Counteroffer v5 (+ $500, +4 days) is awaiting your approval before sending to freelancer.",
    type: "CHANGE_REQUEST",
    priority: "NORMAL",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/client/workspace",
    read: false,
    createdAt: "4h ago",
  },
  {
    id: "notif-4",
    userId: "usr_client_alex",
    role: "CLIENT",
    title: "Dual SHA-256 State Consensus Ratified",
    message: "Both client and freelancer state hashes (0x9f8c...2b7e) synchronized and verified.",
    type: "CONSENSUS",
    priority: "URGENT",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/client/workspace?tab=activity",
    read: false,
    createdAt: "Yesterday",
  },
  {
    id: "notif-5",
    userId: "usr_client_alex",
    role: "CLIENT",
    title: "Milestone 1 Accepted & Paid",
    message: "UI/UX design deliverables approved. $2,000 disbursement executed via PayPal.",
    type: "MILESTONE",
    priority: "NORMAL",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/client/milestones",
    read: true,
    createdAt: "Oct 24, 2026",
  },
  // Freelancer notifications
  {
    id: "notif-fl-1",
    userId: "usr_freelancer_rohan",
    role: "FREELANCER",
    title: "Client Counteroffer Received",
    message: "Alex Chen sent a counteroffer of +$500 for CR-2 carousel feature.",
    type: "CHANGE_REQUEST",
    priority: "HIGH",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/freelancer/workspace",
    read: false,
    createdAt: "20m ago",
  },
  {
    id: "notif-fl-2",
    userId: "usr_freelancer_rohan",
    role: "FREELANCER",
    title: "Escrow Deposit Secured ($4,000)",
    message: "Milestone 2 pre-funding is locked in PayPal Bilateral Escrow. Work is protected.",
    type: "PAYMENT",
    priority: "HIGH",
    projectName: "TechKart – E-commerce Website",
    projectId: "p-101",
    actionUrl: "/freelancer/earnings",
    read: false,
    createdAt: "3h ago",
  },
];

class NotificationStore {
  private notifications: AppNotification[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));

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
    this.notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
  }
}

export const notificationStore = new NotificationStore();
