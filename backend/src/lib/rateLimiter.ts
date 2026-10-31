/**
 * Multi-layer Login Rate Limiter.
 * Prevents account lockout attacks by scoping failures to (IP + email) and IP,
 * preventing an attacker from denying service to legitimate users on separate IPs.
 */

interface RateLimitBucket {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSeconds: number;
  progressiveDelayMs: number;
  reason?: "IP_THROTTLED" | "IP_EMAIL_THROTTLED";
}

export class LoginRateLimiter {
  private ipBuckets = new Map<string, RateLimitBucket>();
  private ipEmailBuckets = new Map<string, RateLimitBucket>();

  private readonly windowMs: number;
  private readonly maxIpAttempts: number;
  private readonly maxIpEmailAttempts: number;

  constructor(options?: {
    windowMs?: number;
    maxIpAttempts?: number;
    maxIpEmailAttempts?: number;
  }) {
    this.windowMs = options?.windowMs ?? 15 * 60 * 1000; // 15 minutes
    this.maxIpAttempts = options?.maxIpAttempts ?? 20; // 20 attempts per IP
    this.maxIpEmailAttempts = options?.maxIpEmailAttempts ?? 5; // 5 attempts per (IP, email)
  }

  /**
   * Helper to clean up expired buckets
   */
  private cleanBucket(bucket: RateLimitBucket | undefined, now: number): RateLimitBucket | null {
    if (!bucket) return null;
    if (now - bucket.firstAttemptAt > this.windowMs) {
      return null;
    }
    return bucket;
  }

  /**
   * Check rate limits before attempting authentication.
   */
  public check(ip: string, email: string): RateLimitCheckResult {
    const now = Date.now();
    const cleanIp = ip.trim();
    const cleanEmail = email.toLowerCase().trim();
    const ipEmailKey = `${cleanIp}::${cleanEmail}`;

    // 1. Check IP-wide throttling
    const ipBucket = this.cleanBucket(this.ipBuckets.get(cleanIp), now);
    if (ipBucket && ipBucket.count >= this.maxIpAttempts) {
      const retryAfter = Math.ceil((ipBucket.firstAttemptAt + this.windowMs - now) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, retryAfter),
        progressiveDelayMs: 0,
        reason: "IP_THROTTLED",
      };
    }

    // 2. Check (IP + Email) throttling
    const ipEmailBucket = this.cleanBucket(this.ipEmailBuckets.get(ipEmailKey), now);
    if (ipEmailBucket && ipEmailBucket.count >= this.maxIpEmailAttempts) {
      const retryAfter = Math.ceil((ipEmailBucket.firstAttemptAt + this.windowMs - now) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, retryAfter),
        progressiveDelayMs: 0,
        reason: "IP_EMAIL_THROTTLED",
      };
    }

    // 3. Calculate progressive delay for repeated failed attempts
    const count = ipEmailBucket?.count ?? 0;
    let progressiveDelayMs = 0;
    if (count >= 3) {
      // 100ms * 2^(count - 3) -> 3rd failure: 100ms, 4th failure: 200ms
      progressiveDelayMs = Math.min(2000, 100 * Math.pow(2, count - 3));
    }

    return {
      allowed: true,
      retryAfterSeconds: 0,
      progressiveDelayMs,
    };
  }

  /**
   * Record a failed login attempt.
   */
  public recordFailure(ip: string, email: string): void {
    const now = Date.now();
    const cleanIp = ip.trim();
    const cleanEmail = email.toLowerCase().trim();
    const ipEmailKey = `${cleanIp}::${cleanEmail}`;

    // Update IP bucket
    const ipBucket = this.cleanBucket(this.ipBuckets.get(cleanIp), now);
    if (!ipBucket) {
      this.ipBuckets.set(cleanIp, { count: 1, firstAttemptAt: now, lastAttemptAt: now });
    } else {
      ipBucket.count += 1;
      ipBucket.lastAttemptAt = now;
    }

    // Update (IP + Email) bucket
    const ipEmailBucket = this.cleanBucket(this.ipEmailBuckets.get(ipEmailKey), now);
    if (!ipEmailBucket) {
      this.ipEmailBuckets.set(ipEmailKey, { count: 1, firstAttemptAt: now, lastAttemptAt: now });
    } else {
      ipEmailBucket.count += 1;
      ipEmailBucket.lastAttemptAt = now;
    }
  }

  /**
   * Clear failed attempts upon successful login for this (IP, email).
   */
  public recordSuccess(ip: string, email: string): void {
    const cleanIp = ip.trim();
    const cleanEmail = email.toLowerCase().trim();
    const ipEmailKey = `${cleanIp}::${cleanEmail}`;
    this.ipEmailBuckets.delete(ipEmailKey);
  }

  /**
   * Reset all buckets (useful for test suites).
   */
  public reset(): void {
    this.ipBuckets.clear();
    this.ipEmailBuckets.clear();
  }
}

// Global default singleton instance
export const loginRateLimiter = new LoginRateLimiter();

