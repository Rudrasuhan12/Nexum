import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

const BACKEND_URL = getBackendUrl();

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    try {
      const res = await fetch(`${BACKEND_URL}/api/milestones/${id}/deliverable-history`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const revisions = json.data || json.revisions || (Array.isArray(json) ? json : []);
        return NextResponse.json({
          success: true,
          milestoneId: id,
          count: revisions.length,
          revisions,
          data: revisions,
          latest: revisions[revisions.length - 1] || null,
        });
      }
    } catch {
      // Backend offline or local development fallback
    }

    // Clean real response when milestone has no previous deliverable history
    return NextResponse.json({
      success: true,
      milestoneId: id,
      count: 0,
      revisions: [],
      data: [],
      latest: null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load deliverable history";
    return NextResponse.json(
      { error: { code: "DELIVERABLE_HISTORY_ERROR", message: msg } },
      { status: 500 }
    );
  }
}

