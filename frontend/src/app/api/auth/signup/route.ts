import { NextResponse } from "next/server";
import { setSession, DemoUser, UserRole } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      email,
      password,
      role,
      name,
      preferences,
      skills,
      profileType,
      workExperience,
      title,
    } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    if (!password || password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters." }, { status: 400 });
    }

    if (!role || (role !== "CLIENT" && role !== "FREELANCER")) {
      return NextResponse.json({ error: "Role must be either CLIENT or FREELANCER." }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    // Call backend API / Neon DB
    let userPayload: DemoUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role as UserRole,
      avatar:
        role === "CLIENT"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces",
      title: title || (role === "CLIENT" ? "Client / Buyer" : `${skills?.[0] || "Software"} Specialist`),
      canLogin: true,
    };

    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          role,
          name: name.trim(),
          preferences: preferences || [],
          skills: skills || [],
          profileType,
          workExperience,
          title: userPayload.title,
        }),
      });

      const backendData = await backendRes.json();
      if (!backendRes.ok) {
        return NextResponse.json(
          { error: backendData.error || "Failed to create account in database." },
          { status: backendRes.status }
        );
      }

      if (backendData.user) {
        userPayload = {
          ...userPayload,
          id: backendData.user.id,
          name: backendData.user.name,
          email: backendData.user.email,
          role: backendData.user.role,
        };
      }
    } catch (backendErr) {
      console.warn("Backend connection failed during signup; using session state:", backendErr);
    }

    // Set signed session cookie
    await setSession(userPayload);

    return NextResponse.json({
      success: true,
      user: userPayload,
      message: `Account created successfully. Welcome, ${userPayload.name}!`,
    });
  } catch (error) {
    console.error("Signup route error:", error);
    return NextResponse.json({ error: "Internal server error during registration." }, { status: 500 });
  }
}

