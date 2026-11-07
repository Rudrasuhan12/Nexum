import { NextRequest, NextResponse } from "next/server";
import { setSession, createSessionToken, UserRole, DemoUser, AUTH_COOKIE_NAME } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const simulated = searchParams.get("simulated");
  const oauthError = searchParams.get("error");

  const baseUrl = request.nextUrl.origin;

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(oauthError)}`, baseUrl)
    );
  }

  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const originHeader =
      request.headers.get("origin") || request.nextUrl.origin || "http://localhost:3000";

    const backendRes = await fetch(`${BACKEND_URL}/api/auth/google/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
        Origin: originHeader,
        Referer: request.headers.get("referer") || request.url,
        "x-nexum-internal": "true",
      },
      body: JSON.stringify({
        code: code || undefined,
        state: state || undefined,
        simulated: simulated === "true",
      }),
    });

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      const msg = errorData?.error?.message || "Google authentication failed";
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(msg)}`, baseUrl)
      );
    }

    const data = await backendRes.json();
    const user = data.user;

    // IMPORTANT: Do NOT default role to "CLIENT" here.
    // If role is null, the user must go through /choose-role first.
    // We store null and let the redirect below send them to choose-role.
    const loggedInUser: DemoUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (user.role as UserRole) ?? null,
      avatar:
        user.avatarUrl ||
        (user.role === "FREELANCER"
          ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces"
          : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces"),
      title:
        user.role === "FREELANCER"
          ? "Verified Freelancer"
          : user.role === "CLIENT"
          ? "Verified Client"
          : "New Member",
      companyOrHandle: `@${user.name?.toLowerCase().replace(/\s+/g, "_") || "user"}`,
      location: "Remote",
      timezone: "UTC",
      statusBadge:
        user.role === "FREELANCER"
          ? "Verified Talent"
          : user.role === "CLIENT"
          ? "Verified Buyer"
          : "Pending Role",
      summary: "Authenticated securely via Google OAuth 2.0.",
      canLogin: true,
      isDemoData: false,
    };

    // Issue signed Next.js session cookie
    const sessionToken = await createSessionToken(loggedInUser);
    await setSession(loggedInUser);

    // Determine target redirect — null role ALWAYS goes to /choose-role
    const targetPath =
      data.requiresRole || !user.role
        ? "/choose-role"
        : user.role === "FREELANCER"
        ? "/freelancer/dashboard"
        : "/client/dashboard";

    const response = NextResponse.redirect(new URL(targetPath, baseUrl));

    // Ensure session cookie is stamped on response
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    // Forward Set-Cookie headers from Express (PostgreSQL session) if present
    const rawSetCookie = backendRes.headers.get("set-cookie");
    if (rawSetCookie) {
      // Append Express session cookie without wiping Next.js auth cookie
      response.headers.append("set-cookie", rawSetCookie);
    }

    return response;
  } catch (err) {
    console.error("Google callback handling failure:", err);
    return NextResponse.redirect(
      new URL("/login?error=google_callback_failed", baseUrl)
    );
  }
}
