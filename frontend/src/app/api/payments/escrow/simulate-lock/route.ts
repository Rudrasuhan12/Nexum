import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cookieHeader = request.headers.get("cookie") || "";
    const authHeader = request.headers.get("authorization") || "";
    const originHeader =
      request.headers.get("origin") ||
      request.headers.get("referer") ||
      "http://localhost:3000";

    const res = await fetch(`${BACKEND_URL}/api/payments/escrow/simulate-lock`, {
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
    const msg = err instanceof Error ? err.message : "Failed to lock escrow";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
