import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const intervals = [1, 3, 6, 12, 24];

async function authenticatedClient() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await authenticatedClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.from("discovery_schedules").select("*").eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ schedule: data });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const intervalHours = Number(body?.intervalHours);
  const minimumScore = Number(body?.minimumScore);
  const maximumApplicants = Number(body?.maximumApplicants);
  const postedWithinHours = Number(body?.postedWithinHours);
  const remoteEurope = body?.remoteEurope === true;
  const emailEnabled = body?.emailEnabled === true;
  if (!intervals.includes(intervalHours) || !Number.isInteger(minimumScore) || minimumScore < 0 || minimumScore > 100 || !Number.isInteger(maximumApplicants) || maximumApplicants < 1 || !Number.isInteger(postedWithinHours) || postedWithinHours < 1) return NextResponse.json({ error: "Enter valid schedule thresholds." }, { status: 400 });
  const { supabase, user } = await authenticatedClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const now = new Date();
  const nextRun = new Date(now.getTime() + intervalHours * 3_600_000).toISOString();
  const { data, error } = await supabase.from("discovery_schedules").upsert({ user_id: user.id, interval_hours: intervalHours, minimum_score: minimumScore, maximum_applicants: maximumApplicants, posted_within_hours: postedWithinHours, remote_europe: remoteEurope, email_enabled: emailEnabled, next_run_at: nextRun, updated_at: now.toISOString() }, { onConflict: "user_id" }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ schedule: data });
}
