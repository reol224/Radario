import { NextRequest, NextResponse } from "next/server";
import { manualSource } from "@/lib/sources/manual";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { url?: unknown } | null;
  if (!body || typeof body.url !== "string") return NextResponse.json({ error: "A job URL is required." }, { status: 400 });
  try { new URL(body.url); } catch { return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 }); }
  const raw = await manualSource.fetchJob(body.url);
  const job = await manualSource.normalize(raw);
  return NextResponse.json({ job, persistence: "local-only", note: "Configure Supabase to persist manual jobs." }, { status: 201 });
}
