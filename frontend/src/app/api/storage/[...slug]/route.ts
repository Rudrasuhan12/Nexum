import { NextRequest, NextResponse } from "next/server";
import { getObjectStream } from "@/lib/storage";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const path = slug.join("/");

  // 1. First check local storage / Neon S3 / in-memory buffer
  try {
    const localResult = await getObjectStream(path);
    if (localResult) {
      const headers = new Headers();
      headers.set("Content-Type", localResult.contentType);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      if (localResult.contentLength) {
        headers.set("Content-Length", String(localResult.contentLength));
      }
      if (Buffer.isBuffer(localResult.stream)) {
        return new NextResponse(new Uint8Array(localResult.stream), { status: 200, headers });
      }
      return new Response(localResult.stream as any, { status: 200, headers });
    }
  } catch (localErr) {
    console.warn("[Storage] Local stream lookup fallback to backend:", localErr);
  }

  // 2. Fallback to Express backend storage proxy
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/api/storage/${path}${search}`;

  const cookieHeader = request.headers.get("cookie") || "";
  const originHeader =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    "http://localhost:3000";

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Origin": originHeader,
        "x-nexum-internal": "true",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: { message: "Storage artifact not found" } },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = res.headers.get("content-disposition") || `inline; filename="${slug[slug.length - 1] || "artifact"}"`;
    const contentLength = res.headers.get("content-length");

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
      "Cache-Control": "public, max-age=86400",
    };
    if (contentLength) headers["Content-Length"] = contentLength;

    const arrayBuffer = await res.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error(`[Storage Proxy] Failed to fetch ${targetUrl}:`, err);
    return NextResponse.json(
      { error: { message: "Storage service unavailable" } },
      { status: 502 }
    );
  }
}
