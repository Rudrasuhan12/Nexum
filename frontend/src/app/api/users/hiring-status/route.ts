import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, updateSessionHiringStatus } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid status value" },
        { status: 400 }
      );
    }

    const updatedUser = await updateSessionHiringStatus(status);
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update hiring status";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

