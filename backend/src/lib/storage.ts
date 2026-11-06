import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { env } from "./env.js";

const isS3Configured = Boolean(
  env.AWS_ENDPOINT_URL_S3 &&
  env.AWS_ACCESS_KEY_ID &&
  env.AWS_SECRET_ACCESS_KEY
);

export const s3Client = isS3Configured
  ? new S3Client({
      endpoint: env.AWS_ENDPOINT_URL_S3,
      region: env.AWS_REGION || "ap-southeast-1",
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true,
    })
  : null;

export const S3_BUCKET = env.AWS_S3_BUCKET || "nexum";

export interface StorageUploadResult {
  url: string;
  key: string;
  storage: "s3_object_storage" | "local_disk";
  size: number;
}

/**
 * Uploads visual proof screenshot artifact:
 * - Production: S3 Object Storage (Cloudflare R2 / AWS S3 / Neon Object Storage)
 * - Development: Local file storage in public/uploads/visual-proofs
 */
export async function uploadVisualProofArtifact(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}): Promise<StorageUploadResult> {
  const { buffer, fileName, contentType } = params;
  const key = `visual-proofs/${fileName}`;

  // 1. Production Object Storage (S3 / R2 / Neon)
  if (s3Client) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      return {
        url: `/api/storage/${key}`,
        key,
        storage: "s3_object_storage",
        size: buffer.length,
      };
    } catch (err) {
      console.warn("[Storage] S3 Object Storage upload failed, falling back to local file storage:", err);
    }
  }

  // 2. Local File Storage Fallback
  const localDir = getLocalUploadDir("visual-proofs");
  const filePath = path.join(localDir, fileName);
  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/visual-proofs/${fileName}`,
    key,
    storage: "local_disk",
    size: buffer.length,
  };
}

function getLocalUploadDir(folder: string): string {
  const cwd = process.cwd();
  let base = path.join(cwd, "frontend", "public", "uploads", folder);
  if (!fs.existsSync(base)) {
    if (fs.existsSync(path.join(cwd, "public", "uploads"))) {
      base = path.join(cwd, "public", "uploads", folder);
    }
  }
  if (!fs.existsSync(base)) {
    try {
      fs.mkdirSync(base, { recursive: true });
    } catch {}
  }
  return base;
}

