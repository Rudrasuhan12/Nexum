import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

const BACKEND_URL = getBackendUrl();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const cookieHeader = request.headers.get("cookie") || "";
    const authHeader = request.headers.get("authorization") || "";
    const originHeader =
      request.headers.get("origin") ||
      request.headers.get("referer") ||
      "https://nexum-six-swart.vercel.app";

    const res = await fetch(`${BACKEND_URL}/api/agreements/${id}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": originHeader,
        "Referer": originHeader,
        "x-nexum-internal": "true",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to approve agreement";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

