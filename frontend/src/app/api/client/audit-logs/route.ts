import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.toString();

    // Proxy to Express backend
    try {
      const res = await fetch(`${BACKEND_URL}/api/client/audit-logs?${q}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline
    }

    return NextResponse.json({
      success: true,
      logs: [],
      total: 0,
      page: 1,
      totalPages: 1,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch audit logs";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

