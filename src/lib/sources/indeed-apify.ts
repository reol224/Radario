import type { ApplicantCount, NormalizedJob } from "@/lib/jobs/types";
import type { JobSource, RawJob, SourceSearchQuery } from "./types";
import { inferCountry } from "@/lib/jobs/location";

type ActorJob = Record<string, unknown>;
const read = (job: ActorJob, ...keys: string[]) => keys.map((key) => job[key]).find((value) => typeof value === "string" && value.trim()) as string | undefined;
const technologies = ["Java", "Spring", "Spring Boot", "SQL", "REST", "React", "TypeScript", "PostgreSQL", "MySQL", "Python", "AWS", "Docker"];

function parsePostedDate(value: string | undefined, now = new Date()): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime()) && !/^\s*\d+\s+(hour|day|week|month)s?\s+ago\s*$/i.test(value)) return parsed.toISOString();
  const normalized = value.trim().toLowerCase();
  if (normalized === "today") return now.toISOString();
  if (normalized === "yesterday") return new Date(now.getTime() - 86_400_000).toISOString();
  const relative = normalized.match(/^(\d+)\s+(hour|day|week|month)s?\s+ago$/);
  if (!relative) return null;
  const amount = Number(relative[1]);
  const unit = relative[2];
  const milliseconds = unit === "hour" ? amount * 3_600_000 : unit === "day" ? amount * 86_400_000 : unit === "week" ? amount * 7 * 86_400_000 : amount * 30 * 86_400_000;
  return new Date(now.getTime() - milliseconds).toISOString();
}

function remoteType(location: string) {
  const value = location.toLowerCase();
  if (/\bhybrid\b/.test(value)) return "hybrid" as const;
  if (/\bremote\b/.test(value)) return /\b(only|within|based|germany|italy|europe)\b/.test(value) ? "restricted_remote" as const : "fully_remote" as const;
  return "on_site" as const;
}

/** Uses the public Apify actor from the referenced repository. */
export class ApifyIndeedSource implements JobSource {
  readonly id = "indeed";
  private readonly token: string;
  private readonly actorId: string;

  constructor(token = process.env.APIFY_API_TOKEN, actorId = process.env.APIFY_INDEED_ACTOR_ID ?? "orgupdate/indeed-jobs-scraper") {
    this.token = token?.trim() ?? "";
    this.actorId = actorId.trim();
    if (!this.token) throw new Error("Indeed discovery is not configured. Add APIFY_API_TOKEN to the server environment.");
  }

  async search(query: SourceSearchQuery): Promise<RawJob[]> {
    const endpoint = `https://api.apify.com/v2/acts/${this.actorId.replace("/", "~")}/run-sync-get-dataset-items?token=${encodeURIComponent(this.token)}`;
    const response = await fetch(endpoint, {
      method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ countryName: "all", includeKeyword: query.term, locationName: query.countries.join(", "), datePosted: "3days", pagesToFetch: 1 }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Apify Indeed actor returned ${response.status}.`);
    const items = await response.json() as unknown;
    if (!Array.isArray(items)) return [];
    return items.filter((item): item is ActorJob => Boolean(item && typeof item === "object")).map((job, index) => {
      const url = read(job, "jobUrl", "URL", "url", "job_url") ?? "";
      const stableFallback = [url, read(job, "jobTitle", "job_title", "title"), read(job, "companyName", "company_name", "company"), read(job, "location", "job_location"), read(job, "postedDate", "date", "posted_at")].filter(Boolean).join("|");
      return { sourceJobId: read(job, "job_key", "id") ?? (stableFallback || `${query.term}:${index}`), url, fetchedAt: new Date().toISOString(), payload: job };
    }).filter((job) => job.url);
  }

  async fetchJob(url: string) {
    const jobs = await this.search({ term: url, countries: [], remoteTypes: [] });
    return jobs.find((job) => job.url === url) ?? null;
  }

  async normalize(raw: RawJob): Promise<Omit<NormalizedJob, "id" | "opportunityScore" | "createdAt" | "updatedAt">> {
    const title = read(raw.payload, "jobTitle", "job_title", "title") ?? "Untitled Indeed opportunity";
    const company = read(raw.payload, "companyName", "company_name", "company") ?? "Unknown company";
    const location = read(raw.payload, "location", "job_location") ?? "";
    const description = read(raw.payload, "description", "snippet") ?? null;
    const searchable = `${title} ${description ?? ""}`;
    const now = new Date().toISOString();
    return {
      source: this.id, sourceJobId: raw.sourceJobId, url: raw.url, title, company, companyUrl: null, location: location || null,
      country: inferCountry(location),
      remoteType: remoteType(location), remoteRestriction: null, description, salaryMin: null, salaryMax: null, salaryCurrency: null,
      employmentType: read(raw.payload, "job_type", "employment_type") ?? null,
      experienceLevel: /\b(junior|graduate|entry[ -]?level|associate)\b/i.test(searchable) ? "junior" : null,
      technologies: technologies.filter((technology) => searchable.toLowerCase().includes(technology.toLowerCase())),
      postedAt: parsePostedDate(read(raw.payload, "postedDate", "date", "posted_at")), firstSeenAt: now, lastSeenAt: now,
      applicantCount: null, applicationUrl: raw.url, jobStatus: "new", duplicateGroupId: null,
    };
  }

  async getApplicantCount(): Promise<ApplicantCount | null> { return null; }
}
