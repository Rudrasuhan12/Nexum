import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CLIENT_MILESTONES } from "@/lib/mock-milestones";
import { getBackendUrl } from "@/lib/backend-url";

const BACKEND_URL = getBackendUrl();

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") || user?.id || "usr_client_alex";

    // Attempt to proxy to Express backend
    try {
      const res = await fetch(`${BACKEND_URL}/api/client/milestones?clientId=${clientId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch {
      // Backend offline / local fallback
    }

    // Fallback: If Alex, return CLIENT_MILESTONES with computed stats
    if (clientId === "usr_client_alex") {
      const upcomingCount = CLIENT_MILESTONES.filter(
        (m) => m.workflowStatus === "UPCOMING" || m.workflowStatus === "IN_PROGRESS"
      ).length;
      const awaitingReviewCount = CLIENT_MILESTONES.filter(
        (m) => m.workflowStatus === "AWAITING_REVIEW"
      ).length;
      const overdueCount = CLIENT_MILESTONES.filter(
        (m) => m.isOverdue || m.workflowStatus === "OVERDUE"
      ).length;
      const completedCount = CLIENT_MILESTONES.filter(
        (m) => m.workflowStatus === "ACCEPTED"
      ).length;

      const projectMap = new Map<string, string>();
      CLIENT_MILESTONES.forEach((m) => {
        if (!projectMap.has(m.projectId)) {
          projectMap.set(m.projectId, m.projectName);
        }
      });
      const distinctProjects = Array.from(projectMap.entries()).map(([id, name]) => ({ id, name }));

      return NextResponse.json({
        success: true,
        count: CLIENT_MILESTONES.length,
        data: CLIENT_MILESTONES,
        stats: {
          upcomingCount,
          awaitingReviewCount,
          overdueCount,
          completedCount,
        },
        distinctProjects,
      });
    }

    // Clean truthful empty state for a new client with 0 milestones
    return NextResponse.json({
      success: true,
      count: 0,
      data: [],
      stats: {
        upcomingCount: 0,
        awaitingReviewCount: 0,
        overdueCount: 0,
        completedCount: 0,
      },
      distinctProjects: [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch milestones";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
