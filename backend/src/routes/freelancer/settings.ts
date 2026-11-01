import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { z } from "zod";
import { Role, ProjectState, MilestoneWorkStatus } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { prisma } from "../../prisma.js";
import { hashPassword, verifyPassword, hashSessionToken } from "../../lib/auth.js";
import { appendAuditEvent } from "../../lib/audit.js";
import {
  ValidationError,
  ConflictError,
  NotFoundError,
} from "../../lib/errors.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));

/**
 * GET /api/freelancer/settings/account
 * Returns current user account profile details.
 */
router.get("/account", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        pendingEmail: true,
        locale: true,
        timezone: true,
        workingHours: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User", req.user!.id);
    }

    res.status(200).json({ success: true, account: user });
  } catch (err) {
    next(err);
  }
});

const patchAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().min(1).max(50).optional(),
  locale: z.string().min(2).max(10).optional(),
  workingHours: z.any().optional(),
});

/**
 * PATCH /api/freelancer/settings/account
 * Updates display name, timezone, locale, and working hours.
 */
router.patch("/account", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = patchAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid account settings payload", parsed.error.flatten().fieldErrors, 400);
    }

    const { name, timezone, locale, workingHours } = parsed.data;
    const userId = req.user!.id;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name ? { name } : {}),
        ...(timezone ? { timezone } : {}),
        ...(locale ? { locale } : {}),
        ...(workingHours !== undefined ? { workingHours } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true,
        locale: true,
        workingHours: true,
      },
    });

    await appendAuditEvent({
      actorId: userId,
      action: "USER_ACCOUNT_UPDATED",
      objectType: "USER",
      objectId: userId,
      metadata: { fieldsUpdated: Object.keys(parsed.data) },
    });

    res.status(200).json({ success: true, account: updated });
  } catch (err) {
    next(err);
  }
});

const emailChangeSchema = z.object({
  newEmail: z.string().email(),
});

/**
 * POST /api/freelancer/settings/email
 * Starts email change with a verification token.
 * Existing email stays active until token verification.
 */
router.post("/email", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = emailChangeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid email format", parsed.error.flatten().fieldErrors, 400);
    }

    const userId = req.user!.id;
    const { newEmail } = parsed.data;

    // Check if new email is already in use by another user
    const existing = await prisma.user.findUnique({
      where: { email: newEmail },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictError("Email address is already in use");
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: newEmail,
        emailChangeToken: token,
        emailChangeTokenExpiresAt: expiresAt,
      },
    });

    await appendAuditEvent({
      actorId: userId,
      action: "EMAIL_CHANGE_REQUESTED",
      objectType: "USER",
      objectId: userId,
      metadata: { pendingEmail: newEmail },
    });

    res.status(200).json({
      success: true,
      pendingEmail: newEmail,
      token, // Returned for dev / testing / simulation
      message: "Verification token generated. Submit token to /verify to confirm.",
    });
  } catch (err) {
    next(err);
  }
});

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

/**
 * POST /api/freelancer/settings/email/verify
 * Validates verification token and completes email switch.
 */
router.post("/email/verify", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Verification token is required", parsed.error.flatten().fieldErrors, 400);
    }

    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      !user ||
      !user.emailChangeToken ||
      user.emailChangeToken !== parsed.data.token ||
      !user.pendingEmail
    ) {
      throw new ValidationError("Invalid or expired verification token", {}, 400);
    }

    if (
      user.emailChangeTokenExpiresAt &&
      user.emailChangeTokenExpiresAt < new Date()
    ) {
      throw new ValidationError("Verification token has expired", {}, 400);
    }

    const oldEmail = user.email;
    const newEmail = user.pendingEmail;

    await prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeTokenExpiresAt: null,
      },
    });

    await appendAuditEvent({
      actorId: userId,
      action: "EMAIL_CHANGE_VERIFIED",
      objectType: "USER",
      objectId: userId,
      metadata: { previousEmail: oldEmail, updatedEmail: newEmail },
    });

    res.status(200).json({
      success: true,
      email: newEmail,
      message: "Email successfully updated",
    });
  } catch (err) {
    next(err);
  }
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

/**
 * POST /api/freelancer/settings/password
 * Requires current password verification.
 * Updates password and revokes all other remote sessions.
 */
router.post("/password", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = passwordChangeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid password payload", parsed.error.flatten().fieldErrors, 400);
    }

    const userId = req.user!.id;
    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new ValidationError("Invalid current password", {}, 400);
    }

    const validCurrent = await verifyPassword(currentPassword, user.passwordHash);
    if (!validCurrent) {
      throw new ValidationError("Invalid current password", {}, 400);
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all remote sessions except the current session
    const currentSessionToken = req.cookies?.nexum_session || req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (currentSessionToken) {
      const currentTokenHash = hashSessionToken(currentSessionToken);
      await prisma.session.deleteMany({
        where: {
          userId,
          tokenHash: { not: currentTokenHash },
        },
      });
    }

    await appendAuditEvent({
      actorId: userId,
      action: "PASSWORD_CHANGED",
      objectType: "USER",
      objectId: userId,
      metadata: { remoteSessionsRevoked: true },
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully. Other sessions revoked.",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/settings/sessions
 * Returns user's active sessions.
 */
router.get("/sessions", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const currentToken = req.cookies?.nexum_session || req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const currentTokenHash = currentToken ? hashSessionToken(currentToken) : null;

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      sessions: sessions.map((s: any) => ({
        id: s.id,
        ipAddress: s.ipAddress || "127.0.0.1",
        userAgent: s.userAgent || "Unknown browser",
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        isCurrent: currentTokenHash ? s.tokenHash === currentTokenHash : false,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/freelancer/settings/sessions/:id
 * Revokes a specific session.
 */
router.delete("/sessions/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const session = await prisma.session.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundError("Session", id);
    }

    await prisma.session.delete({
      where: { id },
    });

    res.status(200).json({ success: true, revokedSessionId: id });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/settings/privacy
 */
router.get("/privacy", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        visibility: true,
        showRate: true,
        showPortfolio: true,
      },
    });

    res.status(200).json({
      success: true,
      privacy: {
        visibility: user?.visibility || "PUBLIC",
        showRate: user?.showRate ?? true,
        showPortfolio: user?.showPortfolio ?? true,
      },
    });
  } catch (err) {
    next(err);
  }
});

const patchPrivacySchema = z.object({
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  showRate: z.boolean().optional(),
  showPortfolio: z.boolean().optional(),
});

/**
 * PATCH /api/freelancer/settings/privacy
 */
router.patch("/privacy", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = patchPrivacySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid privacy settings payload", parsed.error.flatten().fieldErrors, 400);
    }

    const userId = req.user!.id;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: {
        visibility: true,
        showRate: true,
        showPortfolio: true,
      },
    });

    await appendAuditEvent({
      actorId: userId,
      action: "PRIVACY_SETTINGS_UPDATED",
      objectType: "USER",
      objectId: userId,
      metadata: parsed.data,
    });

    res.status(200).json({ success: true, privacy: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/settings/notifications
 * Returns user notification preferences.
 */
router.get("/notifications", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const prefs = await prisma.notificationPref.findMany({
      where: { userId },
    });

    res.status(200).json({
      success: true,
      preferences: prefs.map((p: any) => ({
        type: p.type,
        inApp: p.inApp,
        email: p.email,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const patchNotificationPrefSchema = z.object({
  type: z.string().min(1),
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
});

/**
 * PATCH /api/freelancer/settings/notifications
 * Upserts a notification preference.
 */
router.patch("/notifications", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = patchNotificationPrefSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid notification preference payload", parsed.error.flatten().fieldErrors, 400);
    }

    const userId = req.user!.id;
    const { type, inApp, email } = parsed.data;

    const pref = await prisma.notificationPref.upsert({
      where: {
        userId_type: { userId, type },
      },
      create: {
        userId,
        type,
        inApp: inApp ?? true,
        email: email ?? true,
      },
      update: {
        ...(inApp !== undefined ? { inApp } : {}),
        ...(email !== undefined ? { email } : {}),
      },
    });

    res.status(200).json({ success: true, preference: pref });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelancer/settings/export
 * Produces personal data export in compliance with GDPR.
 * Strictly excludes password hashes, tokens, internal secrets, or other users' private data.
 */
router.get("/export", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [user, profile, proposals, sentMessages, ledgerEntries, payouts, auditEvents] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            locale: true,
            timezone: true,
            status: true,
            visibility: true,
            createdAt: true,
          },
        }),
        prisma.freelancerProfile.findUnique({
          where: { userId },
          include: {
            user: {
              include: {
                freelancerSkills: true,
                certifications: true,
                workExperiences: true,
                portfolioProjects: true,
              },
            },
          },
        }),
        prisma.proposal.findMany({
          where: { freelancerId: userId },
          select: {
            id: true,
            projectId: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.message.findMany({
          where: { senderId: userId },
          select: {
            id: true,
            conversationId: true,
            originalBody: true,
            createdAt: true,
          },
        }),
        prisma.ledgerEntry.findMany({
          where: { userId },
          select: {
            id: true,
            projectId: true,
            amountMinor: true,
            currency: true,
            kind: true,
            createdAt: true,
          },
        }),
        prisma.payout.findMany({
          where: { freelancerId: userId },
          select: {
            id: true,
            amountMinor: true,
            currency: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.auditEvent.findMany({
          where: { actorId: userId },
          orderBy: { timestamp: "desc" },
          select: {
            id: true,
            action: true,
            objectType: true,
            objectId: true,
            timestamp: true,
          },
        }),
      ]);

    const exportData = {
      exportTimestamp: new Date().toISOString(),
      user,
      profile: profile ? {
        headline: profile.headline,
        bio: profile.bio,
        professionalTitle: profile.professionalTitle,
        hourlyRateMinor: profile.rateHourlyMinor,
        skills: profile.user.freelancerSkills.map((s: any) => s.skillName),
        certifications: profile.user.certifications.map((c: any) => ({ name: c.name, issuer: c.issuer })),
        workExperience: profile.user.workExperiences.map((w: any) => ({ title: w.role, company: w.company })),
        portfolioProjects: profile.user.portfolioProjects.map((p: any) => ({ title: p.title, url: p.projectUrl })),
      } : null,
      proposals,
      messages: sentMessages,
      ledgerEntries,
      payouts,
      auditEvents,
    };

    res.status(200).json({
      success: true,
      export: exportData,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/freelancer/settings/account
 * Soft delete account. Blocked if user has active projects or unsettled payments.
 */
router.delete("/account", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    // 1. Check for active projects (Agreement ACTIVE and Project state ACTIVE or NEGOTIATING)
    const activeAgreements = await prisma.agreement.findMany({
      where: {
        freelancerId: userId,
        status: "ACTIVE",
        project: {
          state: { in: [ProjectState.ACTIVE, ProjectState.NEGOTIATING] },
        },
      },
    });

    if (activeAgreements.length > 0) {
      throw new ConflictError(
        "Cannot delete account with active projects or unsettled contractual obligations",
        { activeProjectsCount: activeAgreements.length }
      );
    }

    // 2. Check for active milestones with unsettled payments
    const unsettledMilestones = await prisma.milestone.findMany({
      where: {
        agreement: { freelancerId: userId },
        removedAt: null,
        workStatus: { in: [MilestoneWorkStatus.IN_PROGRESS, MilestoneWorkStatus.AWAITING_CLIENT_REVIEW, MilestoneWorkStatus.REVISIONS_REQUESTED] },
      },
    });

    if (unsettledMilestones.length > 0) {
      throw new ConflictError(
        "Cannot delete account with milestones in progress or under review",
        { unsettledMilestonesCount: unsettledMilestones.length }
      );
    }

    // 3. Mark account soft-deleted
    const deletedAt = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "DELETED",
        deletedAt,
      },
    });

    // 4. Revoke all active sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    // 5. Append audit event recording compliance 14-day grace window
    await appendAuditEvent({
      actorId: userId,
      action: "ACCOUNT_SOFT_DELETED",
      objectType: "USER",
      objectId: userId,
      metadata: {
        deletedAt: deletedAt.toISOString(),
        gracePeriodDays: 14,
        notice: "Account scheduled for permanent archival after 14 days",
      },
    });

    res.status(200).json({
      success: true,
      message: "Account soft-deleted. All sessions revoked. 14-day grace period recorded.",
      deletedAt: deletedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
