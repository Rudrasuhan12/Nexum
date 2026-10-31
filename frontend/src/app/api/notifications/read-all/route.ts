import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { notificationStore } from "@/lib/notifications-data";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json().catch(() => ({}));
    const role = body.role || user?.role;
    const userId = body.userId || user?.id;

    const count = notificationStore.markAllAsRead(role, userId);

    return NextResponse.json({
      success: true,
      markedCount: count,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}

