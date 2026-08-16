import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const allowedStatuses = new Set(["new", "saved", "applied", "assessment", "interview", "rejected", "ghosted", "offer", "ignored"]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null) as { status?: unknown; notes?: unknown; nextFollowUpAt?: unknown } | null;
  if (!body || typeof body.status !== "string" || !allowedStatuses.has(body.status)) return NextResponse.json({ error: "A valid application status is required." }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ persistence: "local-only" });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ persistence: "local-only" });

  const state: Record<string, string | null> = { status: body.status };
  if (body.status === "applied") state.applied_at = new Date().toISOString();
  if (typeof body.notes === "string") state.notes = body.notes;
  if (typeof body.nextFollowUpAt === "string") state.next_follow_up_at = body.nextFollowUpAt;
  const { error } = await supabase.from("user_jobs").update(state).eq("user_id", userData.user.id).eq("job_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (body.status !== "new") {
    const { error: eventError } = await supabase.from("job_events").insert({ user_id: userData.user.id, job_id: id, event_type: body.status, metadata: {} });
    if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });
  }
  return NextResponse.json({ persistence: "supabase", status: body.status });
}
