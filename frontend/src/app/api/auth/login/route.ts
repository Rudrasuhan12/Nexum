import { NextRequest, NextResponse } from "next/server";
import { setSession, UserRole, DemoUser } from "../../../../lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function POST(request: Request | NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    if (!email || typeof email !== "string" || email.trim() === "") {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length === 0) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters." },
        { status: 400 }
      );
    }

    // Call Express authentication backend (Argon2id + database sessions)
    let backendRes: Response;
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: request.headers.get("origin") || "http://localhost:3000",
          Referer: request.headers.get("referer") || request.url,
          "x-nexum-internal": "true",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch (networkErr) {
      console.error("Backend login connection failure:", networkErr);
      return NextResponse.json(
        { error: "Authentication service is currently unavailable. Please try again later." },
        { status: 503 }
      );
    }

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      const message =
        errorData.error?.message ||
        errorData.error ||
        (backendRes.status === 401
          ? "Invalid email or password."
          : `Authentication failed (HTTP ${backendRes.status})`);

      return NextResponse.json(
        { error: message },
        { status: backendRes.status }
      );
    }

    const backendData = await backendRes.json();
    if (!backendData.success || !backendData.user) {
      return NextResponse.json(
        { error: "Invalid response from authentication backend." },
        { status: 502 }
      );
    }

    const user = backendData.user;
    const loggedInUser: DemoUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      avatar:
        user.role === "CLIENT"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces",
      title:
        user.title ||
        (user.role === "CLIENT" ? "Verified Client" : "Verified Freelancer"),
      companyOrHandle:
        user.companyOrHandle ||
        (user.role === "CLIENT"
          ? "Nexum Client"
          : `@${user.name?.toLowerCase().replace(/\s+/g, "_") || "freelancer"}`),
      location: user.location || "Remote",
      timezone: user.timezone || "UTC",
      statusBadge:
        user.statusBadge ||
        (user.role === "CLIENT" ? "Verified Buyer" : "Verified Freelancer"),
      summary:
        user.summary ||
        (user.role === "CLIENT"
          ? "Managing freelance projects with milestone escrow proof."
          : "Full-stack freelancer delivering verified milestones."),
      canLogin: true,
      isDemoData: false,
    };

    // Issue signed Next.js session cookie
    await setSession(loggedInUser);

    const response = NextResponse.json({
      success: true,
      user: loggedInUser,
      message: `Signed in as ${loggedInUser.name} (${loggedInUser.role})`,
    });

    // Forward Set-Cookie header (such as Express sessionId) to client
    const rawSetCookie = backendRes.headers.get("set-cookie");
    if (rawSetCookie) {
      response.headers.set("set-cookie", rawSetCookie);
    }

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal authentication error" },
      { status: 500 }
    );
  }
}
