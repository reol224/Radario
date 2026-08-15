import type { NormalizedJob, SearchPreferences } from "./types";

export type ScoreBreakdown = { label: string; points: number };
export type ScoreResult = { score: number; breakdown: ScoreBreakdown[]; summary: string };

const hoursSince = (date: string | null, now: Date) => date ? (now.getTime() - new Date(date).getTime()) / 3_600_000 : null;

export function scoreOpportunity(job: NormalizedJob, preferences: SearchPreferences, now = new Date()): ScoreResult {
  const breakdown: ScoreBreakdown[] = [];
  const add = (label: string, points: number) => breakdown.push({ label, points });
  const hours = hoursSince(job.postedAt, now);
  if (hours !== null) {
    if (hours < 6) add("Posted within 6 hours", 30);
    else if (hours < 24) add("Posted within 24 hours", 25);
    else if (hours < 72) add("Posted within 3 days", 15);
    else if (hours < 168) add("Posted within 7 days", 5);
  }
  const applicants = job.applicantCount?.exact;
  if (applicants !== null && applicants !== undefined) {
    if (applicants < 10) add("Fewer than 10 applicants", 30);
    else if (applicants <= 25) add("10–25 applicants", 25);
    else if (applicants <= 50) add("26–50 applicants", 15);
    else if (applicants <= 100) add("51–100 applicants", 5);
    else if (applicants > 250) add("Over 250 applicants", -25);
    else if (applicants > 100) add("Over 100 applicants", -10);
  }
  const haystack = `${job.title} ${job.description ?? ""}`.toLowerCase();
  if (/\b(senior|staff|principal|lead|manager|director|architect)\b/.test(haystack)) add("Senior leadership wording", -50);
  else if (/\b(junior|graduate|entry[ -]?level|associate)\b/.test(haystack)) add("Junior or graduate role", 15);
  else add("Experience level unspecified", 5);
  if (job.remoteType === "fully_remote") add("Fully remote", 20);
  if (job.remoteType === "restricted_remote") add("Remote with geographic restriction", 10);
  if (job.remoteType === "hybrid") add("Hybrid", 3);
  if (job.country && preferences.preferredCountries.some((country) => country.toLowerCase() === job.country?.toLowerCase())) add("Preferred country", 10);
  for (const keyword of preferences.positiveKeywords) {
    if (haystack.includes(keyword.toLowerCase()) || job.technologies.some((technology) => technology.toLowerCase() === keyword.toLowerCase())) {
      add(keyword.toLowerCase().includes("spring") || keyword.toLowerCase() === "java" ? `${keyword} match` : `${keyword} preference match`, keyword.toLowerCase().includes("spring") || keyword.toLowerCase() === "java" ? 10 : 3);
    }
  }
  const score = Math.max(0, Math.min(100, breakdown.reduce((total, signal) => total + signal.points, 0)));
  return { score, breakdown, summary: score >= 80 ? "Recent and low-competition with strong preference signals." : "Ranked from transparent freshness, competition, and preference signals." };
}
