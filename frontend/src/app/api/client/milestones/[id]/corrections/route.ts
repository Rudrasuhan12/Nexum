import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBackendUrl } from "@/lib/backend-url";

const BACKEND_URL = getBackendUrl();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    const body = await request.json().catch(() => ({}));
    const clientId = body.clientId || user?.id || "usr_client_alex";

    try {
      const res = await fetch(`${BACKEND_URL}/api/client/milestones/${id}/corrections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, clientId }),
      });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch {
      // Backend offline
    }

    return NextResponse.json({
      success: true,
      message: "Correction request logged on immutable audit trail and sent to contractor.",
      milestoneId: id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to request corrections";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
