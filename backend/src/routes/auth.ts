import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import {
  hashPassword,
  verifyPassword,
  createSession,
  revokeSession,
  SESSION_COOKIE_NAME,
  checkLoginRateLimit,
  recordFailedLogin,
  clearFailedLogins,
} from "../lib/auth.js";
import { appendAuditEvent } from "../lib/audit.js";
import {
  ValidationError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { Role } from "@prisma/client";

const router = Router();

const signupSchema = z.object({
  email: z.string().email("A valid email address is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  name: z.string().optional(),
  role: z.enum(["CLIENT", "FREELANCER"]).optional(),
});

const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

const roleSchema = z.object({
  role: z.enum(["CLIENT", "FREELANCER"], {
    errorMap: () => ({ message: "Role must be CLIENT or FREELANCER" }),
  }),
});

function setSessionCookie(res: Response, rawToken: string, expiresAt: Date) {
  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

// POST /api/auth/signup - Register user with Argon2id and set session cookie
router.post(
  "/signup",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Invalid signup parameters", {
          issues: parsed.error.issues,
        });
      }

      const { email, password, name, role } = parsed.data;
      const normalizedEmail = email.trim().toLowerCase();

      // Check uniqueness case-insensitively
      const existing = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      });

      if (existing) {
        throw new ConflictError(
          `An account with email "${normalizedEmail}" already exists. Please sign in instead.`,
          { code: "EMAIL_IN_USE" }
        );
      }

      const passwordHash = await hashPassword(password);
      const displayName = name?.trim() || normalizedEmail.split("@")[0];

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: displayName,
          passwordHash,
          role: role ? (role as Role) : null,
          status: "ACTIVE",
          ...(role === "FREELANCER"
            ? {
                freelancerProfile: {
                  create: {
                    title: "Freelancer Specialist",
                    bio: "Independent specialist on the Nexum protocol.",
                    skills: [],
                    onboardingStatus: "NOT_STARTED",
                    availability: "AVAILABLE",
                  },
                },
              }
            : {}),
        },
      });

      // Audit event
      await appendAuditEvent({
        actorId: user.id,
        action: "USER_SIGNED_UP",
        objectType: "USER",
        objectId: user.id,
        metadata: { role: user.role, registeredAt: new Date().toISOString() },
      });

      // Issue database session & set httpOnly cookie
      const { rawToken, expiresAt } = await createSession(user.id, req);
      setSessionCookie(res, rawToken, expiresAt);

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        message: "Account created successfully",
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login - Database credentials verification with Argon2id
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Email and password are required");
      }

      const { email, password } = parsed.data;
      const normalizedEmail = email.trim().toLowerCase();
      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "127.0.0.1";

      // 1. Multi-layer rate limiting check (IP & IP+email)
      const rateCheck = checkLoginRateLimit(normalizedEmail, clientIp);
      if (!rateCheck.allowed) {
        res.setHeader("Retry-After", String(rateCheck.retryAfterSeconds));
        res.status(429).json({
          error: {
            code: "RATE_LIMITED",
            message: `Too many failed login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
            details: { retryAfterSeconds: rateCheck.retryAfterSeconds },
          },
        });
        return;
      }

      if (rateCheck.progressiveDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, rateCheck.progressiveDelayMs));
      }

      // 2. Query user
      const user = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
        include: { freelancerProfile: true },
      });

      // 3. Argon2id password verification (NO DEMO BYPASS)
      const passwordValid = user?.passwordHash
        ? await verifyPassword(password, user.passwordHash)
        : false;

      if (!user || !passwordValid) {
        recordFailedLogin(normalizedEmail, clientIp);
        throw new UnauthorizedError("Invalid email or password");
      }

      // Successful login clears failed tracker for this IP+email
      clearFailedLogins(normalizedEmail, clientIp);

      // Audit log
      await appendAuditEvent({
        actorId: user.id,
        action: "USER_LOGGED_IN",
        objectType: "USER",
        objectId: user.id,
        metadata: { role: user.role, timestamp: new Date().toISOString() },
      });

      // Issue session and cookie
      const { rawToken, expiresAt } = await createSession(user.id, req);
      setSessionCookie(res, rawToken, expiresAt);

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        message: `Logged in as ${user.name}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout - Server-side session revocation
router.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.[SESSION_COOKIE_NAME];
      if (token) {
        await revokeSession(token);
      }

      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me - Authenticated user session state
router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const profile = user.freelancerProfile;

    const isOnboarded =
      user.role === Role.FREELANCER
        ? profile?.onboardingStatus === "COMPLETE"
        : true;

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      onboarding: {
        required: user.role === Role.FREELANCER && !isOnboarded,
        status: profile?.onboardingStatus || "NOT_STARTED",
        nextStep:
          !user.role
            ? "ROLE_SELECTION"
            : !isOnboarded
            ? "PROFILE_DETAILS"
            : "COMPLETE",
      },
    });
  }
);

// POST /api/auth/role - Role assignment (allowed once, concurrency-safe via FOR UPDATE)
router.post(
  "/role",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = roleSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Role must be CLIENT or FREELANCER");
      }

      const user = req.user!;

      // Concurrency protection: Lock the user row with SELECT ... FOR UPDATE inside an interactive transaction.
      // This guarantees that concurrent requests serialize at the database level and only one can assign a role.
      const updated = await prisma.$transaction(async (tx) => {
        const lockedUsers = await tx.$queryRaw<
          Array<{ id: string; role: Role | null; email: string }>
        >`
          SELECT id, role, email FROM "User" WHERE id = ${user.id} FOR UPDATE
        `;

        const lockedUser = lockedUsers[0];
        if (!lockedUser) {
          throw new NotFoundError("User", user.id);
        }

        if (lockedUser.role !== null) {
          throw new ConflictError("User role has already been set", {
            code: "ROLE_ALREADY_SET",
            currentRole: lockedUser.role,
          });
        }

        return await tx.user.update({
          where: { id: user.id },
          data: {
            role: parsed.data.role,
            ...(parsed.data.role === "FREELANCER"
              ? {
                  freelancerProfile: {
                    upsert: {
                      create: {
                        title: "Freelancer Specialist",
                        bio: "Independent specialist on the Nexum protocol.",
                        skills: [],
                        onboardingStatus: "NOT_STARTED",
                      },
                      update: {},
                    },
                  },
                }
              : {}),
          },
        });
      });

      await appendAuditEvent({
        actorId: user.id,
        action: "USER_ROLE_ASSIGNED",
        objectType: "USER",
        objectId: user.id,
        metadata: { newRole: updated.role },
      });

      res.json({
        success: true,
        user: {
          id: updated.id,
          email: updated.email,
          role: updated.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
