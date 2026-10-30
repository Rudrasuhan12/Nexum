import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { hashPassword, verifyPassword } from "../lib/auth.js";
import { parseResumeText } from "../lib/resumeParser.js";

const router = Router();

// POST /api/auth/signup - Complete multi-step user registration
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      role,
      name,
      preferences,
      profileType,
      skills,
      workExperience,
      title,
      bio,
    } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "A valid email address is required." });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: "Password must be at least 4 characters." });
    }

    if (!role || (role !== "CLIENT" && role !== "FREELANCER")) {
      return res.status(400).json({ success: false, error: "Role must be either CLIENT or FREELANCER." });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Full name is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `An account with email "${normalizedEmail}" already exists. Please sign in instead.`,
      });
    }

    const passwordHash = hashPassword(password);

    // Create user in Neon DB
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        role: role,
        passwordHash,
        preferences: preferences || [],
        status: "ACTIVE",
        ...(role === "FREELANCER"
          ? {
              freelancerProfile: {
                create: {
                  title: title || `${skills?.[0] || "Software"} Specialist`,
                  bio: bio || workExperience || "Independent specialist on the Nexum protocol.",
                  skills: Array.isArray(skills) && skills.length > 0 ? skills : ["Web development"],
                  profileType: profileType || "Freelancer",
                  workExperience: workExperience || "",
                  availability: "AVAILABLE",
                  isDemoData: false,
                },
              },
            }
          : {}),
      },
      include: {
        freelancerProfile: true,
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        actorId: user.id,
        action: "USER_SIGNED_UP",
        objectType: "USER",
        objectId: user.id,
        metadata: { role: user.role, registeredAt: new Date().toISOString() },
      },
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: `Account created successfully as ${user.role}`,
    });
  } catch (err: unknown) {
    console.error("Signup error:", err);
    const msg = err instanceof Error ? err.message : "Internal signup error";
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/auth/login - Database credentials verification
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: "Email address is required." });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: "Password must be at least 4 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query Neon DB for user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { freelancerProfile: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: `No account found for "${normalizedEmail}". Please sign up first.`,
      });
    }

    // Verify password:
    // If passwordHash exists, verify with scrypt; otherwise allow demo accounts with demo1234
    let passwordValid = false;
    if (user.passwordHash) {
      passwordValid = verifyPassword(password, user.passwordHash);
    } else {
      // Demo seeded accounts allow demo password
      passwordValid = password === "demo1234" || password === "password";
    }

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password. Please try again.",
      });
    }

    // Record audit log
    await prisma.auditEvent.create({
      data: {
        actorId: user.id,
        action: "USER_LOGGED_IN",
        objectType: "USER",
        objectId: user.id,
        metadata: { role: user.role, timestamp: new Date().toISOString() },
      },
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: `Logged in as ${user.name} (${user.role})`,
    });
  } catch (err: unknown) {
    console.error("Login error:", err);
    const msg = err instanceof Error ? err.message : "Internal authentication error";
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/auth/parse-resume - Intelligent PDF / text extraction
router.post("/parse-resume", async (req: Request, res: Response) => {
  try {
    const { rawText, fileName } = req.body;

    const textToParse =
      rawText ||
      `Elena Rostova\nelena.rostova@example.com\nSenior Full-Stack & Payment Systems Architect\nExperience:\n10+ years architecting zero-trust fintech solutions, high-throughput distributed state machines, React, Next.js, TypeScript, Node.js, and PayPal integrations.`;

    const parsed = parseResumeText(textToParse, fileName);

    res.json({
      success: true,
      data: parsed,
      fileName: fileName || "resume.pdf",
    });
  } catch (err: unknown) {
    console.error("Parse resume error:", err);
    res.status(500).json({ success: false, error: "Failed to parse resume" });
  }
});

export default router;

