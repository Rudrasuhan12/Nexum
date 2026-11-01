import { prisma } from "../prisma.js";
import { Notification } from "@prisma/client";

export interface NotifyParams {
  userId: string;
  type: string; // "MESSAGE" | "MILESTONE" | "AGREEMENT" | "PROPOSAL" | "PAYMENT" | "SYSTEM"
  title: string;
  body: string;
  linkKind: string; // "project" | "proposal" | "milestone" | "thread" | "agreement" | "earnings"
  linkId: string;
  dedupeKey?: string;
}

/**
 * Shared notification dispatcher.
 * - Enforces deduplication via dedupeKey
 * - Respects user notification preferences (inApp toggle)
 */
export async function notify(params: NotifyParams): Promise<Notification | null> {
  const { userId, type, title, body, linkKind, linkId, dedupeKey } = params;

  // 1. Deduplication check
  if (dedupeKey) {
    const existing = await prisma.notification.findUnique({
      where: { dedupeKey },
    });
    if (existing) {
      return existing; // Idempotently ignore repeated event
    }
  }

  // 2. Notification preference check
  const pref = await prisma.notificationPref.findFirst({
    where: {
      userId,
      OR: [{ type }, { type: "ALL" }],
    },
  });

  if (pref && !pref.inApp) {
    // User has opted out of in-app notifications for this type
    return null;
  }

  // 3. Persist notification
  try {
    const record = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        linkKind,
        linkId,
        dedupeKey: dedupeKey || null,
      },
    });
    return record;
  } catch (err: any) {
    // In case of race condition on unique dedupeKey, safely return existing
    if (err?.code === "P2002" && dedupeKey) {
      return await prisma.notification.findUnique({ where: { dedupeKey } });
    }
    throw err;
  }
}

/**
 * Marks a single notification as read for the user.
 */
export async function markNotificationAsRead(id: string, userId: string): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

/**
 * Marks all unread notifications as read for the user.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}

/**
 * Gets live unread notification count.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: { userId, readAt: null },
  });
}

/**
 * Prunes notifications older than retention days (default: 90 days).
 */
export async function pruneOldNotifications(retentionDays = 90): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await prisma.notification.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}
