import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

function extractHeaders(request: NextRequest): Record<string, string> {
  const cookieHeader = request.headers.get("cookie") || "";
  const originHeader =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    "http://localhost:3000";
  const userIdHeader = request.headers.get("x-user-id") || "";
  const clientIdHeader = request.headers.get("x-client-id") || "";
  const authHeader = request.headers.get("authorization") || "";

  return {
    Origin: originHeader,
    Referer: originHeader,
    "x-nexum-internal": "true",
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(userIdHeader ? { "x-user-id": userIdHeader } : {}),
    ...(clientIdHeader ? { "x-client-id": clientIdHeader } : {}),
    ...(authHeader ? { Authorization: authHeader } : {}),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const url = `${BACKEND_URL}/api/client/payments/${path}${request.nextUrl.search}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...extractHeaders(request),
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(errData, { status: res.status });
  } catch (err) {
    console.error(`[Client Payments Proxy GET] Error forwarding to ${url}:`, err);
    return NextResponse.json(
      { success: false, error: "Backend payments service is temporarily unavailable" },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const url = `${BACKEND_URL}/api/client/payments/${path}`;

  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...extractHeaders(request),
        "Content-Type": "application/json",
      },
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
    console.error(`[Client Payments Proxy POST] Error forwarding to ${url}:`, err);
    return NextResponse.json(
      { success: false, error: "Backend payments service is temporarily unavailable" },
      { status: 502 }
    );
  }
}

