import { Request, Response, NextFunction } from "express";
import { SESSION_COOKIE_NAME } from "../lib/auth.js";
import { env } from "../lib/env.js";
import { ForbiddenError } from "../lib/errors.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF Protection Middleware.
 * Validates Origin/Referer headers on state-changing requests authenticated via cookies.
 */
export function csrfProtection(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // 1. Safe idempotent methods are exempt
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // 2. Machine-to-machine requests authenticating via Bearer header are exempt
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return next();
  }

  // 3. Requests without a session cookie do not use ambient credentials
  const sessionCookie = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionCookie) {
    return next();
  }

  // 4. Public webhooks / exemptions
  if (req.path.includes("/webhook") || req.path.startsWith("/health")) {
    return next();
  }

  // 5. Origin / Referer validation for cookie-authenticated mutations
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const candidateHeader = origin || (referer ? new URL(referer).origin : undefined);

  if (!candidateHeader) {
    return next(
      new ForbiddenError(
        "CSRF validation failed: Missing Origin or Referer on state-changing request"
      )
    );
  }

  const allowedOrigins = env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(",").map((o) => o.trim().toLowerCase())
    : ["http://localhost:3000", "http://127.0.0.1:3000"];

  const candidateLower = candidateHeader.toLowerCase();
  const isAllowed =
    allowedOrigins.includes("*") ||
    allowedOrigins.some((allowed) => candidateLower === allowed || candidateLower.endsWith(".vercel.app"));

  if (!isAllowed) {
    return next(
      new ForbiddenError(
        `CSRF validation failed: Origin '${candidateHeader}' is not authorized`
      )
    );
  }

  next();
}

