/**
 * Robust Resume Parser for Nexum Freelancer Onboarding
 */

export interface ParsedResumeResult {
  fullName: string;
  email: string;
  workExperience: string;
  suggestedSkills: string[];
  suggestedProfileType: "Student / Beginner" | "Freelancer" | "Experienced professional" | "Agency";
}

const SKILL_MAP: Record<string, string[]> = {
  "Web development": [
    "react", "next.js", "nextjs", "vue", "angular", "html", "css", "tailwind",
    "tailwindcss", "frontend", "javascript", "typescript", "redux", "web development"
  ],
  "Backend / API development": [
    "node", "node.js", "nodejs", "express", "express.js", "fastapi", "django",
    "flask", "rest api", "graphql", "sql", "postgres", "postgresql", "mongodb",
    "prisma", "database", "backend", "spring boot", "java", "golang"
  ],
  "Blockchain / Web3": [
    "solidity", "ethereum", "web3", "smart contract", "smart contracts", "ethers.js",
    "web3.js", "polygon", "solana", "rust", "truffle", "hardhat"
  ],
  "AI / Machine Learning": [
    "python", "machine learning", "deep learning", "ai", "llm", "langchain",
    "openai", "pytorch", "tensorflow", "nlp", "computer vision", "hugging face",
    "data science", "pandas", "numpy"
  ],
  "Mobile development": [
    "react native", "flutter", "ios", "swift", "android", "kotlin", "mobile app"
  ],
  "UI/UX design": [
    "figma", "wireframing", "prototyping", "design system", "ui/ux", "user research", "adobe xd"
  ],
  "DevOps / Cloud": [
    "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "github actions",
    "devops", "linux", "cloud", "terraform", "vercel"
  ],
};

export function extractFromText(text: string, fileName?: string): ParsedResumeResult {
  const cleanText = text.replace(/\r/g, " ").trim();
  const lower = cleanText.toLowerCase();

  // 1. Email extraction
  const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const email = emailMatch ? emailMatch[0].toLowerCase() : "";

  // 2. Full Name extraction
  let fullName = "";

  // Strategy A: Clean first 8 non-empty lines from PDF
  const rawLines = text.split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.includes("@") && !l.startsWith("http") && !l.toLowerCase().includes("resume") && !l.toLowerCase().includes("curriculum vitae"));

  for (const line of rawLines.slice(0, 6)) {
    // Strip common prefixes
    const candidate = line.replace(/^(name\s*[:|-]\s*)/i, "").trim();
    // Words matching Name format: 2 to 4 capitalized words without numbers or punctuation
    const words = candidate.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Z][a-zA-Z'-]*$/.test(w))) {
      fullName = candidate;
      break;
    }
  }

  // Strategy B: If no multi-word title-case line, take first clean line only if valid name format
  if (!fullName && rawLines.length > 0) {
    const candidate = rawLines[0].replace(/^(name\s*[:|-]\s*)/i, "").trim();
    // Must look like a real name: letters, spaces, apostrophes only, no %PDF, no numbers, no symbols
    if (
      candidate.length >= 3 &&
      candidate.length <= 35 &&
      /^[A-Z][a-zA-Z\s'-]+$/.test(candidate) &&
      !candidate.includes("%PDF")
    ) {
      fullName = candidate;
    }
  }

  // Strategy C: Extract name from file name if file name is like "Sambit_Resume" or "John_Doe_CV"
  if ((!fullName || fullName.length < 3) && fileName) {
    const cleanFileName = fileName.replace(/\.[^/.]+$/, "").replace(/\(\d+\)/g, "").trim();
    const parts = cleanFileName.split(/[-_\s]+/).filter((p) => !/^(resume|cv|pdf|doc|profile)$/i.test(p));
    if (parts.length >= 1) {
      fullName = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    }
  }

  // 3. Work Experience extraction (Captures ALL internships, roles & bullet points)
  let workExperience = "";
  const expMatch =
    /(?:^|\n)\s*(?:work\s+)?experience(?:\s*[:|-]|\s*\n)/i.exec(text) ||
    /(?:^|\n)\s*(?:employment|professional background|internships?)(?:\s*[:|-]|\s*\n)/i.exec(text) ||
    /(experience|work experience|employment history)/i.exec(cleanText);

  if (expMatch) {
    const startIndex = expMatch.index + expMatch[0].length;
    const remainingText = text.slice(startIndex);

    // Section delimiter: stop at the next major section header
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
    workExperience = rawLines.slice(1, 8).join("\n").slice(0, 600);
  }

  // 4. Skills extraction
  const suggestedSkills: string[] = [];
  for (const [skillCategory, keywords] of Object.entries(SKILL_MAP)) {
    for (const kw of keywords) {
      // Word boundary match
      const kwRegex = new RegExp(`\\b${kw.replace(".", "\\.")}\\b`, "i");
      if (kwRegex.test(lower)) {
        if (!suggestedSkills.includes(skillCategory)) {
          suggestedSkills.push(skillCategory);
        }
        break;
      }
    }
  }

  if (suggestedSkills.length === 0) {
    suggestedSkills.push("Web development", "Backend / API development");
  }

  // 5. Profile Type heuristic
  let suggestedProfileType: ParsedResumeResult["suggestedProfileType"] = "Freelancer";
  if (
    lower.includes("student") ||
    lower.includes("undergraduate") ||
    lower.includes("b.tech") ||
    lower.includes("intern") ||
    lower.includes("college") ||
    lower.includes("fresher")
  ) {
    suggestedProfileType = "Student / Beginner";
  } else if (
    lower.includes("senior") ||
    lower.includes("lead") ||
    lower.includes("architect") ||
    lower.includes("years of experience") ||
    lower.includes("principal") ||
    lower.includes("staff engineer")
  ) {
    suggestedProfileType = "Experienced professional";
  } else if (lower.includes("agency") || lower.includes("studio") || lower.includes("consultancy")) {
    suggestedProfileType = "Agency";
  }

  return {
    fullName: fullName || "",
    email: email || "",
    workExperience: workExperience || "",
    suggestedSkills,
    suggestedProfileType,
  };
}
