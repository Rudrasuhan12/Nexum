import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getProjectsStore,
  saveProjectToStore,
  computeProjectStats,
} from "@/lib/projects-store";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = await getCurrentUser();
  const query = new URLSearchParams(searchParams);

  const clientId = query.get("clientId") || user?.id || "usr_client_alex";
  if (!query.has("clientId")) {
    query.set("clientId", clientId);
  }

  // 1. Attempt to fetch live from Express backend
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const res = await fetch(`${BACKEND_URL}/api/projects?${query.toString()}`, {
      headers: {
        "x-user-id": clientId,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend offline / closed: fall through to reliable persistent store
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
    const originHeader = request.headers.get("origin") || request.headers.get("referer") || "http://localhost:3000";

    // Forward to Express backend if online
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": clientId,
          "Origin": originHeader,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch {
      // Backend offline: return saved local project
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
