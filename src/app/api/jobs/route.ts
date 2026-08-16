import { NextRequest, NextResponse } from "next/server";
import { manualSource } from "@/lib/sources/manual";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ jobs: [], persistence: "local-only" });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ jobs: [], persistence: "local-only" });
  const { data, error } = await supabase.from("user_jobs").select("status, applied_at, last_contact_at, next_follow_up_at, notes, jobs(*)");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const jobs = (data ?? []).flatMap((row) => {
    const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
    return job ? [{ ...job, user_status: row.status, applied_at: row.applied_at, last_contact_at: row.last_contact_at, next_follow_up_at: row.next_follow_up_at, notes: row.notes }] : [];
  });
  return NextResponse.json({ jobs, persistence: "supabase" });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { url?: unknown } | null;
  if (!body || typeof body.url !== "string") return NextResponse.json({ error: "A job URL is required." }, { status: 400 });
  try { new URL(body.url); } catch { return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 }); }
  const raw = await manualSource.fetchJob(body.url);
  const job = await manualSource.normalize(raw);
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ job, persistence: "local-only", note: "Configure Supabase to persist manual jobs." }, { status: 201 });

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ job, persistence: "local-only", note: "Sign in to sync this job across devices." }, { status: 201 });

  const { data: persisted, error: jobError } = await supabase.from("jobs").upsert({
    source: job.source,
    source_job_id: job.sourceJobId,
    url: job.url,
    title: job.title,
    company: job.company,
    company_url: job.companyUrl,
    location: job.location,
    country: job.country,
    remote_type: job.remoteType,
    remote_restriction: job.remoteRestriction,
    description: job.description,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    salary_currency: job.salaryCurrency,
    employment_type: job.employmentType,
    experience_level: job.experienceLevel,
    technologies: job.technologies,
    posted_at: job.postedAt,
    first_seen_at: job.firstSeenAt,
    last_seen_at: job.lastSeenAt,
    application_url: job.applicationUrl,
    opportunity_score: 0,
    applicant_count_exact: job.applicantCount?.exact ?? null,
    applicant_count_lower_bound: job.applicantCount?.lowerBound ?? null,
    applicant_count_upper_bound: job.applicantCount?.upperBound ?? null,
    applicant_count_is_approximate: job.applicantCount?.isApproximate ?? false,
    applicant_count_source: job.applicantCount?.source ?? null,
    applicant_count_updated_at: job.applicantCount?.observedAt ?? null,
  }, { onConflict: "source,source_job_id" }).select("id").single();
  if (jobError || !persisted) return NextResponse.json({ error: jobError?.message ?? "Could not persist job." }, { status: 500 });

  const { error: stateError } = await supabase.from("user_jobs").upsert({ user_id: userData.user.id, job_id: persisted.id, status: "new" });
  if (stateError) return NextResponse.json({ error: stateError.message }, { status: 500 });
  return NextResponse.json({ job: { ...job, id: persisted.id }, persistence: "supabase" }, { status: 201 });
}
