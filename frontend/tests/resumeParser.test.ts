import { describe, it, expect } from "vitest";
import { extractFromText } from "../src/lib/resumeParser";

describe("Resume Parser & Extraction Engine", () => {
  it("should extract name from resume text header", () => {
    const resumeText = `
Sambit Kumar Mohanty
sambit.mohanty@example.com
+91 9876543210
Software Engineer & Full Stack Developer

Experience:
Full Stack Developer at Tech Innovators. Built Next.js and TypeScript web applications with PostgreSQL and microservices.
    `;

    const parsed = extractFromText(resumeText, "Sambit_Resume(3).pdf");
    expect(parsed.fullName).toBe("Sambit Kumar Mohanty");
    expect(parsed.email).toBe("sambit.mohanty@example.com");
    expect(parsed.suggestedSkills).toContain("Web development");
  });

  it("should infer candidate name from file name if resume header is unstructured", () => {
    const rawBinaryNoise = "%PDF-1.4 ... binary text ...";
    const parsed = extractFromText(rawBinaryNoise, "Sambit_Resume(3).pdf");
    expect(parsed.fullName).toBe("Sambit");
  });

  it("should extract skills and classify profile type accurately", () => {
    const resumeText = `
Senior Cloud Architect with 8+ years of experience leading Docker, Kubernetes, AWS, and Node.js infrastructure.
    `;
    const parsed = extractFromText(resumeText, "resume.pdf");
    expect(parsed.suggestedSkills).toContain("DevOps / Cloud");
    expect(parsed.suggestedProfileType).toBe("Experienced professional");
  });

  it("should extract all multiple internships and roles without cutting off after the first one", () => {
    const resumeText = `
Sambit Kumar Mohanty
Cuttack, Odisha
Ó +91-7855909585 R sambitkumarmohanty25@gmail.com
EDUCATION
B.Tech - Information Technology 2023 – 2027
Odisha University of Technology and Research
EXPERIENCE
Software Development Engineer - Intern Feb 2026 – Mar 2026
noCnX Technologies Remote
• Developed an intranet R&D portal to streamline test, inspection, prototype, and issue workflows.
• Automated test and inspection workflows via secure REST APIs (JWT/OAuth), real-time WebSocket
tracking, and CI/CD pipelines.
Full Stack Development Engineer - Intern Mar 2026 – Oct 2026
WombTo18 Integrated Care Private Limited Remote
• Developed scalable full-stack healthcare systems with dynamic scheduling and user-centric workflows.
• Designed backend architecture and APIs for a dynamic vaccine schedule recalculation engine.
PROJECTS
CloudMesh | Link | TypeScript, Fastify, PostgreSQL
    `;

    const parsed = extractFromText(resumeText, "Sambit_Resume(3).pdf");
    expect(parsed.fullName).toBe("Sambit Kumar Mohanty");
    expect(parsed.email).toBe("sambitkumarmohanty25@gmail.com");
    // Must contain BOTH internships
    expect(parsed.workExperience).toContain("noCnX Technologies");
    expect(parsed.workExperience).toContain("WombTo18 Integrated Care");
    expect(parsed.workExperience).toContain("Software Development Engineer - Intern");
    expect(parsed.workExperience).toContain("Full Stack Development Engineer - Intern");
    expect(parsed.suggestedSkills).toContain("Web development");
    expect(parsed.suggestedSkills).toContain("Backend / API development");
  });
});

