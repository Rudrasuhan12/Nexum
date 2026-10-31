import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/notifications/queue/dlq`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ success: true, count: 0, deadLetters: [] });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: true, count: 0, deadLetters: [] });
  }
}

