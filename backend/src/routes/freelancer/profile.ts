import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.js";
import { requireAuth, requireRole, requireOnboarded } from "../../middleware/auth.js";
import { Role } from "@prisma/client";
import {
  ValidationError,
  NotFoundError,
} from "../../lib/errors.js";
import { appendAuditEvent } from "../../lib/audit.js";
import { calculateProfileCompleteness } from "../../lib/profileCompleteness.js";
import { toPublicProfile } from "../../lib/publicSerializer.js";

const router = Router();

// Enforce Auth, FREELANCER role, and Onboarding status
router.use(requireAuth);
router.use(requireRole(Role.FREELANCER));
router.use(requireOnboarded);

// Timezone validation helper
function isValidIANATimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// HTTPS URL Validator
const httpsUrlSchema = z
  .string()
  .max(2048, "URL must not exceed 2048 characters")
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const u = new URL(val);
        return u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "URL must use https:// protocol only" }
  );

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const basicProfileSchema = z.object({
  professionalTitle: z.string().min(1).max(100).optional(),
  headline: z.string().min(1).max(160).optional(),
  locationText: z.string().min(1).max(100).optional(),
  countryCode: z.string().length(2).nullable().optional(),
  timezone: z
    .string()
    .refine((val) => isValidIANATimezone(val), {
      message: "Invalid IANA timezone name",
    })
    .optional(),
  bio: z.string().max(2000, "Bio must not exceed 2000 characters").optional(),
  photoFileId: z.string().nullable().optional(),
  coverFileId: z.string().nullable().optional(),
});

const professionalSchema = z.object({
  specialization: z.string().max(100).optional(),
  servicesOffered: z.array(z.string().max(40)).max(30).optional(),
  preferredProjectTypes: z.array(z.string().max(40)).max(30).optional(),
  tools: z.array(z.string().max(40)).max(30).optional(),
  experienceLevel: z.enum(["BEGINNER", "JUNIOR", "MID", "SENIOR", "EXPERT"]).nullable().optional(),
});

const skillsSchema = z.object({
  skills: z
    .array(
      z.object({
        skillName: z.string().min(1).max(40),
        proficiency: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).nullable().optional(),
      })
    )
    .min(1, "At least one skill must remain")
    .max(50),
});

const currentYear = new Date().getFullYear();

const experienceBaseSchema = z.object({
  company: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  location: z.string().max(100).optional(),
  startMonth: z.string().regex(monthRegex, "startMonth must be in YYYY-MM format"),
  endMonth: z.string().regex(monthRegex, "endMonth must be in YYYY-MM format").nullable().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(2000).optional(),
  responsibilities: z.array(z.string().max(300)).max(20).optional(),
  achievements: z.array(z.string().max(300)).max(20).optional(),
});

const experienceSchema = experienceBaseSchema
  .refine(
    (d) => {
      if (d.isCurrent) return d.endMonth === null || d.endMonth === undefined;
      return true;
    },
    { message: "A current position must have a null endMonth" }
  )
  .refine(
    (d) => {
      if (!d.isCurrent && d.endMonth && d.startMonth) {
        return d.endMonth >= d.startMonth;
      }
      return true;
    },
    { message: "endMonth cannot be earlier than startMonth" }
  );

const experienceUpdateSchema = experienceBaseSchema.partial().refine(
  (d) => {
    if (d.isCurrent) return d.endMonth === null || d.endMonth === undefined;
    return true;
  },
  { message: "A current position must have a null endMonth" }
).refine(
  (d) => {
    if (d.isCurrent === false && d.endMonth && d.startMonth) {
      return d.endMonth >= d.startMonth;
    }
    return true;
  },
  { message: "endMonth cannot be earlier than startMonth" }
);

const educationSchema = z.object({
  institution: z.string().min(1).max(100),
  degree: z.string().min(1).max(100),
  fieldOfStudy: z.string().max(100).optional(),
  startYear: z.number().int().min(1950).max(currentYear + 8),
  graduationYear: z.number().int().min(1950).max(currentYear + 8).nullable().optional(),
  description: z.string().max(2000).optional(),
});

const certificationBaseSchema = z.object({
  name: z.string().min(1).max(100),
  issuer: z.string().min(1).max(100),
  issuedMonth: z.string().regex(monthRegex, "issuedMonth must be in YYYY-MM format"),
  expiresMonth: z.string().regex(monthRegex, "expiresMonth must be in YYYY-MM format").nullable().optional(),
  credentialId: z.string().max(100).optional(),
  credentialUrl: httpsUrlSchema.nullable().optional(),
});

const certificationSchema = certificationBaseSchema.refine(
  (d) => {
    if (d.expiresMonth && d.issuedMonth) {
      return d.expiresMonth >= d.issuedMonth;
    }
    return true;
  },
  { message: "expiresMonth cannot be earlier than issuedMonth" }
);

const certificationUpdateSchema = certificationBaseSchema.partial().refine(
  (d) => {
    if (d.expiresMonth && d.issuedMonth) {
      return d.expiresMonth >= d.issuedMonth;
    }
    return true;
  },
  { message: "expiresMonth cannot be earlier than issuedMonth" }
);

const portfolioBaseSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  role: z.string().min(1).max(100),
  tools: z.array(z.string().max(40)).max(30).default([]),
  projectUrl: httpsUrlSchema.nullable().optional(),
  repoUrl: httpsUrlSchema.nullable().optional(),
  startMonth: z.string().regex(monthRegex).nullable().optional(),
  endMonth: z.string().regex(monthRegex).nullable().optional(),
  coverFileId: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).default(0),
});

const portfolioSchema = portfolioBaseSchema.refine(
  (d) => {
    if (d.startMonth && d.endMonth) {
      return d.endMonth >= d.startMonth;
    }
    return true;
  },
  { message: "endMonth cannot be earlier than startMonth" }
);

const portfolioUpdateSchema = portfolioBaseSchema.partial().refine(
  (d) => {
    if (d.startMonth && d.endMonth) {
      return d.endMonth >= d.startMonth;
    }
    return true;
  },
  { message: "endMonth cannot be earlier than startMonth" }
);

const availabilitySchema = z.object({
  availabilityStatus: z.enum(["AVAILABLE", "UNAVAILABLE"]).optional(),
  weeklyCapacityHours: z.number().int().min(0).max(80).nullable().optional(),
  preferredEngagement: z.enum(["HOURLY", "FIXED_PRICE", "BOTH"]).nullable().optional(),
  rateHourlyMinor: z
    .number()
    .int("Rate must be an integer in minor units (e.g. 2500 for $25.00)")
    .min(500, "Minimum hourly rate is $5.00 (500 minor units)")
    .max(500000, "Maximum hourly rate is $5,000.00 (500000 minor units)")
    .nullable()
    .optional(),
  rateCurrency: z.enum(["USD", "INR", "EUR", "GBP"]).nullable().optional(),
  workArrangement: z.enum(["REMOTE", "HYBRID", "ON_SITE"]).nullable().optional(),
  searchVisibility: z.enum(["VISIBLE", "HIDDEN"]).optional(),
});

// ---------------------------------------------------------------------------
// 1. GET /api/freelancer/profile
// ---------------------------------------------------------------------------
router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: user.id },
      include: {
        freelancerSkills: { orderBy: { displayOrder: "asc" } },
        workExperiences: { orderBy: { startMonth: "desc" } },
        educationEntries: { orderBy: { startYear: "desc" } },
        certifications: { orderBy: { issuedMonth: "desc" } },
        portfolioProjects: { orderBy: { displayOrder: "asc" } },
        user: {
          include: {
            resumeFiles: { where: { status: "ACTIVE" }, orderBy: { uploadedAt: "desc" }, take: 1 },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundError("FreelancerProfile", user.id);
    }

    const completeness = calculateProfileCompleteness({
      ...profile,
      resumeFiles: profile.user?.resumeFiles,
    });

    res.json({
      success: true,
      profile,
      completeness,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 2. PATCH /api/freelancer/profile/basic
// ---------------------------------------------------------------------------
router.patch("/basic", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = basicProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid basic profile parameters", {
        issues: parsed.error.issues,
      });
    }

    const user = req.user!;
    const updated = await prisma.$transaction(async (tx) => {
      const profile = await tx.freelancerProfile.update({
        where: { userId: user.id },
        data: parsed.data,
      });

      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "FREELANCER_PROFILE",
          objectId: profile.id,
          metadata: { section: "basic" },
        },
        tx
      );

      return profile;
    });

    res.json({ success: true, profile: updated });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 3. PATCH /api/freelancer/profile/professional
// ---------------------------------------------------------------------------
router.patch("/professional", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = professionalSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid professional parameters", {
        issues: parsed.error.issues,
      });
    }

    const user = req.user!;
    const updated = await prisma.$transaction(async (tx) => {
      const profile = await tx.freelancerProfile.update({
        where: { userId: user.id },
        data: parsed.data,
      });

      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "FREELANCER_PROFILE",
          objectId: profile.id,
          metadata: { section: "professional" },
        },
        tx
      );

      return profile;
    });

    res.json({ success: true, profile: updated });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 4. PUT /api/freelancer/profile/skills
// ---------------------------------------------------------------------------
router.put("/skills", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = skillsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid skills parameters", {
        issues: parsed.error.issues,
      });
    }

    const user = req.user!;
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) throw new NotFoundError("FreelancerProfile", user.id);

    const skillsData = parsed.data.skills;

    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing skills for this profile
      await tx.freelancerSkill.deleteMany({
        where: { profileId: profile.id },
      });

      // 2. Insert new skills
      await tx.freelancerSkill.createMany({
        data: skillsData.map((s, index) => ({
          userId: user.id,
          profileId: profile.id,
          skillName: s.skillName.trim(),
          proficiency: s.proficiency || null,
          displayOrder: index,
        })),
      });

      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "FREELANCER_PROFILE",
          objectId: profile.id,
          metadata: { section: "skills", count: skillsData.length },
        },
        tx
      );
    });

    const refreshedSkills = await prisma.freelancerSkill.findMany({
      where: { profileId: profile.id },
      orderBy: { displayOrder: "asc" },
    });

    res.json({ success: true, skills: refreshedSkills });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 5. Work Experience CRUD
// ---------------------------------------------------------------------------
router.get("/experiences", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const experiences = await prisma.workExperience.findMany({
      where: { userId: req.user!.id },
      orderBy: { startMonth: "desc" },
    });
    res.json({ success: true, experiences });
  } catch (err) {
    next(err);
  }
});

router.post("/experiences", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = experienceSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid work experience parameters", {
        issues: parsed.error.issues,
      });
    }

    const user = req.user!;
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError("FreelancerProfile", user.id);

    const created = await prisma.$transaction(async (tx) => {
      const exp = await tx.workExperience.create({
        data: {
          ...parsed.data,
          userId: user.id,
          profileId: profile.id,
        },
      });

      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "WORK_EXPERIENCE",
          objectId: exp.id,
          metadata: { section: "experience", action: "create" },
        },
        tx
      );
      return exp;
    });

    res.status(201).json({ success: true, experience: created });
  } catch (err) {
    next(err);
  }
});

router.patch("/experiences/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Enforce ownership: 404 if record doesn't belong to this user
    const existing = await prisma.workExperience.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      throw new NotFoundError("WorkExperience", id);
    }

    const parsed = experienceUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid experience update parameters", {
        issues: parsed.error.issues,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const exp = await tx.workExperience.update({
        where: { id },
        data: parsed.data,
      });

      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "WORK_EXPERIENCE",
          objectId: exp.id,
          metadata: { section: "experience", action: "update" },
        },
        tx
      );
      return exp;
    });

    res.json({ success: true, experience: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/experiences/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existing = await prisma.workExperience.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      throw new NotFoundError("WorkExperience", id);
    }

    await prisma.$transaction(async (tx) => {
      await tx.workExperience.delete({ where: { id } });
      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "WORK_EXPERIENCE",
          objectId: id,
          metadata: { section: "experience", action: "delete" },
        },
        tx
      );
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 6. Education CRUD
// ---------------------------------------------------------------------------
router.get("/educations", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const educations = await prisma.educationEntry.findMany({
      where: { userId: req.user!.id },
      orderBy: { startYear: "desc" },
    });
    res.json({ success: true, educations });
  } catch (err) {
    next(err);
  }
});

router.post("/educations", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = educationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid education parameters", {
        issues: parsed.error.issues,
      });
    }

    const user = req.user!;
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError("FreelancerProfile", user.id);

    const created = await prisma.$transaction(async (tx) => {
      const edu = await tx.educationEntry.create({
        data: {
          ...parsed.data,
          userId: user.id,
          profileId: profile.id,
        },
      });

      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "EDUCATION_ENTRY",
          objectId: edu.id,
          metadata: { section: "education", action: "create" },
        },
        tx
      );
      return edu;
    });

    res.status(201).json({ success: true, education: created });
  } catch (err) {
    next(err);
  }
});

router.patch("/educations/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existing = await prisma.educationEntry.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundError("EducationEntry", id);

    const parsed = educationSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid education update parameters", {
        issues: parsed.error.issues,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const edu = await tx.educationEntry.update({
        where: { id },
        data: parsed.data,
      });

      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "EDUCATION_ENTRY",
          objectId: edu.id,
          metadata: { section: "education", action: "update" },
        },
        tx
      );
      return edu;
    });

    res.json({ success: true, education: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/educations/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existing = await prisma.educationEntry.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundError("EducationEntry", id);

    await prisma.$transaction(async (tx) => {
      await tx.educationEntry.delete({ where: { id } });
      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "EDUCATION_ENTRY",
          objectId: id,
          metadata: { section: "education", action: "delete" },
        },
        tx
      );
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 7. Certifications CRUD
// ---------------------------------------------------------------------------
router.get("/certifications", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const certifications = await prisma.certification.findMany({
      where: { userId: req.user!.id },
      orderBy: { issuedMonth: "desc" },
    });
    res.json({ success: true, certifications });
  } catch (err) {
    next(err);
  }
});

router.post("/certifications", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = certificationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid certification parameters", {
        issues: parsed.error.issues,
      });
    }

    const user = req.user!;
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError("FreelancerProfile", user.id);

    const created = await prisma.$transaction(async (tx) => {
      const cert = await tx.certification.create({
        data: {
          ...parsed.data,
          userId: user.id,
          profileId: profile.id,
        },
      });

      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "CERTIFICATION",
          objectId: cert.id,
          metadata: { section: "certification", action: "create" },
        },
        tx
      );
      return cert;
    });

    res.status(201).json({ success: true, certification: created });
  } catch (err) {
    next(err);
  }
});

router.patch("/certifications/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existing = await prisma.certification.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundError("Certification", id);

    const parsed = certificationUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid certification update parameters", {
        issues: parsed.error.issues,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cert = await tx.certification.update({
        where: { id },
        data: parsed.data,
      });

      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "CERTIFICATION",
          objectId: cert.id,
          metadata: { section: "certification", action: "update" },
        },
        tx
      );
      return cert;
    });

    res.json({ success: true, certification: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/certifications/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existing = await prisma.certification.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundError("Certification", id);

    await prisma.$transaction(async (tx) => {
      await tx.certification.delete({ where: { id } });
      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "CERTIFICATION",
          objectId: id,
          metadata: { section: "certification", action: "delete" },
        },
        tx
      );
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 8. Portfolio CRUD
// ---------------------------------------------------------------------------
router.get("/portfolio", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projects = await prisma.portfolioProject.findMany({
      where: { userId: req.user!.id },
      orderBy: { displayOrder: "asc" },
    });
    res.json({ success: true, projects });
  } catch (err) {
    next(err);
  }
});

router.post("/portfolio", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = portfolioSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid portfolio parameters", {
        issues: parsed.error.issues,
      });
    }

    const user = req.user!;
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError("FreelancerProfile", user.id);

    const created = await prisma.$transaction(async (tx) => {
      const proj = await tx.portfolioProject.create({
        data: {
          ...parsed.data,
          userId: user.id,
          profileId: profile.id,
        },
      });

      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "PORTFOLIO_PROJECT",
          objectId: proj.id,
          metadata: { section: "portfolio", action: "create" },
        },
        tx
      );
      return proj;
    });

    res.status(201).json({ success: true, project: created });
  } catch (err) {
    next(err);
  }
});

router.patch("/portfolio/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existing = await prisma.portfolioProject.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundError("PortfolioProject", id);

    const parsed = portfolioUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid portfolio update parameters", {
        issues: parsed.error.issues,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const proj = await tx.portfolioProject.update({
        where: { id },
        data: parsed.data,
      });

      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "PORTFOLIO_PROJECT",
          objectId: proj.id,
          metadata: { section: "portfolio", action: "update" },
        },
        tx
      );
      return proj;
    });

    res.json({ success: true, project: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/portfolio/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existing = await prisma.portfolioProject.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundError("PortfolioProject", id);

    await prisma.$transaction(async (tx) => {
      await tx.portfolioProject.delete({ where: { id } });
      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "PORTFOLIO_PROJECT",
          objectId: id,
          metadata: { section: "portfolio", action: "delete" },
        },
        tx
      );
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 9. PATCH /api/freelancer/profile/availability
// ---------------------------------------------------------------------------
router.patch("/availability", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = availabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid availability parameters", {
        issues: parsed.error.issues,
      });
    }

    const user = req.user!;
    const updated = await prisma.$transaction(async (tx) => {
      const profile = await tx.freelancerProfile.update({
        where: { userId: user.id },
        data: parsed.data,
      });

      await appendAuditEvent(
        {
          actorId: user.id,
          action: "PROFILE_SECTION_UPDATED",
          objectType: "FREELANCER_PROFILE",
          objectId: profile.id,
          metadata: { section: "availability" },
        },
        tx
      );

      return profile;
    });

    res.json({ success: true, profile: updated });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 10. GET /api/freelancer/profile/public-preview
// ---------------------------------------------------------------------------
router.get("/public-preview", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: user.id },
      include: {
        freelancerSkills: { orderBy: { displayOrder: "asc" } },
        workExperiences: { orderBy: { startMonth: "desc" } },
        educationEntries: { orderBy: { startYear: "desc" } },
        certifications: { orderBy: { issuedMonth: "desc" } },
        portfolioProjects: { orderBy: { displayOrder: "asc" } },
        user: {
          include: {
            resumeFiles: { where: { status: "ACTIVE" }, orderBy: { uploadedAt: "desc" }, take: 1 },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundError("FreelancerProfile", user.id);
    }

    const publicPreview = toPublicProfile(profile, { isOwner: true, viewerUserId: user.id });

    res.json({
      success: true,
      publicProfile: publicPreview,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
