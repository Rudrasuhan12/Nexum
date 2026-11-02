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
    let backendRes: Response;
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/auth/signup`, {
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
          title,
        }),
      });
    } catch (backendErr) {
      console.error("Backend connection failed during signup:", backendErr);
      return NextResponse.json(
        { error: "Authentication service is currently unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const backendData = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      const errorMsg =
        backendData.error?.message ||
        backendData.error ||
        "Failed to create account in database.";
      return NextResponse.json({ error: errorMsg }, { status: backendRes.status });
    }

    if (!backendData.user) {
      return NextResponse.json(
        { error: "Invalid response from authentication backend." },
        { status: 502 }
      );
    }

    const userPayload: DemoUser = {
      id: backendData.user.id,
      name: backendData.user.name,
      email: backendData.user.email,
      role: backendData.user.role as UserRole,
      avatar:
        role === "CLIENT"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces",
      title: title || (role === "CLIENT" ? "Client / Buyer" : `${skills?.[0] || "Software"} Specialist`),
      companyOrHandle: role === "CLIENT" ? "Nexum Client" : `@${name.trim().toLowerCase().replace(/\s+/g, "_")}`,
      location: "Remote",
      timezone: "UTC",
      statusBadge: role === "CLIENT" ? "Verified Buyer" : "Verified Freelancer",
      summary: role === "CLIENT" ? "Managing freelance projects on Nexum." : "Freelance professional delivering milestone-proven software.",
      canLogin: true,
      isDemoData: false,
    };

    // Set signed session cookie ONLY upon verified database account creation
    await setSession(userPayload);

    const response = NextResponse.json({
      success: true,
      user: userPayload,
      message: `Account created successfully. Welcome, ${userPayload.name}!`,
    });

    const rawSetCookie = backendRes.headers.get("set-cookie");
    if (rawSetCookie) {
      response.headers.set("set-cookie", rawSetCookie);
    }

    return response;
  } catch (error) {
    console.error("Signup route error:", error);
    return NextResponse.json({ error: "Internal server error during registration." }, { status: 500 });
  }
}
