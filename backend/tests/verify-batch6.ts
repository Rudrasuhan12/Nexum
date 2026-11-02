process.env.DISABLE_BACKGROUND_WORKER = "true";
process.env.NODE_ENV = "test";
process.env.ENABLE_DEV_TOOLS = "true";

import http from "http";
import net from "net";
import { app } from "../src/index.js";
import { prisma } from "../src/prisma.js";
import { createSession } from "../src/lib/auth.js";
import { notify } from "../src/services/notificationService.js";
import { Role } from "@prisma/client";

async function runBatch6Verification() {
  console.log("=======================================================");
  console.log("   NEXUM FREELANCER BACKEND — BATCH 6 VERIFICATION    ");
  console.log("=======================================================\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as net.AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string, details?: any) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ PASS — [Check ${total}] ${message}`, details ? `(${JSON.stringify(details)})` : "");
    } else {
      console.error(`❌ FAIL — [Check ${total}] ${message}`, details ? `(${JSON.stringify(details)})` : "");
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Setup test user
  const email = `batch6_test_${Date.now()}@test.nexum`;
  const testUser = await prisma.user.create({
    data: {
      email,
      name: "Alex Batch6 Rivera",
      role: Role.FREELANCER,
      preferences: {
        presence: "available",
      },
    },
  });

  const session = await createSession(testUser.id);
  const authHeaders = {
    Cookie: `nexum_session=${session.rawToken}`,
    Authorization: `Bearer ${session.rawToken}`,
  };

  try {
    // Check 1: GET /api/users/presence (session-derived)
    const getPresenceRes = await fetch(`${baseUrl}/api/users/presence`, {
      headers: authHeaders,
    });
    const getPresenceBody = (await getPresenceRes.json()) as any;

    assert(
      getPresenceRes.status === 200 &&
        getPresenceBody.presence === "available",
      "GET /api/users/presence returns session user presence",
      { status: getPresenceRes.status, presence: getPresenceBody.presence }
    );

    // Check 2: PATCH /api/users/presence updates status
    const patchPresenceRes = await fetch(`${baseUrl}/api/users/presence`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        presence: "busy",
      }),
    });
    const patchPresenceBody = (await patchPresenceRes.json()) as any;

    assert(
      patchPresenceRes.status === 200 &&
        patchPresenceBody.presence === "busy",
      "PATCH /api/users/presence updates presence state",
      { status: patchPresenceRes.status, body: patchPresenceBody }
    );

    // Check 3: Check database persistence of presence in User.preferences
    const dbUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    const userPrefs = dbUser?.preferences as any;
    assert(
      userPrefs?.presence === "busy",
      "Presence is persisted in database User.preferences JSON",
      { persistedPresence: userPrefs?.presence }
    );

    // Check 4: Check PRESENCE_CHANGED audit event
    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        actorId: testUser.id,
        action: "PRESENCE_CHANGED",
      },
    });
    assert(
      auditEvents.length >= 1,
      "PRESENCE_CHANGED audit event is appended to audit log",
      { eventCount: auditEvents.length }
    );

    // Check 5: GET /api/users/:userId/presence (public view)
    const getPublicPresenceRes = await fetch(`${baseUrl}/api/users/${testUser.id}/presence`);
    const getPublicPresenceBody = (await getPublicPresenceRes.json()) as any;
    assert(
      getPublicPresenceRes.status === 200 && getPublicPresenceBody.presence === "busy",
      "GET /api/users/:userId/presence returns public presence",
      { status: getPublicPresenceRes.status, presence: getPublicPresenceBody.presence }
    );

    // Check 6: Unauthenticated /api/users/presence returns 401
    const unauthPresenceRes = await fetch(`${baseUrl}/api/users/presence`);
    assert(
      unauthPresenceRes.status === 401,
      "Unauthenticated presence endpoint returns 401",
      { status: unauthPresenceRes.status }
    );

    // Check 7: GET /api/freelancer/tasks without projectId returns pendingCount
    const tasksRes = await fetch(`${baseUrl}/api/freelancer/tasks`, {
      headers: authHeaders,
    });
    const tasksBody = (await tasksRes.json()) as any;

    assert(
      tasksRes.status === 200 &&
        tasksBody.success === true &&
        Array.isArray(tasksBody.tasks) &&
        typeof tasksBody.pendingCount === "number",
      "GET /api/freelancer/tasks returns all tasks across agreements with pendingCount",
      { status: tasksRes.status, pendingCount: tasksBody.pendingCount }
    );

    // Check 8: Notifications API - create test notification and query
    const testNotif = await notify({
      userId: testUser.id,
      title: "Test Proposal Accepted",
      body: "Your proposal for Project Batch 6 was accepted",
      type: "PROPOSAL",
      linkKind: "proposal",
      linkId: "prop_batch6_test",
    });

    const notifsRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: authHeaders,
    });
    const notifsBody = (await notifsRes.json()) as any;

    assert(
      notifsRes.status === 200 &&
        Array.isArray(notifsBody.notifications) &&
        notifsBody.notifications.some((n: any) => n.id === testNotif?.id) &&
        notifsBody.unreadCount >= 1,
      "GET /api/notifications returns user's notifications and accurate unreadCount",
      { unreadCount: notifsBody.unreadCount, total: notifsBody.total }
    );

    // Check 9: PATCH /api/notifications/:id marks notification as read
    const patchNotifRes = await fetch(`${baseUrl}/api/notifications/${testNotif!.id}`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ read: true }),
    });
    const patchNotifBody = (await patchNotifRes.json()) as any;

    assert(
      patchNotifRes.status === 200 && patchNotifBody.success === true && !!patchNotifBody.readAt,
      "PATCH /api/notifications/:id updates read status in database",
      { status: patchNotifRes.status, readAt: patchNotifBody.readAt }
    );

    // Check 10: POST /api/notifications/read-all marks all notifications as read
    await notify({
      userId: testUser.id,
      title: "Second Notification",
      body: "Another notification",
      type: "SYSTEM",
      linkKind: "system",
      linkId: "sys_batch6_test",
    });

    const readAllRes = await fetch(`${baseUrl}/api/notifications/read-all`, {
      method: "POST",
      headers: authHeaders,
    });
    const readAllBody = (await readAllRes.json()) as any;

    assert(
      readAllRes.status === 200 && readAllBody.success === true,
      "POST /api/notifications/read-all marks all user notifications as read",
      { count: readAllBody.count }
    );

    const recheckNotifs = await fetch(`${baseUrl}/api/notifications`, {
      headers: authHeaders,
    });
    const recheckNotifsBody = (await recheckNotifs.json()) as any;

    assert(
      recheckNotifsBody.unreadCount === 0,
      "Unread count drops to 0 after read-all",
      { unreadCount: recheckNotifsBody.unreadCount }
    );

    // Check 11: Cross-user notification isolation
    const foreignUser = await prisma.user.create({
      data: {
        email: `foreign_${Date.now()}@test.nexum`,
        name: "Foreign User",
        role: Role.FREELANCER,
      },
    });
    const foreignNotif = await notify({
      userId: foreignUser.id,
      title: "Secret foreign notification",
      body: "Cannot be read by testUser",
      type: "PAYMENT",
      linkKind: "earnings",
      linkId: "earn_123",
    });

    const crossPatchRes = await fetch(`${baseUrl}/api/notifications/${foreignNotif!.id}`, {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ read: true }),
    });

    assert(
      crossPatchRes.status === 404,
      "PATCH /api/notifications/:id blocks foreign notification with 404",
      { status: crossPatchRes.status }
    );

    // Clean up
    await prisma.notification.deleteMany({ where: { userId: { in: [testUser.id, foreignUser.id] } } });
    await prisma.auditEvent.deleteMany({ where: { actorId: testUser.id } });
    await prisma.session.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({ where: { id: { in: [testUser.id, foreignUser.id] } } });

    server.close();

    console.log("\n=======================================================");
    console.log(`BATCH 6 VERIFICATION SUMMARY: ${passed} / ${total} PASSED`);
    console.log("=======================================================\n");
    process.exit(0);
  } catch (err) {
    // Clean up on error
    await prisma.notification.deleteMany({ where: { userId: testUser.id } });
    await prisma.auditEvent.deleteMany({ where: { actorId: testUser.id } });
    await prisma.session.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({ where: { id: testUser.id } });
    server.close();
    throw err;
  }
}

runBatch6Verification().catch((err) => {
  console.error("Batch 6 Verification Failed:", err);
  process.exit(1);
});
