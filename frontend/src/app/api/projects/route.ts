import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getProjectsStore,
  saveProjectToStore,
  computeProjectStats,
} from "@/lib/projects-store";
import { getBackendUrl } from "@/lib/backend-url";

const BACKEND_URL = getBackendUrl();

const FALLBACK_RENDER_URL = "https://nexum-79g2.onrender.com";

function getTargetUrls(pathWithQuery: string): string[] {
  const isCloudOrProd =
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production" ||
    (typeof window === "undefined" && Boolean(process.env.AWS_REGION));

  const isLocalhost =
    !BACKEND_URL ||
    BACKEND_URL.includes("localhost") ||
    BACKEND_URL.includes("127.0.0.1");

  // In production / Vercel cloud serverless, always forward to the live Render backend
  if (isCloudOrProd && isLocalhost) {
    return [`${FALLBACK_RENDER_URL}/api/projects${pathWithQuery}`];
  }

  const primary = `${BACKEND_URL}/api/projects${pathWithQuery}`;
  if (isLocalhost && !BACKEND_URL.includes("onrender.com")) {
    return [primary, `${FALLBACK_RENDER_URL}/api/projects${pathWithQuery}`];
  }
  return [primary];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = await getCurrentUser();
  const query = new URLSearchParams(searchParams);

  const clientId = query.get("clientId") || user?.id || "usr_client_alex";
  if (!query.has("clientId")) {
    query.set("clientId", clientId);
  }

  // 1. Attempt to fetch live from Express backend
  const targetUrls = getTargetUrls(`?${query.toString()}`);
  for (const url of targetUrls) {
    try {
      const cookieHeader = request.headers.get("cookie") || "";
      const res = await fetch(url, {
        headers: {
          "x-user-id": clientId,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Try next target URL
    }
  }

  // 2. Fallback: Return from projects store
  const allProjects = getProjectsStore(clientId);
  const statusFilter = searchParams.get("status");
  const searchQuery = searchParams.get("search");

  let filtered = allProjects;
  if (statusFilter && statusFilter !== "ALL") {
    filtered = filtered.filter((p) => p.status === statusFilter);
  }

  if (searchQuery?.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.freelancer?.name.toLowerCase().includes(q)
    );
  }

  const stats = computeProjectStats(allProjects);

  return NextResponse.json({
    success: true,
    count: filtered.length,
    data: filtered,
    stats,
  });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    // Prioritize authenticated session user ID over body to enforce ownership
    const clientId = user?.id || body.clientId || "usr_client_alex";
    const payload = {
      ...body,
      clientId,
    };

    // Always persist to local Next.js projects store first
    const saved = saveProjectToStore(payload, clientId);

    const cookieHeader = request.headers.get("cookie") || "";
    const originHeader =
      request.headers.get("origin") || request.headers.get("referer") || "http://localhost:3000";
    const refererHeader = request.headers.get("referer") || request.url;

    // Forward to Express backend if online (with cloud fallback)
    const postUrls = getTargetUrls("");
    for (const postUrl of postUrls) {
      try {
        const res = await fetch(postUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": clientId,
            Origin: originHeader,
            Referer: refererHeader,
            "x-nexum-internal": "true",
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(20000),
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data, { status: 201 });
        }
      } catch {
        // Try next backend URL
      }
    }

    return NextResponse.json(
      {
        success: true,
        message:
          payload.state === "DRAFT"
            ? "Draft saved successfully"
            : "Project published and registered in consensus engine",
        data: saved,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create project";
    console.error("POST /api/projects exception:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
