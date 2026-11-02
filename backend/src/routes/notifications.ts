import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from "../services/notificationService.js";
import { NotFoundError } from "../lib/errors.js";

const router = Router();

// Enforce authentication on all notification endpoints
router.use(requireAuth);

/**
 * GET /api/notifications
 * Lists notifications with pagination and unread filtering.
 */
router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const unreadOnly = req.query.unread === "true" || req.query.unread === "1";
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.readAt = null;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      getUnreadNotificationCount(userId),
    ]);

    res.status(200).json({
      success: true,
      notifications: notifications.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        linkKind: n.linkKind,
        linkId: n.linkId,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        isRead: n.readAt !== null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
      page,
      limit,
      total,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/unread-count
 * Returns live unread count.
 */
router.get("/unread-count", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const unreadCount = await getUnreadNotificationCount(userId);
    res.status(200).json({ success: true, count: unreadCount, unreadCount });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/:id/read
 * Marks single notification as read.
 */
router.post("/:id/read", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notif = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notif) {
      throw new NotFoundError("Notification", id);
    }

    await markNotificationAsRead(id, userId);
    res.status(200).json({ success: true, id, readAt: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/:id (backward compatibility with frontend)
 */
router.patch("/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notif = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notif) {
      throw new NotFoundError("Notification", id);
    }

    await markNotificationAsRead(id, userId);
    res.status(200).json({ success: true, id, readAt: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/read-all
 * Marks all notifications for user as read.
 */
router.post("/read-all", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const count = await markAllNotificationsAsRead(userId);
    res.status(200).json({ success: true, updatedCount: count, unreadCount: 0 });
  } catch (err) {
    next(err);
  }
});

export default router;
