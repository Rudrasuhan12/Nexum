import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Initialize S3 client for Neon Object Storage if environment variables are set
const isS3Configured = Boolean(
  process.env.AWS_ENDPOINT_URL_S3 &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
);

export const s3Client = isS3Configured
  ? new S3Client({
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      region: process.env.AWS_REGION || "ap-southeast-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true,
    })
  : null;

export const S3_BUCKET = process.env.AWS_S3_BUCKET || "nexum";

function getLocalUploadDir(folder: string): string {
  const cwd = process.cwd();
  let base = path.join(cwd, "public");
  if (!fs.existsSync(base) && fs.existsSync(path.join(cwd, "frontend", "public"))) {
    base = path.join(cwd, "frontend", "public");
  }
  const targetDir = path.join(base, "uploads", folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

export interface UploadResult {
  url: string;
  key: string;
  storage: "neon_s3" | "local_disk";
  size: number;
}

/**
 * Upload an image or file buffer to Neon Object Storage (or local disk in dev)
 */
export async function uploadObject(params: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folder?: string;
}): Promise<UploadResult> {
  const { buffer, fileName, mimeType, folder = "avatars" } = params;
  const key = `${folder}/${fileName}`;

  // 1. Try uploading to Neon S3 Object Storage if configured
  if (s3Client) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        })
      );

      // Return proxy streaming URL so it works seamlessly with Private buckets & browser caching
      return {
        url: `/api/storage/${key}`,
        key,
        storage: "neon_s3",
        size: buffer.length,
      };
    } catch (err) {
      console.warn("Neon S3 upload failed, falling back to local storage:", err);
    }
  }

  // 2. Fallback to local disk storage
  const localDir = getLocalUploadDir(folder);
  const filePath = path.join(localDir, fileName);
  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/${folder}/${fileName}`,
    key,
    storage: "local_disk",
    size: buffer.length,
  };
}

/**
 * Download / stream an object from Neon S3 or local disk
 */
export async function getObjectStream(key: string): Promise<{
  stream: ReadableStream | NodeJS.ReadableStream | Buffer;
  contentType: string;
  contentLength?: number;
} | null> {
  // 1. Try Neon S3
  if (s3Client) {
    try {
      const res = await s3Client.send(
        new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
        })
      );
      if (res.Body) {
        return {
          stream: res.Body as any,
          contentType: res.ContentType || "application/octet-stream",
          contentLength: res.ContentLength,
        };
      }
    } catch (err: unknown) {
      // Key might not exist in S3, check local disk fallback
    }
  }

  // 2. Check local disk
  const cwd = process.cwd();
  let localPath = path.join(cwd, "public", "uploads", key);
  if (!fs.existsSync(localPath) && fs.existsSync(path.join(cwd, "frontend", "public", "uploads", key))) {
    localPath = path.join(cwd, "frontend", "public", "uploads", key);
  }

  if (fs.existsSync(localPath)) {
    const buffer = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
        ? "image/gif"
        : "image/jpeg";

    return {
      stream: buffer,
      contentType,
      contentLength: buffer.length,
    };
  }

  return null;
}

