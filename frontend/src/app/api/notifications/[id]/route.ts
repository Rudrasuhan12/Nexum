import { NextResponse } from "next/server";
import { notificationStore } from "@/lib/notifications-data";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = notificationStore.markAsRead(id);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error("Notification mark read error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const removed = notificationStore.deleteNotification(id);

    return NextResponse.json({
      success: removed,
      message: removed ? "Notification dismissed" : "Notification not found",
    });
  } catch (error) {
    console.error("Notification delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}

