import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ configured: false, database: "not checked" }, { status: 503 });
  const result = await Promise.race([
    supabase.from("jobs").select("id", { head: true, count: "exact" }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Supabase connection timed out after 5 seconds.")), 5000)),
  ]).catch((error: Error) => ({ error }));
  const { error } = result;
  if (error) return NextResponse.json({ configured: true, database: "migration required", message: error.message }, { status: 503 });
  return NextResponse.json({ configured: true, database: "ready" });
}
