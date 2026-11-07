import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, setSession, createSessionToken, AUTH_COOKIE_NAME, UserRole } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { role } = body as { role?: string };

    if (!role || (role !== "CLIENT" && role !== "FREELANCER")) {
      return NextResponse.json(
        { error: "Valid role ('CLIENT' or 'FREELANCER') is required." },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get("cookie") || "";
    const originHeader =
      request.headers.get("origin") || request.nextUrl.origin || "http://localhost:3000";
    const refererHeader = request.headers.get("referer") || request.url;

    const currentUser = await getCurrentUser();
    const userId = currentUser?.id || "";

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
        Origin: originHeader,
        Referer: refererHeader,
        "x-nexum-internal": "true",
        ...(userId ? { "x-user-id": userId } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      const errData = await backendRes.json().catch(() => ({}));

      // Gracefully handle if role is already configured for this user
      if (backendRes.status === 409 || errData?.error?.code === "ROLE_ALREADY_SET") {
        const currentRole = (errData?.error?.details?.currentRole || role) as UserRole;
        const currentUser = await getCurrentUser();
        if (currentUser) {
          currentUser.role = currentRole;
          currentUser.title = currentRole === "CLIENT" ? "Verified Client" : "Verified Freelancer";
          currentUser.statusBadge = currentRole === "CLIENT" ? "Verified Buyer" : "Verified Freelancer";
          await setSession(currentUser);
        }
        return NextResponse.json({
          success: true,
          role: currentRole,
          message: "Role has already been set.",
        });
      }

      return NextResponse.json(
        { error: errData?.error?.message || "Failed to assign role." },
        { status: backendRes.status }
      );
    }

    const backendData = await backendRes.json();

    // Update current Next.js user session
    let updatedToken: string | null = null;
    if (currentUser) {
      currentUser.role = role as UserRole;
      currentUser.title = role === "CLIENT" ? "Verified Client" : "Verified Freelancer";
      currentUser.statusBadge = role === "CLIENT" ? "Verified Buyer" : "Verified Freelancer";
      await setSession(currentUser);
      updatedToken = await createSessionToken(currentUser);
    }

    const response = NextResponse.json({
      success: true,
      role: backendData.user.role,
      user: backendData.user,
    });

    if (updatedToken) {
      response.cookies.set(AUTH_COOKIE_NAME, updatedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    const rawSetCookie = backendRes.headers.get("set-cookie");
    if (rawSetCookie) {
      response.headers.append("set-cookie", rawSetCookie);
    }

    return response;
  } catch (error) {
    console.error("Assign role error:", error);
    return NextResponse.json(
      { error: "Internal role assignment error" },
      { status: 500 }
    );
  }
}

