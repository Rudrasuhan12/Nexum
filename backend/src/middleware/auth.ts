import { Request, Response, NextFunction } from "express";
import { SESSION_COOKIE_NAME, validateSession } from "../lib/auth.js";
import { UnauthorizedError, ForbiddenError } from "../lib/errors.js";
import { Role, User, FreelancerProfile, Session } from "@prisma/client";

// Extend Express Request type to include authenticated user and session
declare global {
  namespace Express {
    interface Request {
      user?: User & { freelancerProfile?: FreelancerProfile | null };
      session?: Session;
    }
  }
}

/**
 * Middleware: Verifies session token from cookie or Authorization header.
 * Attaches user and session to request.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;

  const rawToken = cookieToken || bearerToken;

  if (!rawToken) {
    next(new UnauthorizedError("Authentication required: missing session token"));
    return;
  }

  try {
    const sessionRecord = await validateSession(rawToken);
    if (!sessionRecord || !sessionRecord.user) {
      next(new UnauthorizedError("Invalid or expired session token"));
      return;
    }

    req.session = sessionRecord;
    req.user = sessionRecord.user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: Role Guard enforcing specific Role (e.g. 'FREELANCER' or 'CLIENT').
 */
export function requireRole(allowedRole: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (req.user.role !== allowedRole) {
      next(
        new ForbiddenError(
          `Access denied: requires ${allowedRole} role (current role: ${req.user.role || "NONE"})`
        )
      );
      return;
    }

    next();
  };
}

/**
 * Middleware: Requires that a freelancer has completed onboarding.
 */
export function requireOnboarded(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    next(new UnauthorizedError());
    return;
  }

  if (req.user.role === Role.FREELANCER) {
    const onboardingStatus = req.user.freelancerProfile?.onboardingStatus;
    if (onboardingStatus !== "COMPLETE") {
      next(
        new ForbiddenError(
          "Onboarding incomplete. Please complete your profile to access this resource."
        )
      );
      return;
    }
  }

  next();
}

