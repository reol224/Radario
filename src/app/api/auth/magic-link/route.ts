import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  if (!body || typeof body.email !== "string" || !/^\S+@\S+\.\S+$/.test(body.email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local." }, { status: 503 });
  const { error } = await supabase.auth.signInWithOtp({ email: body.email, options: { emailRedirectTo: new URL("/", request.url).toString() } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
