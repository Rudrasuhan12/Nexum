import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    const userId = user?.id || "usr_client_alex";
    const cookieHeader = request.headers.get("cookie") || "";

    const res = await fetch(`${BACKEND_URL}/api/projects/${id}/handover?userId=${userId}&clientId=${userId}`, {
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status || 500 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch handover";
    return NextResponse.json({ error: { code: "HANDOVER_FETCH_ERROR", message: msg } }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    const clientId = user?.id || "usr_client_alex";
    const cookieHeader = request.headers.get("cookie") || "";
    const body = await request.json().catch(() => ({}));

    const res = await fetch(`${BACKEND_URL}/api/projects/${id}/handover/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ ...body, clientId, userId: clientId }),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 201 });
    }

    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status || 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to initiate handover";
    return NextResponse.json({ error: { code: "HANDOVER_INITIATE_ERROR", message: msg } }, { status: 500 });
  }
}

