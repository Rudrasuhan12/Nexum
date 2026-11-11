import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { INITIAL_FREELANCERS } from "@/lib/mock-freelancers";
import { getBackendUrl } from "@/lib/backend-url";

const BACKEND_URL = getBackendUrl();

const FALLBACK_RENDER_URL = "https://nexum-79g2.onrender.com";

function getTargetUrls(queryString: string): string[] {
  const isCloudOrProd =
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production" ||
    (typeof window === "undefined" && Boolean(process.env.AWS_REGION));

  const isLocalhost =
    !BACKEND_URL ||
    BACKEND_URL.includes("localhost") ||
    BACKEND_URL.includes("127.0.0.1");

  if (isCloudOrProd && isLocalhost) {
    return [`${FALLBACK_RENDER_URL}/api/client/freelancers?${queryString}`];
  }

  const primary = `${BACKEND_URL}/api/client/freelancers?${queryString}`;
  if (isLocalhost && !BACKEND_URL.includes("onrender.com")) {
    return [primary, `${FALLBACK_RENDER_URL}/api/client/freelancers?${queryString}`];
  }
  return [primary];
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    if (!searchParams.has("clientId") && user?.id) {
      searchParams.set("clientId", user.id);
    }

    // Attempt to proxy to Express backend
    const targetUrls = getTargetUrls(searchParams.toString());
    for (const url of targetUrls) {
      try {
        const res = await fetch(url, {
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          const json = await res.json();
          return NextResponse.json(json, {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });
        }
      } catch {
        // Try next fallback
      }
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "9", 10));
    const offset = (page - 1) * limit;
    const paginated = INITIAL_FREELANCERS.slice(offset, offset + limit);

    return NextResponse.json(
      {
        success: true,
        count: paginated.length,
        total: INITIAL_FREELANCERS.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(INITIAL_FREELANCERS.length / limit)),
        hasMore: page * limit < INITIAL_FREELANCERS.length,
        data: paginated,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

