import { NextResponse } from "next/server";
import { getCurrentUser, updateSessionPresence, UserPresenceStatus } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

const VALID_STATUSES: UserPresenceStatus[] = [
  "available",
  "busy",
  "away",
  "offline",
];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({
        success: true,
        presence: "offline",
        isGuest: true,
      });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      name: user.name,
      role: user.role,
      presence: user.presenceStatus || "available",
    });
  } catch (error) {
    console.error("Presence GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch presence" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const presence = (body.presence || body.presenceStatus) as UserPresenceStatus;

    if (!presence || !VALID_STATUSES.includes(presence)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid presence. Must be one of [${VALID_STATUSES.join(", ")}]`,
        },
        { status: 400 }
      );
    }

    // Update user session cookie
    const updatedUser = await updateSessionPresence(presence);

    // Forward to Express backend if reachable
    try {
      await fetch(`${BACKEND_URL}/api/users/${user.id}/presence`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presence, role: user.role }),
      }).catch(() => {});
    } catch {
      // Backend proxy optional
    }

    return NextResponse.json({
      success: true,
      presence,
      user: updatedUser,
      message: `Presence updated to ${presence}`,
    });
  } catch (error) {
    console.error("Presence PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update presence" },
      { status: 500 }
    );
  }
}
