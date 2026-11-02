import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cookieHeader = request.headers.get("cookie") || "";
    const authHeader = request.headers.get("authorization") || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cookieHeader) headers["cookie"] = cookieHeader;
    if (authHeader) headers["authorization"] = authHeader;

    const res = await fetch(`${BACKEND_URL}/api/notifications/${id}`, {
      method: "PATCH",
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: err.error?.message || "Failed to mark notification as read" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("Notification mark read error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
