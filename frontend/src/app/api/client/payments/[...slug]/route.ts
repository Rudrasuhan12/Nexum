import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";
import { getCurrentUser } from "@/lib/auth";

const FALLBACK_RENDER_URL = "https://nexum-79g2.onrender.com";

function getTargetUrls(pathWithQuery: string): string[] {
  const primaryBackend = getBackendUrl();
  const primary = `${primaryBackend}/api/client/payments/${pathWithQuery}`;
  const isCloudOrProd =
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production" ||
    (typeof window === "undefined" && Boolean(process.env.AWS_REGION));

  const isLocalhost =
    !primaryBackend ||
    primaryBackend.includes("localhost") ||
    primaryBackend.includes("127.0.0.1");

  if (isCloudOrProd && isLocalhost) {
    return [`${FALLBACK_RENDER_URL}/api/client/payments/${pathWithQuery}`];
  }

  if (isLocalhost && !primaryBackend.includes("onrender.com")) {
    return [primary, `${FALLBACK_RENDER_URL}/api/client/payments/${pathWithQuery}`];
  }

  return [primary];
}

async function extractForwardHeaders(request: NextRequest): Promise<Record<string, string>> {
  const cookieHeader = request.headers.get("cookie") || "";
  const originHeader =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    "http://localhost:3000";

  let effectiveUserId = "";
  try {
    const user = await getCurrentUser();
    if (user?.id) {
      effectiveUserId = user.id;
    }
  } catch {}

  const rawCookieToken = request.cookies.get("nexum_session")?.value || "";
  if (!effectiveUserId && (rawCookieToken || cookieHeader)) {
    const rawVal = rawCookieToken || (cookieHeader.match(/nexum_session=([^;]+)/)?.[1] ?? "");
    if (rawVal) {
      try {
        const decoded = decodeURIComponent(rawVal);
        const [payloadEncoded] = decoded.split(".");
        if (payloadEncoded) {
          const raw = Buffer.from(payloadEncoded, "base64url").toString("utf-8");
          const parsed = JSON.parse(raw);
          if (parsed?.userId) {
            effectiveUserId = parsed.userId;
          }
        }
      } catch {}
    }
  }

  const userIdHeader = request.headers.get("x-user-id") || effectiveUserId;
  const clientIdHeader = request.headers.get("x-client-id") || effectiveUserId;
  const authHeader = request.headers.get("authorization") || "";

  return {
    Origin: originHeader,
    Referer: originHeader,
    "x-nexum-internal": "true",
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(userIdHeader ? { "x-user-id": userIdHeader } : {}),
    ...(clientIdHeader ? { "x-client-id": clientIdHeader } : {}),
    ...(authHeader ? { Authorization: authHeader } : {}),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const searchParams = request.nextUrl.search;
  const pathWithQuery = searchParams ? `${path}${searchParams}` : path;
  const targetUrls = getTargetUrls(pathWithQuery);
  const forwardHeaders = await extractForwardHeaders(request);

  let lastStatus = 502;
  let lastData: any = { success: false, error: "Backend payments service is temporarily unavailable" };

  for (const url of targetUrls) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          ...forwardHeaders,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }

      const errData = await res.json().catch(() => ({}));
      if (res.status < 500) {
        return NextResponse.json(errData, { status: res.status });
      }
      lastStatus = res.status;
      lastData = errData;
    } catch (err) {
      console.warn(`[Client Payments Proxy GET] Fetch failed for ${url}:`, err);
    }
  }

  return NextResponse.json(lastData, { status: lastStatus });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const targetUrls = getTargetUrls(path);
  const forwardHeaders = await extractForwardHeaders(request);

  let lastStatus = 502;
  let lastData: any = { success: false, error: "Backend payments service is temporarily unavailable" };

  try {
    const body = await request.json().catch(() => ({}));

    for (const url of targetUrls) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            ...forwardHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          cache: "no-store",
          signal: AbortSignal.timeout(30000),
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }

        const errData = await res.json().catch(() => ({}));
        if (res.status < 500) {
          return NextResponse.json(errData, { status: res.status });
        }
        lastStatus = res.status;
        lastData = errData;
      } catch (err) {
        console.warn(`[Client Payments Proxy POST] Fetch failed for ${url}:`, err);
      }
    }

    return NextResponse.json(lastData, { status: lastStatus });
  } catch (err) {
    console.error(`[Client Payments Proxy POST] Error:`, err);
    return NextResponse.json(lastData, { status: lastStatus });
  }
}
