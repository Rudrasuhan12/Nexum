import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

const BACKEND_URL = getBackendUrl();

function extractForwardHeaders(request: NextRequest): Record<string, string> {
  const cookieHeader = request.headers.get("cookie") || "";
  const originHeader =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    "http://localhost:3000";
  const userIdHeader = request.headers.get("x-user-id") || "";
  const authHeader = request.headers.get("authorization") || "";

  return {
    Origin: originHeader,
    Referer: originHeader,
    "x-nexum-internal": "true",
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(userIdHeader ? { "x-user-id": userIdHeader } : {}),
    ...(authHeader ? { Authorization: authHeader } : {}),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const url = `${BACKEND_URL}/api/channel3/${path}${request.nextUrl.search}`;

  try {
    const headers = {
      ...extractForwardHeaders(request),
      "Content-Type": "application/json",
    };

    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(errData, { status: res.status });
  } catch (err) {
    console.error(`[Channel3 Proxy GET] Error forwarding to ${url}:`, err);
    return NextResponse.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Channel 3 backend proxy is temporarily unavailable",
          details: null,
        },
      },
      { status: 502 }
    );
  }
}

export const maxDuration = 60;

