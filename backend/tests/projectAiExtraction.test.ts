import { describe, it, expect } from "vitest";
import zlib from "zlib";
import { openSourceAiService, stripMarkdownStars } from "../src/services/openSourceAiService.js";
import { extractTextFromDocx } from "../src/lib/docxParser.js";

function createMockDocx(title: string, paragraphs: string[]): Buffer {
  const pXml = paragraphs.map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>${title}</w:t></w:r></w:p>
    ${pXml}
  </w:body>
</w:document>`;

  const xmlBuf = Buffer.from(xml, "utf8");
  const compressed = zlib.deflateRawSync(xmlBuf);
  const fnBuf = Buffer.from("word/document.xml", "utf8");

  // Local header
  const localHeader = Buffer.alloc(30 + fnBuf.length);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(8, 8); // deflate
  localHeader.writeUInt32LE(0x12345678, 14); // crc
  localHeader.writeUInt32LE(compressed.length, 18);
  localHeader.writeUInt32LE(xmlBuf.length, 22);
  localHeader.writeUInt16LE(fnBuf.length, 26);
  localHeader.writeUInt16LE(0, 28);
  fnBuf.copy(localHeader, 30);

  const localData = Buffer.concat([localHeader, compressed]);

  // Central directory header
  const cdHeader = Buffer.alloc(46 + fnBuf.length);
  cdHeader.writeUInt32LE(0x02014b50, 0);
  cdHeader.writeUInt16LE(20, 4);
  cdHeader.writeUInt16LE(20, 6);
  cdHeader.writeUInt16LE(0, 8);
  cdHeader.writeUInt8(8, 10);
  cdHeader.writeUInt32LE(0x12345678, 16);
  cdHeader.writeUInt32LE(compressed.length, 20);
  cdHeader.writeUInt32LE(xmlBuf.length, 24);
  cdHeader.writeUInt16LE(fnBuf.length, 28);
  fnBuf.copy(cdHeader, 46);

  const cdOffset = localData.length;

  // EOCD
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cdHeader.length, 12);
  eocd.writeUInt32LE(cdOffset, 16);

  return Buffer.concat([localData, cdHeader, eocd]);
}

describe("Open-Source AI Document Extraction & Assistant", () => {
  it("should extract clean plain text from a docx binary buffer without any PK zip garble", () => {
    const docxBuf = createMockDocx("TerraShield Security Platform", [
      "TerraShield is a security-focused platform requiring comprehensive full-stack development.",
      "The project involves building a complete web application with frontend, backend, and AI/ML modules.",
    ]);

    const extractedText = extractTextFromDocx(docxBuf);
    expect(extractedText).toContain("TerraShield Security Platform");
    expect(extractedText).toContain("TerraShield is a security-focused platform");
    expect(extractedText).not.toContain("PK");
    expect(extractedText).not.toContain("[Content_Types].xml");
  });

  it("should extract project parameters from technical PRD text", async () => {
    const samplePrd = `
# Bilateral Payment Gateway & Ledger Synchronization
We are building a robust bilateral escrow and payout settlement platform.
The architecture requires high availability, zero downtime, and end-to-end type safety.

Requirements:
- Build Next.js 15 front-end checkout and buyer workspace
- Implement Node.js and TypeScript microservices for PayPal v2 webhook ingestion
- Design PostgreSQL schema with Prisma ORM and row-level security
- Configure Docker containerization and CI/CD pipelines
- Perform end-to-end test assertions with Jest and Playwright

Budget:
Total milestone budget is estimated at $4,500 USD across 4 weekly sprints.
`;

    const extracted = await openSourceAiService.extractProjectFromDocument(samplePrd, "Bilateral_PRD.md");

    expect(extracted).toBeDefined();
    expect(extracted.title).toContain("Bilateral Payment Gateway");
    expect(extracted.category).toBe("Development & IT");
    expect(extracted.requiredSkills.some((s) => ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "Docker"].includes(s))).toBe(true);
    expect(extracted.scopeOfWork.length).toBeGreaterThan(0);
    expect(extracted.detailedRequirements).toContain("•");
    expect(extracted.estimatedBudgetCents).toBe(450000);
  });

  it("should extract TerraShield docx text with canonical goals Build a new product and Integrate AI/ML", async () => {
    const terraShieldDoc = `
TerraShield Security Platform

TerraShield is a security-focused platform requiring comprehensive full-stack development.
The document outlines requirements for a robust system with authentication, user management, and security features.
The project involves building a complete web application with frontend, backend, and database components, likely involving AI/ML security features given the Nexum AI protocol context.
The system requires user authentication, role-based access control, and various security modules.
Development will need to handle user onboarding, session management, and integration with security scanning capabilities.
`;

    const extracted = await openSourceAiService.extractProjectFromDocument(
      terraShieldDoc,
      "TerraShield_Business_Requirements_Document_v1.0.docx"
    );

    expect(extracted.title).toBe("TerraShield Security Platform");
    expect(extracted.overview).not.toContain("PK");
    expect(extracted.overview).not.toContain("[Content_Types]");
    expect(extracted.keyGoals).toContain("Build a new product");
    expect(extracted.keyGoals).toContain("Integrate AI/ML");
  });

  it("should throw EMPTY_DOCUMENT error when text is blank", async () => {
    await expect(openSourceAiService.extractProjectFromDocument("   ")).rejects.toThrow("EMPTY_DOCUMENT");
  });

  it("should enrich overview with technical architecture benchmarks without markdown stars", async () => {
    const basicOverview = "A simple portal for managing client deliverables.";
    const enriched = await openSourceAiService.improveOverview({
      title: "Deliverable Portal",
      overview: basicOverview,
      category: "Web Development",
    });

    expect(enriched).toBeDefined();
    expect(enriched.length).toBeGreaterThan(basicOverview.length);
    expect(enriched).toContain("Technical Architecture & Standards");
    expect(enriched).not.toContain("**");
    expect(enriched).not.toContain("*");
  });

  it("should strip markdown asterisks and format bullets cleanly", () => {
    const raw = "**Architectural Objective:** Platform\n* Sub-200ms latency\n* High reliability";
    const cleaned = stripMarkdownStars(raw);
    expect(cleaned).toBe("Architectural Objective: Platform\n• Sub-200ms latency\n• High reliability");
    expect(cleaned).not.toContain("*");
  });

  it("should suggest relevant technical skills excluding already selected skills", async () => {
    const existing = ["Next.js", "React"];
    const suggested = await openSourceAiService.suggestSkills({
      title: "Full-Stack Web App",
      overview: "Building PostgreSQL backend with Docker and Redis caching",
      category: "Web Development",
      existingSkills: existing,
    });

    expect(Array.isArray(suggested)).toBe(true);
    expect(suggested.length).toBeGreaterThan(0);
    // Should not contain existing skills
    expect(suggested.includes("Next.js")).toBe(false);
  });
});

