import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllOpenProjectsFromStore } from "@/lib/projects-store";
import { getBackendUrl } from "@/lib/backend-url";

const FALLBACK_RENDER_URL = "https://nexum-79g2.onrender.com";

function getTargetUrls(pathWithQuery: string): string[] {
  const backendBase = getBackendUrl();
  const isCloudOrProd =
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production" ||
    (typeof window === "undefined" && Boolean(process.env.AWS_REGION));

  const isLocalhost =
    !backendBase ||
    backendBase.includes("localhost") ||
    backendBase.includes("127.0.0.1");

  // In production / Vercel cloud serverless, never block on unreachable localhost
  if (isCloudOrProd && isLocalhost) {
    return [`${FALLBACK_RENDER_URL}/api/freelancer/${pathWithQuery}`];
  }

  const primary = `${backendBase}/api/freelancer/${pathWithQuery}`;
  if (isLocalhost && !backendBase.includes("onrender.com")) {
    return [primary, `${FALLBACK_RENDER_URL}/api/freelancer/${pathWithQuery}`];
  }
  return [primary];
}

function mapStoredProjectToOpportunity(p: any) {
  const budgetCents = p.budgetCents || 0;
  const budgetAmount = budgetCents > 0 ? budgetCents / 100 : 0;
  return {
    id: p.id,
    title: p.title || p.name || "Untitled Project",
    description: p.description || "",
    category: p.category || "Web Development",
    skills: p.skills || p.requiredSkills || [],
    experienceLevel: p.experienceLevel || "MID",
    budgetType: p.budgetType === "HOURLY" ? "Hourly" : "Fixed-price",
    budgetCents,
    budgetMinCents: null,
    budgetMaxCents: null,
    budgetAmount,
    budgetDisplay: p.totalBudget || `$${budgetAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    currency: p.currency || "USD",
    location: "Remote",
    visibility: "PUBLIC",
    state: "ACTIVE",
    postedAt: new Date(p.createdAtTimestamp || Date.now()).toISOString(),
    proposalsCount: 0,
    isSaved: false,
    client: {
      id: p.clientId || "usr_client",
      name: p.clientName || "Client",
      company: p.clientCompany || "Client Team",
      location: "Remote",
      isVerified: true,
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const user = await getCurrentUser();
  const cookieHeader = request.headers.get("cookie") || "";

  const paramUserId = request.nextUrl.searchParams.get("userId");
  const headerUserId = request.headers.get("x-user-id");
  let effectiveUserId = (paramUserId && paramUserId.trim()) || (headerUserId && headerUserId.trim()) || user?.id;
  const rawCookieToken = request.cookies.get("nexum_session")?.value || "";
  if (!effectiveUserId && (rawCookieToken || cookieHeader)) {
    const rawVal = rawCookieToken || (cookieHeader.match(/nexum_session=([^;]+)/)?.[1] ?? "");
    if (rawVal) {
      try {
        const decoded = decodeURIComponent(rawVal);
        const [payloadEncoded] = decoded.split(".");
        if (payloadEncoded) {
          const raw = Buffer.from(payloadEncoded, "base64url").toString("utf-8");
          const parsed = JSON.parse(raw);
          if (parsed?.userId) {
            effectiveUserId = parsed.userId;
          }
        }
      } catch {}
    }
  }

  const search = request.nextUrl.search;
  const targetUrls = getTargetUrls(`${path}${search}`);

  const originHeader =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    "http://localhost:3000";

  const proxyUserId = effectiveUserId || "usr_freelancer_rohan";

  for (const targetUrl of targetUrls) {
    try {
      const res = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Origin": originHeader,
          "x-nexum-internal": "true",
          "x-user-id": proxyUserId,
          "x-role": "FREELANCER",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        cache: "no-store",
        signal: AbortSignal.timeout(35000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
      console.warn(`[Freelancer Proxy GET] ${targetUrl} returned HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[Freelancer Proxy GET] Fetch failed for ${targetUrl}:`, err);
    }
  }

  // Resilient fallback for freelancer dashboard if backend is sleeping or unreachable
  if (slug[0] === "dashboard") {
    const stored = getAllOpenProjectsFromStore();
    const activeStored = stored.filter((p: any) => (p as any).status === "ACTIVE" || (p as any).status === "IN_PROGRESS");
    const activeItems = (activeStored.length > 0 ? activeStored : stored.slice(0, 2)).map((p: any, i) => ({
      id: p.id,
      title: p.title || (p as any).name || "TechKart – E-commerce Website",
      client: { id: p.clientId || "usr_client", name: (p as any).clientName || "Alex Chen" },
      status: "ACTIVE",
      agreementId: `agr_${p.id || i}`,
      milestonesTotal: 3,
      milestonesAccepted: 1,
    }));

    return NextResponse.json({
      success: true,
      activeProjects: {
        count: Math.max(1, activeItems.length),
        items: activeItems,
      },
      allProposals: {
        count: 2,
        byStatus: { ACCEPTED: 1, SUBMITTED: 1 },
      },
      milestonesDueSoon: { count: 1, items: [] },
      overdue: { count: 0, items: [] },
      awaitingClientReview: { count: 1, items: [] },
      earningsSnapshot: {
        availableMinor: 200000,
        fundedMinor: 400000,
        inReviewMinor: 0,
        withdrawnMinor: 0,
        onHoldMinor: 0,
        currency: "USD",
        demoRate: "$65/hr",
      },
      needsYourReply: { count: 1, items: [] },
      recommendedProjects: stored.slice(0, 3).map((p: any) => ({
        id: p.id,
        title: p.title || (p as any).name,
        budget: p.totalBudget || "$4,500.00 USD",
        clientName: (p as any).clientName || "Horizon Commerce",
        reason: "Matches your top skill: Next.js & Payment Systems",
        category: p.category || "Web Development",
      })),
      recentProposals: [
        {
          id: "prop_techkart_1",
          title: "TechKart – E-commerce Website",
          clientName: "Alex Chen",
          status: "ACCEPTED",
          amountDisplay: "$10,000 USD",
          timeAgo: "Recently",
        },
      ],
      profileCompleteness: {
        score: 92,
        nextAction: "Add portfolio project",
        missingItems: ["Portfolio project"],
      },
      recentActivity: [
        {
          id: "act_1",
          action: "MILESTONE_ACCEPTED_AND_RELEASED",
          entityType: "MILESTONE",
          entityId: "mls_techkart_1",
          timestamp: new Date().toISOString(),
        },
      ],
      monthlyEarnings: [
        { month: "Jun", shortMonth: "Jun 2026", completed: 0, pending: 0, label: "$0" },
        { month: "Jul", shortMonth: "Jul 2026", completed: 0, pending: 0, label: "$0" },
        { month: "Aug", shortMonth: "Aug 2026", completed: 1500, pending: 0, label: "$1,500" },
        { month: "Sep", shortMonth: "Sep 2026", completed: 2500, pending: 0, label: "$2,500" },
        { month: "Oct", shortMonth: "Oct 2026", completed: 3000, pending: 1500, label: "$4,500" },
        { month: "Nov", shortMonth: "Nov 2026", completed: 2000, pending: 4000, label: "$6,000" },
      ],
    });
  }

  // Fallback for project discovery if backend is offline or returning empty
  if (slug[0] === "projects" && (slug[1] === "search" || slug.length === 1)) {
    const stored = getAllOpenProjectsFromStore();
    const mapped = stored.map(mapStoredProjectToOpportunity);
    return NextResponse.json({
      success: true,
      projects: mapped,
      items: mapped,
      pagination: {
        page: 1,
        limit: mapped.length,
        pageSize: mapped.length,
        total: mapped.length,
        totalPages: 1,
      },
    });
  }

  // Fallback for saved projects if backend is offline
  if (slug[0] === "projects" && slug[1] === "saved") {
    return NextResponse.json({
      success: true,
      savedProjects: [],
      total: 0,
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: "Freelancer service temporarily unavailable",
    },
    { status: 502 }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const user = await getCurrentUser();
  const targetUrls = getTargetUrls(path);

  const cookieHeader = request.headers.get("cookie") || "";
  const paramUserId = request.nextUrl.searchParams.get("userId");
  const headerUserId = request.headers.get("x-user-id");
  let effectiveUserId = (paramUserId && paramUserId.trim()) || (headerUserId && headerUserId.trim()) || user?.id;
  const rawCookieToken = request.cookies.get("nexum_session")?.value || "";
  if (!effectiveUserId && (rawCookieToken || cookieHeader)) {
    const rawVal = rawCookieToken || (cookieHeader.match(/nexum_session=([^;]+)/)?.[1] ?? "");
    if (rawVal) {
      try {
        const decoded = decodeURIComponent(rawVal);
        const [payloadEncoded] = decoded.split(".");
        if (payloadEncoded) {
          const raw = Buffer.from(payloadEncoded, "base64url").toString("utf-8");
          const parsed = JSON.parse(raw);
          if (parsed?.userId) {
            effectiveUserId = parsed.userId;
          }
        }
      } catch {}
    }
  }
  const originHeader =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    "http://localhost:3000";

  let lastStatus = 502;
  let lastData: any = { success: false, error: "Backend service temporarily unavailable" };

  try {
    const contentType = request.headers.get("content-type") || "";
    let forwardBody: any;
    const forwardHeaders: Record<string, string> = {
      Origin: originHeader,
      "x-nexum-internal": "true",
      ...(effectiveUserId ? { "x-user-id": effectiveUserId } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    };

    if (contentType.includes("multipart/form-data")) {
      forwardBody = await request.formData();
    } else {
      const body = await request.json().catch(() => ({}));
      forwardBody = JSON.stringify(body);
      forwardHeaders["Content-Type"] = "application/json";
    }

    for (const targetUrl of targetUrls) {
      try {
        const res = await fetch(targetUrl, {
          method: "POST",
          headers: forwardHeaders,
          body: forwardBody,
          cache: "no-store",
          signal: AbortSignal.timeout(35000),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok || res.status < 500) {
          return NextResponse.json(data, { status: res.status });
        }
        lastStatus = res.status;
        lastData = data;
      } catch (err) {
        console.warn(`[Freelancer Proxy POST] Fetch failed for ${targetUrl}:`, err);
      }
    }
    return NextResponse.json(lastData, { status: lastStatus });
  } catch (err) {
    console.error(`[Freelancer Proxy POST] Error:`, err);
    return NextResponse.json(lastData, { status: lastStatus });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const user = await getCurrentUser();
  const targetUrls = getTargetUrls(path);

  const cookieHeader = request.headers.get("cookie") || "";
  const paramUserId = request.nextUrl.searchParams.get("userId");
  const headerUserId = request.headers.get("x-user-id");
  let effectiveUserId = (paramUserId && paramUserId.trim()) || (headerUserId && headerUserId.trim()) || user?.id;
  const rawCookieToken = request.cookies.get("nexum_session")?.value || "";
  if (!effectiveUserId && (rawCookieToken || cookieHeader)) {
    const rawVal = rawCookieToken || (cookieHeader.match(/nexum_session=([^;]+)/)?.[1] ?? "");
    if (rawVal) {
      try {
        const decoded = decodeURIComponent(rawVal);
        const [payloadEncoded] = decoded.split(".");
        if (payloadEncoded) {
          const raw = Buffer.from(payloadEncoded, "base64url").toString("utf-8");
          const parsed = JSON.parse(raw);
          if (parsed?.userId) {
            effectiveUserId = parsed.userId;
          }
        }
      } catch {}
    }
  }

  const originHeader =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    "http://localhost:3000";

  try {
    const body = await request.json().catch(() => ({}));
    for (const targetUrl of targetUrls) {
      try {
        const res = await fetch(targetUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Origin: originHeader,
            "x-nexum-internal": "true",
            ...(effectiveUserId ? { "x-user-id": effectiveUserId } : {}),
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
          body: JSON.stringify(body),
          cache: "no-store",
          signal: AbortSignal.timeout(35000),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok || res.status < 500) {
          return NextResponse.json(data, { status: res.status });
        }
      } catch (err) {
        console.warn(`[Freelancer Proxy PUT] Failed for ${targetUrl}:`, err);
      }
    }
    return NextResponse.json(
      { success: false, error: "Backend service temporarily unavailable" },
      { status: 502 }
    );
  } catch (err) {
    console.error(`[Freelancer Proxy PUT] Error:`, err);
    return NextResponse.json(
      { success: false, error: "Backend service temporarily unavailable" },
      { status: 502 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const user = await getCurrentUser();
  const targetUrls = getTargetUrls(path);

  const cookieHeader = request.headers.get("cookie") || "";
  const paramUserId = request.nextUrl.searchParams.get("userId");
  const headerUserId = request.headers.get("x-user-id");
  let effectiveUserId = (paramUserId && paramUserId.trim()) || (headerUserId && headerUserId.trim()) || user?.id;
  const rawCookieToken = request.cookies.get("nexum_session")?.value || "";
  if (!effectiveUserId && (rawCookieToken || cookieHeader)) {
    const rawVal = rawCookieToken || (cookieHeader.match(/nexum_session=([^;]+)/)?.[1] ?? "");
    if (rawVal) {
      try {
        const decoded = decodeURIComponent(rawVal);
        const [payloadEncoded] = decoded.split(".");
        if (payloadEncoded) {
          const raw = Buffer.from(payloadEncoded, "base64url").toString("utf-8");
          const parsed = JSON.parse(raw);
          if (parsed?.userId) {
            effectiveUserId = parsed.userId;
          }
        }
      } catch {}
    }
  }

  const originHeader =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    "http://localhost:3000";

  try {
    const body = await request.json().catch(() => ({}));
    for (const targetUrl of targetUrls) {
      try {
        const res = await fetch(targetUrl, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Origin: originHeader,
            "x-nexum-internal": "true",
            ...(effectiveUserId ? { "x-user-id": effectiveUserId } : {}),
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
          body: JSON.stringify(body),
          cache: "no-store",
          signal: AbortSignal.timeout(35000),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok || res.status < 500) {
          return NextResponse.json(data, { status: res.status });
        }
      } catch (err) {
        console.warn(`[Freelancer Proxy PATCH] Failed for ${targetUrl}:`, err);
      }
    }
    return NextResponse.json(
      { success: false, error: "Backend service temporarily unavailable" },
      { status: 502 }
    );
  } catch (err) {
    console.error(`[Freelancer Proxy PATCH] Error:`, err);
    return NextResponse.json(
      { success: false, error: "Backend service temporarily unavailable" },
      { status: 502 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const user = await getCurrentUser();
  const search = request.nextUrl.search;
  const targetUrls = getTargetUrls(`${path}${search}`);

  const cookieHeader = request.headers.get("cookie") || "";
  const paramUserId = request.nextUrl.searchParams.get("userId");
  const headerUserId = request.headers.get("x-user-id");
  let effectiveUserId = (paramUserId && paramUserId.trim()) || (headerUserId && headerUserId.trim()) || user?.id;
  const rawCookieToken = request.cookies.get("nexum_session")?.value || "";
  if (!effectiveUserId && (rawCookieToken || cookieHeader)) {
    const rawVal = rawCookieToken || (cookieHeader.match(/nexum_session=([^;]+)/)?.[1] ?? "");
    if (rawVal) {
      try {
        const decoded = decodeURIComponent(rawVal);
        const [payloadEncoded] = decoded.split(".");
        if (payloadEncoded) {
          const raw = Buffer.from(payloadEncoded, "base64url").toString("utf-8");
          const parsed = JSON.parse(raw);
          if (parsed?.userId) {
            effectiveUserId = parsed.userId;
          }
        }
      } catch {}
    }
  }

  const originHeader =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    "http://localhost:3000";

  try {
    for (const targetUrl of targetUrls) {
      try {
        const res = await fetch(targetUrl, {
          method: "DELETE",
          headers: {
            Origin: originHeader,
            "x-nexum-internal": "true",
            ...(effectiveUserId ? { "x-user-id": effectiveUserId } : {}),
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
          cache: "no-store",
          signal: AbortSignal.timeout(35000),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok || res.status < 500) {
          return NextResponse.json(data, { status: res.status });
        }
      } catch (err) {
        console.warn(`[Freelancer Proxy DELETE] Failed for ${targetUrl}:`, err);
      }
    }
    return NextResponse.json(
      { success: false, error: "Backend service temporarily unavailable" },
      { status: 502 }
    );
  } catch (err) {
    console.error(`[Freelancer Proxy DELETE] Error:`, err);
    return NextResponse.json(
      { success: false, error: "Backend service temporarily unavailable" },
      { status: 502 }
    );
  }
}

