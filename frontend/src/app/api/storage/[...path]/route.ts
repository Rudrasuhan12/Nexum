import { NextRequest, NextResponse } from "next/server";
import { getObjectStream } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await context.params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const key = pathSegments.join("/");
    const result = await getObjectStream(key);

    if (!result) {
      return new NextResponse("Object not found in storage", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", result.contentType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    if (result.contentLength) {
      headers.set("Content-Length", String(result.contentLength));
    }

    // Stream response
    if (Buffer.isBuffer(result.stream)) {
      return new NextResponse(new Uint8Array(result.stream), { status: 200, headers });
    }

    // Web / Node stream to Response
    return new Response(result.stream as any, { status: 200, headers });
  } catch (err: unknown) {
    console.error("Storage streaming error:", err);
    return new NextResponse("Internal Storage Error", { status: 500 });
  }
}
