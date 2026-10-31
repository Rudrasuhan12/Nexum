import crypto from "crypto";
import { hash, verify } from "@node-rs/argon2";
import { Request } from "express";
import { prisma } from "../prisma.js";

export const SESSION_COOKIE_NAME = "nexum_session";
const SESSION_DURATION_DAYS = 7;

import { loginRateLimiter, RateLimitCheckResult } from "./rateLimiter.js";

export function checkLoginRateLimit(email: string, ip: string = "127.0.0.1"): RateLimitCheckResult {
  return loginRateLimiter.check(ip, email);
}

export function recordFailedLogin(email: string, ip: string = "127.0.0.1"): void {
  loginRateLimiter.recordFailure(ip, email);
}

export function clearFailedLogins(email: string, ip: string = "127.0.0.1"): void {
  loginRateLimiter.recordSuccess(ip, email);
}

/**
 * Hash password with Argon2id.
 * Memory cost, time cost and parallelism meet production security standards.
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    memoryCost: 19456, // 19 MB
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Verify a plain-text password against a stored Argon2id hash.
 * Completely eliminates any hardcoded or demo password bypasses.
 */
export async function verifyPassword(password: string, storedHash?: string | null): Promise<boolean> {
  if (!storedHash) return false;
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}

/**
 * Compute SHA-256 hash of a raw session token.
 * Raw tokens are never stored in the database.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate 32 cryptographically secure random bytes (base64url).
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Create a new database-backed session for a user.
 * Returns the raw token to be placed into the httpOnly cookie.
 */
export async function createSession(userId: string, req?: Request): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const userAgent = req?.headers["user-agent"] || null;
  const ipAddress = (req?.headers["x-forwarded-for"] as string) || req?.socket.remoteAddress || null;

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  return { rawToken, expiresAt };
}

/**
 * Validate an incoming raw session token against the database.
 */
export async function validateSession(rawToken: string) {
  if (!rawToken || rawToken.trim().length === 0) return null;

  const tokenHash = hashSessionToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          freelancerProfile: true,
        },
      },
    },
  });

  if (!session) return null;

  // Check if revoked or expired
  if (session.revokedAt || new Date() > session.expiresAt) {
    return null;
  }

  return session;
}

/**
 * Server-side session revocation (logout).
 */
export async function revokeSession(rawToken: string): Promise<boolean> {
  if (!rawToken) return false;
  const tokenHash = hashSessionToken(rawToken);

  try {
    await prisma.session.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}
