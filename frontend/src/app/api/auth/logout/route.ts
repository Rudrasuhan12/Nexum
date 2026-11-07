import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function POST(request: NextRequest) {
  try {
    await clearSession();

    const cookieHeader = request.headers.get("cookie") || "";
    const originHeader =
      request.headers.get("origin") || request.nextUrl.origin || "http://localhost:3000";

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
        Origin: originHeader,
        Referer: request.headers.get("referer") || request.url,
        "x-nexum-internal": "true",
      },
    }).catch(() => null);

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    if (backendRes) {
      const rawSetCookie = backendRes.headers.get("set-cookie");
      if (rawSetCookie) {
        response.headers.set("set-cookie", rawSetCookie);
      }
    }

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
