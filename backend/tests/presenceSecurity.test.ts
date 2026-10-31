import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import net from "net";
import { app } from "../src/index.js";
import { prisma } from "../src/prisma.js";
import { createSession } from "../src/lib/auth.js";

describe("SEC-02: User Presence Mutation Authentication & Ownership Security", () => {
  let server: http.Server;
  let baseUrl: string;
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let rawTokenA: string;
  let authHeadersA: Record<string, string>;

  beforeAll(async () => {
    // Start ephemeral test server
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as net.AddressInfo).port;
    baseUrl = `http://127.0.0.1:${port}`;

    const timestamp = Date.now();
    // 1. Create two isolated test users
    userA = await prisma.user.create({
      data: {
        email: `sec02-user-a-${timestamp}@test.isolated`,
        name: "Test Presence User A",
        role: "FREELANCER",
        status: "ACTIVE",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `sec02-user-b-${timestamp}@test.isolated`,
        name: "Test Presence User B",
        role: "CLIENT",
        status: "ACTIVE",
      },
    });

    // 2. Create authenticated session for User A
    const dummyReq = {
      headers: { "user-agent": "Presence-Vitest-Agent" },
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    } as any;

    const sessionRes = await createSession(userA.id, dummyReq);
    rawTokenA = sessionRes.rawToken;
    authHeadersA = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${rawTokenA}`,
      Cookie: `sessionId=${rawTokenA}`,
      Origin: "http://localhost:3000",
    };
  });

  afterAll(async () => {
    // Clean up test records
    if (userA?.id) {
      await prisma.session.deleteMany({ where: { userId: userA.id } });
      await prisma.auditEvent.deleteMany({ where: { actorId: userA.id } });
      await prisma.user.deleteMany({ where: { id: userA.id } });
    }
    if (userB?.id) {
      await prisma.session.deleteMany({ where: { userId: userB.id } });
      await prisma.auditEvent.deleteMany({ where: { actorId: userB.id } });
      await prisma.user.deleteMany({ where: { id: userB.id } });
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("rejects unauthenticated presence mutation with 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${baseUrl}/api/users/${userA.id}/presence`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presence: "busy" }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error?.code).toBe("UNAUTHORIZED");
    expect(body.error?.message).toContain("Authentication required");
  });

  it("allows authenticated user to update their own presence and persists to PostgreSQL", async () => {
    const res = await fetch(`${baseUrl}/api/users/${userA.id}/presence`, {
      method: "PATCH",
      headers: authHeadersA,
      body: JSON.stringify({ presence: "busy" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.userId).toBe(userA.id);
    expect(body.presence).toBe("busy");

    // Verify persistence in PostgreSQL User.preferences
    const dbUser = await prisma.user.findUnique({
      where: { id: userA.id },
      select: { preferences: true },
    });
    const prefs = dbUser?.preferences as Record<string, any>;
    expect(prefs?.presence).toBe("busy");
    expect(prefs?.presenceUpdatedAt).toBeDefined();

    // Verify audit event persisted
    const audit = await prisma.auditEvent.findFirst({
      where: {
        actorId: userA.id,
        action: "PRESENCE_CHANGED",
        objectId: userA.id,
      },
    });
    expect(audit).not.toBeNull();
    expect((audit?.metadata as any)?.newPresence).toBe("busy");
  });

  it("blocks cross-user mutation: User A attempting to update User B presence returns 403 FORBIDDEN", async () => {
    const res = await fetch(`${baseUrl}/api/users/${userB.id}/presence`, {
      method: "PATCH",
      headers: authHeadersA, // Authenticated as User A
      body: JSON.stringify({ presence: "offline" }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error?.code).toBe("FORBIDDEN");
    expect(body.error?.message).toContain("not authorized to update another user's presence");

    // Ensure User B's preferences were NOT altered
    const dbUserB = await prisma.user.findUnique({
      where: { id: userB.id },
      select: { preferences: true },
    });
    const prefsB = dbUserB?.preferences as Record<string, any> | null;
    expect(prefsB?.presence).toBeUndefined();
  });

  it("rejects invalid presence values with 400 VALIDATION_ERROR", async () => {
    const res = await fetch(`${baseUrl}/api/users/${userA.id}/presence`, {
      method: "PATCH",
      headers: authHeadersA,
      body: JSON.stringify({ presence: "invalid_status_xyz" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error?.code).toBe("VALIDATION_ERROR");
    expect(body.error?.message).toContain("Invalid presence status");
  });

  it("supports reading presence via GET /api/users/:userId/presence", async () => {
    const res = await fetch(`${baseUrl}/api/users/${userA.id}/presence`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.userId).toBe(userA.id);
    expect(body.presence).toBe("busy");
  });
});
