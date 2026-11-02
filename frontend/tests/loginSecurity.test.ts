import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "../src/app/api/auth/login/route";
import { createSessionToken, verifySessionToken, DemoUser } from "../src/lib/auth";

// Mock next/headers
const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => undefined,
    set: mockCookieSet,
    delete: vi.fn(),
  }),
}));

describe("SEC-01: Login Authentication Security & Bypass Prevention", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockCookieSet.mockClear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("authenticates successfully with valid credentials from Express backend", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "set-cookie": "sessionId=test-token; Path=/" }),
      json: async () => ({
        success: true,
        user: {
          id: "usr_verified_123",
          email: "alex.rivera@nexum.demo",
          name: "Alex Rivera",
          role: "CLIENT",
        },
      }),
    });

    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alex.rivera@nexum.demo", password: "correctPassword123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.id).toBe("usr_verified_123");
    expect(mockCookieSet).toHaveBeenCalledTimes(1);
    expect(mockCookieSet).toHaveBeenCalledWith(
      "nexum_session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: "lax" })
    );
  });

  it("rejects invalid password with 401 and issues zero session cookies", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({
        error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
      }),
    });

    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alex.rivera@nexum.demo", password: "wrongPassword" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid email or password");
    // Verify no authenticated session cookie was set
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("returns 503 and does NOT fall back to DEMO_USERS when Express backend is unavailable", async () => {
    // Simulate backend connection failure (ECONNREFUSED)
    global.fetch = vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:4000"));

    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alex.rivera@nexum.demo", password: "anyPassword" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("Authentication service is currently unavailable");
    // CRITICAL: Prove demo user fallback was NOT triggered
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("rejects role or personaKey without password (demo bypass attempt rejected with 400)", async () => {
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "CLIENT", personaKey: "CLIENT" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Email address is required.");
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("preserves valid session tokens and signature verification for authenticated sessions", async () => {
    const user: DemoUser = {
      id: "usr_active_session_456",
      role: "FREELANCER",
      email: "freelancer@example.com",
      name: "Verified Freelancer",
      title: "Senior Engineer",
      companyOrHandle: "@freelancer",
      location: "Remote",
      timezone: "UTC",
      avatar: "https://example.com/avatar.png",
      statusBadge: "Verified",
      summary: "Active freelancer",
      canLogin: true,
      isDemoData: false,
      presenceStatus: "available",
    };

    const token = await createSessionToken(user);
    expect(typeof token).toBe("string");
    expect(token).toContain(".");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe("usr_active_session_456");
    expect(decoded?.email).toBe("freelancer@example.com");

    // Tampered token must fail
    const tampered = token.slice(0, -5) + "aaaaa";
    const invalidDecoded = await verifySessionToken(tampered);
    expect(invalidDecoded).toBeNull();
  });
});

