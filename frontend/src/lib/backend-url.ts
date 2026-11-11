/**
 * Centralized Backend URL resolver for Next.js server-side route handlers.
 * Guarantees that in production / Vercel cloud environments, requests never
 * block on unreachable localhost:4000 and always reach the live Render backend.
 */

const FALLBACK_RENDER_URL = "https://nexum-79g2.onrender.com";

export function getBackendUrl(): string {
  const configured =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL;

  const isCloudOrProd =
    process.env.VERCEL === "1" ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_URL) ||
    Boolean(process.env.NEXT_PUBLIC_VERCEL_URL) ||
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RENDER) ||
    (typeof window === "undefined" && Boolean(process.env.AWS_REGION));

  const isLocalhost =
    !configured ||
    configured.includes("localhost") ||
    configured.includes("127.0.0.1");

  // In production / Vercel cloud serverless, never block on unreachable localhost
  if (isCloudOrProd && isLocalhost) {
    return FALLBACK_RENDER_URL;
  }

  return configured || (isCloudOrProd ? FALLBACK_RENDER_URL : "http://localhost:4000");
}
