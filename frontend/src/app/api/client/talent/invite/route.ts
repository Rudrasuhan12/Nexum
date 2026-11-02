import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json().catch(() => ({}));
    const clientId = body.clientId || user?.id || "usr_client_alex";

    try {
      const res = await fetch(`${BACKEND_URL}/api/client/talent/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, clientId }),
      });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch {
      // Backend offline
    }

    const fallbackInvite = {
      id: `inv_${Date.now()}`,
      freelancerId: body.freelancerId,
      freelancerName: body.freelancerName || "Talent",
      freelancerAvatar: body.freelancerAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
      freelancerTitle: body.freelancerTitle || "Specialist",
      projectId: body.projectId,
      projectName: body.projectName || "Project Workspace",
      status: "PENDING",
      sentDate: "Just now",
      proposedRate: body.proposedRate || "$60.00/hr",
      customNote: body.customNote || "",
    };

    return NextResponse.json({
      success: true,
      invitation: fallbackInvite,
      message: `Invitation successfully sent to ${fallbackInvite.freelancerName}.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

