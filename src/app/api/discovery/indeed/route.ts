import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ingestSources } from "@/lib/jobs/ingestion";
import type { SearchPreferences } from "@/lib/jobs/types";
import { ApifyIndeedSource } from "@/lib/sources/indeed-apify";
import { isMissingTable, migrationRequiredMessage } from "@/lib/supabase/schema";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { term?: unknown } | null;
  const term = typeof body?.term === "string" ? body.term.trim() : "";
  if (!term) return NextResponse.json({ error: "term is required." }, { status: 400 });
  let source: ApifyIndeedSource;
  try { source = new ApifyIndeedSource(); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Indeed is not configured." }, { status: 503 }); }
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Sign in before running discovery." }, { status: 401 });
  const { data: stored, error: preferenceError } = await supabase.from("search_preferences").select("desired_roles, positive_keywords, negative_keywords, preferred_countries, allowed_remote_types").eq("user_id", userData.user.id).maybeSingle();
  if (preferenceError) return NextResponse.json({ error: isMissingTable(preferenceError, "search_preferences") ? migrationRequiredMessage() : preferenceError.message }, { status: isMissingTable(preferenceError, "search_preferences") ? 503 : 500 });
  const preferences: SearchPreferences = { desiredRoles: stored?.desired_roles ?? [], positiveKeywords: stored?.positive_keywords ?? [], negativeKeywords: stored?.negative_keywords ?? [], preferredCountries: stored?.preferred_countries ?? [], allowedRemoteTypes: stored?.allowed_remote_types ?? ["fully_remote", "restricted_remote", "hybrid"] };
  const result = await ingestSources([source], { term, countries: preferences.preferredCountries, remoteTypes: preferences.allowedRemoteTypes }, preferences);
  let persisted = 0; const failures = [...result.failures];
  for (const job of result.jobs) {
    const { data: saved, error: jobError } = await supabase.from("jobs").upsert({ source: job.source, source_job_id: job.sourceJobId, url: job.url, title: job.title, company: job.company, company_url: job.companyUrl, location: job.location, country: job.country, remote_type: job.remoteType, remote_restriction: job.remoteRestriction, description: job.description, salary_min: job.salaryMin, salary_max: job.salaryMax, salary_currency: job.salaryCurrency, employment_type: job.employmentType, experience_level: job.experienceLevel, technologies: job.technologies, posted_at: job.postedAt, first_seen_at: job.firstSeenAt, last_seen_at: job.lastSeenAt, application_url: job.applicationUrl, opportunity_score: job.opportunityScore, applicant_count_exact: null, applicant_count_source: null }, { onConflict: "source,source_job_id" }).select("id").single();
    if (jobError || !saved) { failures.push({ source: job.source, message: isMissingTable(jobError, "jobs") ? migrationRequiredMessage("jobs") : jobError?.message ?? "Could not persist job." }); continue; }
    const { error: stateError } = await supabase.from("user_jobs").upsert({ user_id: userData.user.id, job_id: saved.id, status: "new" });
    if (stateError) failures.push({ source: job.source, message: isMissingTable(stateError, "user_jobs") ? migrationRequiredMessage("user_jobs") : stateError.message }); else persisted += 1;
  }
  return NextResponse.json({ source: "indeed", discovered: result.jobs.length, persisted, failures, applicantCounts: "unknown" });
}
