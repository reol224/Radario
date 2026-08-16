import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") || "/";
  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL("/login?error=supabase_not_configured", request.url));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", request.url));
}
