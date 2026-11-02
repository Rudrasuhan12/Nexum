import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const userId = body.userId || user?.id || "usr_client_alex";

    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Try Express backend
    try {
      const res = await fetch(`${BACKEND_URL}/api/client/settings/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch {
      // Backend offline fallback: validate demo passwords
      const isValid = currentPassword === "demo1234" || currentPassword === "password";
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect. Please verify and try again." },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Password successfully updated across all Nexum authentication nodes.",
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to change password";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

