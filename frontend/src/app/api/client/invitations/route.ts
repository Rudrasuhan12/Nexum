import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { INITIAL_INVITATIONS } from "@/lib/mock-freelancers";
import { getBackendUrl } from "@/lib/backend-url";

const BACKEND_URL = getBackendUrl();

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") || user?.id || "usr_client_alex";

    try {
      const res = await fetch(`${BACKEND_URL}/api/client/invitations?clientId=${clientId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch {
      // Backend offline
    }

    // Default fallback
    const fallback = clientId === "usr_client_alex" ? INITIAL_INVITATIONS : [];
    return NextResponse.json({
      success: true,
      count: fallback.length,
      data: fallback,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

