import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "./env.js";

export const structuredResumeSchema = z.object({
  fullName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  professionalSummary: z.string().default(""),
  skills: z.array(z.string()).default([]),
  education: z
    .array(
      z.object({
        institution: z.string().default(""),
        degree: z.string().default(""),
        fieldOfStudy: z.string().optional().default(""),
        graduationYear: z.string().optional().default(""),
      })
    )
    .default([]),
  workExperience: z
    .array(
      z.object({
        company: z.string().default(""),
        role: z.string().default(""),
        startDate: z.string().optional().default(""),
        endDate: z.string().optional().default(""),
        isCurrent: z.boolean().optional().default(false),
        description: z.string().optional().default(""),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        title: z.string().default(""),
        description: z.string().optional().default(""),
        technologies: z.array(z.string()).optional().default([]),
        url: z.string().optional().default(""),
      })
    )
    .default([]),
  certifications: z.array(z.string()).default([]),
});

export type StructuredResume = z.infer<typeof structuredResumeSchema>;

export const GEMINI_PROMPT_VERSION = "v2.0-structured-json";
export const GEMINI_DEFAULT_MODEL = "gemini-3.7-flash";

// Mock adapter slot for testing
type GeminiExtractorFn = (text: string) => Promise<{
  data: StructuredResume;
  model: string;
  promptVersion: string;
}>;

let geminiExtractorOverride: GeminiExtractorFn | null = null;

export function setGeminiExtractorOverride(override: GeminiExtractorFn | null): void {
  geminiExtractorOverride = override;
}

/**
 * Extract structured resume data using real Google Gemini API.
 */
export async function extractResumeWithGemini(
  resumeText: string,
  modelName: string = GEMINI_DEFAULT_MODEL
): Promise<{
  data: StructuredResume;
  model: string;
  promptVersion: string;
}> {
  if (geminiExtractorOverride) {
    return geminiExtractorOverride(resumeText);
  }

  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      "GEMINI_API_KEY_NOT_CONFIGURED: Gemini API key is missing from environment variables."
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert resume parsing engine for the Nexum freelance platform.
Analyze the following extracted resume text and output a strictly valid JSON object matching this schema:
{
  "fullName": string,
  "email": string,
  "phone": string,
  "professionalSummary": string,
  "skills": string[],
  "education": [
    { "institution": string, "degree": string, "fieldOfStudy": string, "graduationYear": string }
  ],
  "workExperience": [
    { "company": string, "role": string, "startDate": string, "endDate": string, "isCurrent": boolean, "description": string }
  ],
  "projects": [
    { "title": string, "description": string, "technologies": string[], "url": string }
  ],
  "certifications": string[]
}

Ensure all dates are strings. Do not invent details not present in the text. Return only the JSON object.

RESUME TEXT:
${resumeText.slice(0, 30000)}
`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text?.trim() || "";
    if (!responseText) {
      throw new Error("EMPTY_GEMINI_RESPONSE: Gemini API returned an empty output.");
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(responseText);
    } catch {
      // If output had markdown formatting e.g. ```json
      const cleaned = responseText.replace(/^```json/i, "").replace(/```$/i, "").trim();
      parsedJson = JSON.parse(cleaned);
    }

    const validation = structuredResumeSchema.safeParse(parsedJson);
    if (!validation.success) {
      throw new Error(
        `INVALID_GEMINI_OUTPUT: Output failed schema validation: ${validation.error.message}`
      );
    }

    return {
      data: validation.data,
      model: modelName,
      promptVersion: GEMINI_PROMPT_VERSION,
    };
  } catch (err: any) {
    // Distinguish quota/rate limits vs bad requests
    if (err.status === 429 || err.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error(`GEMINI_RATE_LIMITED: ${err.message}`);
    }
    throw err;
  }
}

