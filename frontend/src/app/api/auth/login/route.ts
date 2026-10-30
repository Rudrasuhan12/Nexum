import { NextResponse } from "next/server";
import { DEMO_USERS, setSession, UserRole, DemoUser } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { role, personaKey, email, password } = body as {
      role?: UserRole;
      personaKey?: string;
      email?: string;
      password?: string;
    };

    if (email !== undefined && email.trim() === "") {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    if (password !== undefined && password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters." },
        { status: 400 }
      );
    }

    // 1. Try authenticating with backend API / Neon DB
    if (email && password) {
      try {
        const backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        if (backendRes.ok) {
          const backendData = await backendRes.json();
          if (backendData.success && backendData.user) {
            const loggedInUser: DemoUser = {
              id: backendData.user.id,
              name: backendData.user.name,
              email: backendData.user.email,
              role: backendData.user.role as UserRole,
              avatar:
                backendData.user.role === "CLIENT"
                  ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces"
                  : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces",
              title: backendData.user.role === "CLIENT" ? "Verified Client" : "Verified Freelancer",
              canLogin: true,
            };

            await setSession(loggedInUser);
            return NextResponse.json({
              success: true,
              user: loggedInUser,
              message: `Signed in as ${loggedInUser.name} (${loggedInUser.role})`,
            });
          }
        }
      } catch {
        // Fallback to local demo auth if backend is unreachable
      }
    }

    // 2. Demo Persona / Fallback Auth
    let targetUser = null;
    if (personaKey && DEMO_USERS[personaKey]) {
      targetUser = DEMO_USERS[personaKey];
    } else if (email) {
      targetUser = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    } else if (role) {
      if (role === "CLIENT") {
        targetUser = DEMO_USERS.CLIENT;
      } else if (role === "FREELANCER") {
        targetUser = DEMO_USERS.FREELANCER_A;
      }
    }

    if (!targetUser) {
      return NextResponse.json(
        {
          error: email
            ? `No workspace found for "${email}". Please verify your credentials or create an account.`
            : "Invalid persona or user not found. Select Client or Freelancer.",
        },
        { status: 400 }
      );
    }

    if (!targetUser.canLogin) {
      return NextResponse.json(
        {
          error: `${targetUser.name} is a seeded candidate profile for match discovery and cannot be directly logged into.`,
        },
        { status: 403 }
      );
    }

    await setSession(targetUser);

    return NextResponse.json({
      success: true,
      user: targetUser,
      message: `Signed in as ${targetUser.name} (${targetUser.role})`,
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal authentication error" }, { status: 500 });
  }
}
