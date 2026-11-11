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
  const url = `${BACKEND_URL}/api/workspace/${path}${request.nextUrl.search}`;

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
    console.error(`[Workspace Proxy GET] Error forwarding to ${url}:`, err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Backend workspace service is temporarily unavailable",
          details: null,
        },
      },
      { status: 502 }
    );
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const url = `${BACKEND_URL}/api/workspace/${path}`;

  try {
    const contentType = request.headers.get("content-type") || "";
    const forwardHeaders = extractForwardHeaders(request);
    let body: any;

    if (contentType.includes("multipart/form-data")) {
      // Forward raw multipart stream directly without re-buffering
      forwardHeaders["Content-Type"] = contentType;
      body = request.body;
    } else {
      const json = await request.json().catch(() => ({}));
      body = JSON.stringify(json);
      forwardHeaders["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method: "POST",
      headers: forwardHeaders,
      body,
      // @ts-ignore
      duplex: "half",
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(errData, { status: res.status });
  } catch (err) {
    console.error(`[Workspace Proxy POST] Error forwarding to ${url}:`, err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Backend workspace service is temporarily unavailable",
          details: null,
        },
      },
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
  const url = `${BACKEND_URL}/api/workspace/${path}`;

  try {
    const forwardHeaders = {
      ...extractForwardHeaders(request),
      "Content-Type": "application/json",
    };
    const body = await request.json().catch(() => ({}));
    const res = await fetch(url, {
      method: "PATCH",
      headers: forwardHeaders,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(errData, { status: res.status });
  } catch (err) {
    console.error(`[Workspace Proxy PATCH] Error forwarding to ${url}:`, err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Backend workspace service is temporarily unavailable",
          details: null,
        },
      },
      { status: 502 }
    );
  }
}

