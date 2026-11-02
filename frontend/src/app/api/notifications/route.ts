import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const unread = searchParams.get("unread");
    const query = unread ? `?unread=${unread}` : "";

    const cookieHeader = request.headers.get("cookie") || "";
    const authHeader = request.headers.get("authorization") || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cookieHeader) headers["cookie"] = cookieHeader;
    if (authHeader) headers["authorization"] = authHeader;

    const res = await fetch(`${BACKEND_URL}/api/notifications${query}`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
      });
    }

    const data = await res.json();
    const mapped = (data.notifications || []).map((n: any) => ({
      id: n.id,
      userId: user.id,
      role: user.role,
      type: n.type || "SYSTEM",
      title: n.title,
      message: n.body || n.message || "",
      actionUrl:
        n.linkKind === "PROPOSAL"
          ? (user.role === "FREELANCER" ? "/freelancer/dashboard?tab=proposals" : "/client/dashboard")
          : n.linkKind === "PROJECT" || n.linkKind === "MILESTONE"
          ? (user.role === "FREELANCER" ? "/freelancer/dashboard?tab=projects" : "/client/dashboard?tab=milestones")
          : undefined,
      read: Boolean(n.readAt || n.isRead),
      readAt: n.readAt,
      createdAt: n.createdAt,
    }));

    return NextResponse.json({
      success: true,
      notifications: mapped,
      unreadCount: typeof data.unreadCount === "number" ? data.unreadCount : 0,
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { success: false, notifications: [], unreadCount: 0, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
