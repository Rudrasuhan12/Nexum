import { NextResponse } from "next/server";
import { getCurrentUser, setSession } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

function createDefaultSettings(clientId: string, user?: any) {
  const isAlex = clientId === "usr_client_alex";
  return {
    profile: {
      name: isAlex ? "Alex Rivera" : user?.name || "Client User",
      email: isAlex ? "alex.rivera@nexum.demo" : user?.email || `${clientId}@nexum.work`,
      phone: isAlex ? "+1 (415) 892-4100" : "",
      location: isAlex ? "San Francisco, CA, USA" : "",
      company: isAlex ? "Horizon Commerce LLC" : user?.companyOrHandle || "",
      website: isAlex ? "https://horizoncommerce.demo" : "",
      timezone: isAlex ? "America/Los_Angeles (UTC-8)" : "UTC",
      bio: isAlex ? "Head of Product & Marketplace Payments at Horizon Commerce LLC. Managing high-integrity e-commerce payment infrastructure with automated milestone release rails." : "",
      avatar: isAlex ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80" : user?.avatar || "",
    },
    security: {
      twoFactorEnabled: isAlex,
      passwordLastChanged: isAlex ? "Oct 15, 2026" : "Account initialization",
      activeSessions: isAlex
        ? [
            {
              id: "sess_curr",
              device: "Chrome 131 on macOS (Apple Silicon)",
              location: "San Francisco, CA, USA",
              ip: "192.0.2.45",
              isCurrent: true,
              lastActive: "Active now",
            },
            {
              id: "sess_mobile",
              device: "Mobile Safari on iPhone 16 Pro",
              location: "San Francisco, CA, USA",
              ip: "198.51.100.12",
              isCurrent: false,
              lastActive: "2 hours ago",
            },
          ]
        : [
            {
              id: "sess_curr",
              device: "Current Browser Session",
              location: "Authorized Device",
              ip: "Local Session",
              isCurrent: true,
              lastActive: "Active now",
            },
          ],
    },
    payments: {
      autoFundMilestones: true,
      disputeMediationBuffer: true,
      paypalSandboxStatus: isAlex ? ("CONNECTED" as const) : ("DISCONNECTED" as const),
      paypalEmail: isAlex ? "sandbox-merchant@horizoncommerce.demo" : "",
      defaultCurrency: "USD",
      vatOrTaxId: isAlex ? "US-EIN-94-3829104" : "",
      billingReceipts: isAlex
        ? [
            {
              id: "rec_alex_1",
              orderId: "Order #6DE714998H998261C",
              projectTitle: "Bilateral E-Commerce Payment Rails",
              date: "Oct 24, 2026",
              amount: "$1,500.00 USD",
              status: "CAPTURED",
            },
            {
              id: "rec_alex_2",
              orderId: "Order #4AB912389K112233D",
              projectTitle: "Milestone 1 Core Architecture",
              date: "Oct 16, 2026",
              amount: "$1,200.00 USD",
              status: "CAPTURED",
            },
          ]
        : [],
    },
    notifications: {
      proposalsEmail: true,
      proposalsInApp: true,
      messagesEmail: true,
      messagesInApp: true,
      milestonesEmail: true,
      milestonesInApp: true,
      revisionsEmail: true,
      revisionsInApp: true,
      paymentsEmail: true,
      paymentsInApp: true,
      deadlinesEmail: false,
      deadlinesInApp: true,
    },
    hiring: {
      budgetMin: 40,
      budgetMax: 90,
      preferredExpLevel: "SENIOR" as const,
      preferredSkills: ["PayPal v2", "Next.js", "TypeScript", "PostgreSQL"],
      autoMatchThreshold: 90,
    },
    privacy: {
      profileVisibility: "VERIFIED_ONLY" as const,
      shareAuditTelemetry: true,
    },
    updatedAt: new Date().toISOString(),
  };
}

const fallbackStore = new Map<string, any>();

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") || user?.id || "usr_client_alex";

    try {
      const res = await fetch(`${BACKEND_URL}/api/client/settings?clientId=${clientId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch {
      // Backend offline fallback
    }

    if (!fallbackStore.has(clientId)) {
      fallbackStore.set(clientId, createDefaultSettings(clientId, user));
    }

    return NextResponse.json({
      success: true,
      data: fallbackStore.get(clientId),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch client settings";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const clientId = body.clientId || user?.id || "usr_client_alex";

    let updatedData: any = null;

    try {
      const res = await fetch(`${BACKEND_URL}/api/client/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, clientId }),
      });
      if (res.ok) {
        const json = await res.json();
        updatedData = json.data;
      }
    } catch {
      // Backend offline
    }

    if (!updatedData) {
      if (!fallbackStore.has(clientId)) {
        fallbackStore.set(clientId, createDefaultSettings(clientId, user));
      }
      const existing = fallbackStore.get(clientId)!;
      if (body.profile) existing.profile = { ...existing.profile, ...body.profile };
      if (body.security) existing.security = { ...existing.security, ...body.security };
      if (body.payments) existing.payments = { ...existing.payments, ...body.payments };
      if (body.notifications) existing.notifications = { ...existing.notifications, ...body.notifications };
      if (body.hiring) existing.hiring = { ...existing.hiring, ...body.hiring };
      if (body.privacy) existing.privacy = { ...existing.privacy, ...body.privacy };
      existing.updatedAt = new Date().toISOString();
      updatedData = existing;
    }

    // If profile was updated and matches logged-in user, refresh the session cookie
    if (user && body.profile) {
      try {
        await setSession({
          ...user,
          name: body.profile.name || user.name,
          companyOrHandle: body.profile.company || user.companyOrHandle,
          location: body.profile.location || user.location,
          timezone: body.profile.timezone || user.timezone,
        });
      } catch {
        // Non-blocking cookie update
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: "Settings successfully saved.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update client settings";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

