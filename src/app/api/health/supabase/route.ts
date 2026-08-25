import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingTable, migrationRequiredMessage } from "@/lib/supabase/schema";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ configured: false, database: "not checked" }, { status: 503 });
  const result = await Promise.race([
    supabase.from("jobs").select("id", { head: true, count: "exact" }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Supabase connection timed out after 5 seconds.")), 5000)),
  ]).catch((error: Error) => ({ error }));
  const { error } = result;
  if (error) return NextResponse.json({ configured: true, database: isMissingTable(error, "jobs") ? "migration required" : "unavailable", message: isMissingTable(error, "jobs") ? migrationRequiredMessage("jobs") : error.message }, { status: 503 });
  const preferences = await supabase.from("search_preferences").select("user_id", { head: true, count: "exact" });
  if (preferences.error && isMissingTable(preferences.error, "search_preferences")) return NextResponse.json({ configured: true, database: "migration required", message: migrationRequiredMessage() }, { status: 503 });
  return NextResponse.json({ configured: true, database: preferences.error ? "partially ready" : "ready" });
}
