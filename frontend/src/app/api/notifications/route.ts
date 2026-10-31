import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { notificationStore } from "@/lib/notifications-data";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role") || user?.role;
    const userIdParam = searchParams.get("userId") || user?.id;

    const data = notificationStore.getForUser(roleParam, userIdParam);
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, type, role, projectName, actionUrl, userId } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "Title and message are required" },
        { status: 400 }
      );
    }

    const created = notificationStore.addNotification({
      title,
      message,
      type: type || "MESSAGE",
      role: role || "CLIENT",
      projectName,
      actionUrl,
      userId,
    });

    return NextResponse.json({
      success: true,
      notification: created,
    });
  } catch (error) {
    console.error("Notifications POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

