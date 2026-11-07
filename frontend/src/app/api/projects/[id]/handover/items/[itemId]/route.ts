import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await context.params;
    const user = await getCurrentUser();
    const userId = user?.id || "usr_client_alex";
    const cookieHeader = request.headers.get("cookie") || "";
    const body = await request.json().catch(() => ({}));

    // If body contains decision, this is a review call (by client)
    const isReview = typeof body.decision === "string";
    const endpoint = isReview
      ? `${BACKEND_URL}/api/projects/${id}/handover/items/${itemId}/review`
      : `${BACKEND_URL}/api/projects/${id}/handover/items/${itemId}/submit`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ ...body, userId, clientId: userId, freelancerId: userId }),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status || 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process handover item";
    return NextResponse.json({ error: { code: "HANDOVER_ITEM_ERROR", message: msg } }, { status: 500 });
  }
}

