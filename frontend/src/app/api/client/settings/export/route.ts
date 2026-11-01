import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || user?.id || "usr_client_alex";

    try {
      const res = await fetch(`${BACKEND_URL}/api/client/settings/export?userId=${userId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        return new NextResponse(JSON.stringify(json, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="nexum-export-${userId}.json"`,
          },
        });
      }
    } catch {
      // Offline fallback
    }

    const exportPackage = {
      exportedAt: new Date().toISOString(),
      clientId: userId,
      profile: {
        name: user?.name || "Alex Rivera",
        email: user?.email || "alex.rivera@nexum.demo",
        role: "CLIENT",
        company: user?.companyOrHandle || "Horizon Commerce LLC",
        location: user?.location || "San Francisco, CA, USA",
        timezone: user?.timezone || "America/Los_Angeles (UTC-8)",
      },
      exportScope: "Full Client Account & Consensus Telemetry",
      platform: "Nexum Protocol",
    };

    return new NextResponse(JSON.stringify(exportPackage, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="nexum-export-${userId}.json"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to export account data";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

