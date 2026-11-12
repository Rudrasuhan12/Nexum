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

  const isRemoteCloud =
    process.env.VERCEL === "1" ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_URL) ||
    Boolean(process.env.NEXT_PUBLIC_VERCEL_URL) ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  const isLocalhost =
    !configured ||
    configured.includes("localhost") ||
    configured.includes("127.0.0.1");

  // In real cloud serverless deployments (Vercel/Render), never block on localhost
  if (isRemoteCloud && isLocalhost) {
    return FALLBACK_RENDER_URL;
  }

  return configured || (isRemoteCloud ? FALLBACK_RENDER_URL : "http://localhost:4000");
}
