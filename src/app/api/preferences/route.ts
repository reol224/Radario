import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { RemoteType } from "@/lib/jobs/types";
import { isMissingTable, migrationRequiredMessage } from "@/lib/supabase/schema";

const remoteTypes: RemoteType[] = ["fully_remote", "restricted_remote", "hybrid", "on_site", "unknown"];
const asList = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === "string") ? value as string[] : null;
const localFallback = (userId: string) => ({
  user_id: userId,
  desired_roles: [],
  positive_keywords: [],
  negative_keywords: [],
  preferred_countries: [],
  allowed_remote_types: ["fully_remote", "restricted_remote", "hybrid"],
});
const isMissingPreferencesTable = (error: { code?: string; message?: string } | null) => isMissingTable(error, "search_preferences");

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.from("search_preferences").select("*").eq("user_id", user.id).maybeSingle();
  if (error) {
    // Preferences are also persisted in the browser. Keep Settings usable while
    // an existing Supabase project is waiting for the initial migration.
    if (isMissingPreferencesTable(error)) return NextResponse.json({ preferences: localFallback(user.id), storage: "local", warning: migrationRequiredMessage() });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ preferences: data ?? localFallback(user.id), storage: data ? "remote" : "local" });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  const desiredRoles = asList(body.desiredRoles);
  const positiveKeywords = asList(body.positiveKeywords);
  const negativeKeywords = asList(body.negativeKeywords);
  const preferredCountries = asList(body.preferredCountries);
  const allowedRemoteTypes = asList(body.allowedRemoteTypes);
  if (!desiredRoles || !positiveKeywords || !negativeKeywords || !preferredCountries || !allowedRemoteTypes || allowedRemoteTypes.some((type) => !remoteTypes.includes(type as RemoteType))) return NextResponse.json({ error: "Preferences must contain string arrays and valid remote types." }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.from("search_preferences").upsert({ user_id: user.id, desired_roles: desiredRoles, positive_keywords: positiveKeywords, negative_keywords: negativeKeywords, preferred_countries: preferredCountries, allowed_remote_types: allowedRemoteTypes, updated_at: new Date().toISOString() }).select("*").single();
  if (error) {
    if (isMissingPreferencesTable(error)) return NextResponse.json({ preferences: body, storage: "local", warning: `${migrationRequiredMessage()}` });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ preferences: data, storage: "remote" });
}
