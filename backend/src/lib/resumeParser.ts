/**
 * Intelligent heuristic Resume Parser for Nexum Freelancer Onboarding.
 * Extracts candidate details from text or extracted PDF content.
 */

export interface ParsedResume {
  fullName: string;
  email: string;
  workExperience: string;
  suggestedSkills: string[];
  suggestedProfileType: "Student / Beginner" | "Freelancer" | "Experienced professional" | "Agency";
}

const SKILL_KEYWORDS: Record<string, string[]> = {
  "Web development": ["react", "next.js", "nextjs", "vue", "html", "css", "tailwind", "frontend", "javascript", "typescript", "redux"],
  "Blockchain / Web3": ["solidity", "ethereum", "web3", "smart contract", "polygon", "bitcoin", "ethers.js", "solana"],
  "AI / Machine Learning": ["python", "machine learning", "deep learning", "ai", "llm", "langchain", "openai", "pytorch", "tensorflow", "nlp"],
  "Mobile development": ["react native", "flutter", "ios", "swift", "android", "kotlin"],
  "UI/UX design": ["figma", "wireframing", "prototyping", "design system", "ui/ux", "user research"],
  "Backend / API development": ["node", "node.js", "express", "fastapi", "rest api", "graphql", "postgres", "sql", "mongodb", "prisma"],
  "DevOps / Cloud": ["docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "terraform", "linux", "vercel"],
};

export function parseResumeText(rawText: string, fileName?: string): ParsedResume {
  const text = rawText.replace(/\r/g, " ").trim();
  const lower = text.toLowerCase();

  // 1. Extract Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const email = emailMatch ? emailMatch[0].toLowerCase() : "";

  // 2. Extract Full Name
  let fullName = "";
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.includes("@") && !l.startsWith("http") && !/^(resume|curriculum|cv)/i.test(l));

  for (const line of lines.slice(0, 6)) {
    const clean = line.replace(/^(name\s*[:|-]\s*)/i, "").trim();
    const words = clean.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Z][a-zA-Z'-]*$/.test(w))) {
      fullName = clean;
      break;
    }
  }

  if (!fullName && lines.length > 0) {
    const candidate = lines[0].replace(/^(name\s*[:|-]\s*)/i, "").trim();
    if (
      candidate.length >= 3 &&
      candidate.length <= 35 &&
      /^[A-Z][a-zA-Z\s'-]+$/.test(candidate) &&
      !candidate.includes("%PDF")
    ) {
      fullName = candidate;
    }
  }

  // Strategy C: Infer from file name (e.g. Sambit_Resume(3).pdf -> Sambit)
  if ((!fullName || fullName.length < 3) && fileName) {
    const cleanFileName = fileName.replace(/\.[^/.]+$/, "").replace(/\(\d+\)/g, "").trim();
    const parts = cleanFileName.split(/[-_\s]+/).filter((p) => !/^(resume|cv|pdf|doc|profile)$/i.test(p));
    if (parts.length >= 1) {
      fullName = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    }
  }

  // 3. Extract Work Experience (Captures ALL internships, roles & bullet points)
  let workExperience = "";
  const expMatch =
    /(?:^|\n)\s*(?:work\s+)?experience(?:\s*[:|-]|\s*\n)/i.exec(rawText) ||
    /(?:^|\n)\s*(?:employment|professional background|internships?)(?:\s*[:|-]|\s*\n)/i.exec(rawText) ||
    /(experience|work experience|employment history)/i.exec(text);

  if (expMatch) {
    const startIndex = expMatch.index + expMatch[0].length;
    const remainingText = rawText.slice(startIndex);

    // Stop at the next major section header
    const nextSectionRegex =
      /(?:^|\n)\s*(PROJECTS|EDUCATION|TECHNICAL SKILLS|SKILLS|CERTIFICATIONS|ACHIEVEMENTS|AWARDS|PUBLICATIONS|EXTRACURRICULAR|LANGUAGES)(?:\s*[:|-]|\s*\n)/i;
    const nextMatch = nextSectionRegex.exec(remainingText);

    const expBlock = nextMatch
      ? remainingText.slice(0, nextMatch.index)
      : remainingText.slice(0, 3000);

    const expLines = expBlock
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (expLines.length > 0) {
      workExperience = expLines.join("\n");
    }
  }

  if (!workExperience || workExperience.length < 20) {
    workExperience = lines.slice(1, 8).join("\n").slice(0, 600);
  }

  // 4. Extract Skills
  const suggestedSkills: string[] = [];
  for (const [category, keywords] of Object.entries(SKILL_KEYWORDS)) {
    for (const kw of keywords) {
      const kwRegex = new RegExp(`\\b${kw.replace(".", "\\.")}\\b`, "i");
      if (kwRegex.test(lower)) {
        if (!suggestedSkills.includes(category)) {
          suggestedSkills.push(category);
        }
        break;
      }
    }
  }

  if (suggestedSkills.length === 0) {
    suggestedSkills.push("Web development", "Backend / API development");
  }

  // 5. Determine Profile Type
  let suggestedProfileType: ParsedResume["suggestedProfileType"] = "Freelancer";
  if (lower.includes("agency") || lower.includes("studio") || lower.includes("consultancy")) {
    suggestedProfileType = "Agency";
  } else if (
    lower.includes("student") ||
    lower.includes("intern") ||
    lower.includes("b.tech") ||
    lower.includes("undergraduate") ||
    lower.includes("college") ||
    lower.includes("fresher")
  ) {
    suggestedProfileType = "Student / Beginner";
  } else if (
    lower.includes("senior") ||
    lower.includes("lead") ||
    lower.includes("architect") ||
    lower.includes("principal") ||
    lower.includes("5+ years") ||
    lower.includes("10+ years")
  ) {
    suggestedProfileType = "Experienced professional";
  }

  return {
    fullName: fullName || "",
    email: email || "",
    workExperience: workExperience || "",
    suggestedSkills,
    suggestedProfileType,
  };
}
