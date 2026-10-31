import fs from "fs";
import { prisma } from "../prisma.js";
import { backgroundWorker } from "./worker.js";
import { extractResumeWithGemini } from "../lib/gemini.js";

/**
 * Validate that a buffer starts with standard %PDF- magic bytes (0x25 0x50 0x44 0x46 0x2D).
 */
export function validatePdfMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) return false;
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

export interface ResumeJobPayload {
  resumeId: string;
  extractionId: string;
  filePath: string;
  originalName: string;
}

/**
 * Extract text from PDF buffer using embedded streams or fallback.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  let text = "";
  try {
    const rawString = buffer.toString("latin1");
    // Search for text stream chunks: (text) Tj
    const matches = rawString.match(/\((.*?)\)\s*Tj/g) || [];
    if (matches.length > 0) {
      text = matches.map((m) => m.replace(/^\(|\)\s*Tj$/g, "")).join(" ");
    } else {
      // Fallback: check utf-8 chunks for words
      const utf8 = buffer.toString("utf-8");
      const words = utf8.match(/[a-zA-Z0-9.,@\s]{4,}/g) || [];
      if (words.length > 10) {
        text = words.join(" ");
      }
    }
  } catch {
    text = "";
  }
  return text.trim();
}

/**
 * Safe helper to update a ResumeExtraction record.
 * Gracefully ignores P2025 errors if the parent user or extraction was cleaned up.
 */
async function safeUpdateResumeExtraction(extractionId: string, data: any): Promise<boolean> {
  try {
    await prisma.resumeExtraction.update({
      where: { id: extractionId },
      data,
    });
    return true;
  } catch (err: any) {
    if (err?.code === "P2025") {
      // Record was deleted; safe to ignore
      return false;
    }
    throw err;
  }
}

/**
 * Process a resume extraction job asynchronously.
 */
export async function processResumeExtraction(
  extractionId: string,
  filePath: string,
  _originalName: string
): Promise<{ success: boolean; model?: string }> {
  // 0. Verify the extraction record exists
  const existingRecord = await prisma.resumeExtraction.findUnique({
    where: { id: extractionId },
  });
  if (!existingRecord) {
    // Record was already deleted/cleaned up; nothing to process
    return { success: false };
  }

  if (!fs.existsSync(filePath)) {
    await safeUpdateResumeExtraction(extractionId, {
      status: "FAILED",
      failureReason: "FILE_NOT_FOUND: The uploaded file was not found on disk.",
    });
    throw new Error(`File not found: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);

  // 1. Magic bytes check
  if (!validatePdfMagicBytes(fileBuffer)) {
    await safeUpdateResumeExtraction(extractionId, {
      status: "FAILED",
      failureReason: "INVALID_PDF_HEADER: Document is not a valid PDF file.",
    });
    throw new Error("Invalid PDF header magic bytes");
  }

  // 2. Extract text layer
  const text = await extractTextFromPdf(fileBuffer);

  // 3. Check for scanned/image PDF without text layer
  if (!text || text.length < 20) {
    await safeUpdateResumeExtraction(extractionId, {
      status: "FAILED",
      failureReason:
        "SCANNED_PDF_REQUIRES_OCR: Document contains no extractable text layer. Optical Character Recognition (OCR) is required.",
    });
    // This is a permanent failure for this document, not a retryable transient crash
    return { success: false };
  }

  // 4. Structured extraction via Google Gemini API
  try {
    const { data, model, promptVersion } = await extractResumeWithGemini(text);

    await safeUpdateResumeExtraction(extractionId, {
      status: "READY",
      extractedJson: data as any,
      model,
      promptVersion,
      failureReason: null,
    });

    return { success: true, model };
  } catch (geminiError: any) {
    const errorMsg = geminiError?.message || String(geminiError);

    await safeUpdateResumeExtraction(extractionId, {
      status: "FAILED",
      failureReason: errorMsg,
    });

    // Re-throw so background worker can track attempts and apply retry logic
    throw geminiError;
  }
}

/**
 * Worker handler registered for type "EXTRACT_RESUME"
 */
export async function extractResumeJobHandler(payload: ResumeJobPayload): Promise<any> {
  const { extractionId, filePath, originalName } = payload;
  return await processResumeExtraction(extractionId, filePath, originalName);
}

// Register handler with worker singleton
backgroundWorker.registerHandler("EXTRACT_RESUME", extractResumeJobHandler);
