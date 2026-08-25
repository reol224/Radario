import type { ApplicantCount, NormalizedJob } from "@/lib/jobs/types";
import type { JobSource, RawJob, SourceSearchQuery } from "./types";

type GreenhouseJob = {
  id: number;
  title?: string;
  content?: string;
  location?: { name?: string };
  absolute_url?: string;
  first_published?: string;
  updated_at?: string;
  company?: { name?: string };
};

const technologyVocabulary = ["Java", "Spring", "Spring Boot", "SQL", "REST", "React", "TypeScript", "PostgreSQL", "MySQL", "Python", "AWS", "Docker"];
const stripHtml = (value: string) => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function remoteTypeFor(location: string, description: string): NormalizedJob["remoteType"] {
  const text = `${location} ${description}`.toLowerCase();
  if (/\bhybrid\b/.test(text)) return "hybrid";
  if (/\bremote\b/.test(text)) return /\b(only|within|based in|reside|residing|eligible)\b/.test(text) ? "restricted_remote" : "fully_remote";
  return "on_site";
}

function countryFor(location: string): string | null {
  const countries = ["Italy", "Germany", "France", "Czechia", "Romania", "Poland", "Netherlands", "Spain", "Portugal", "Sweden", "Denmark", "Finland", "Ireland"];
  return countries.find((country) => location.toLowerCase().includes(country.toLowerCase())) ?? null;
}

export class GreenhouseSource implements JobSource {
  readonly id = "greenhouse";
  private readonly boardToken: string;

  constructor(boardToken: string) {
    this.boardToken = boardToken.trim();
    if (!this.boardToken) throw new Error("A Greenhouse board token is required.");
  }

  private async listJobs(): Promise<GreenhouseJob[]> {
    const endpoint = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(this.boardToken)}/jobs?content=true`;
    const response = await fetch(endpoint, { headers: { Accept: "application/json" }, next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`Greenhouse returned ${response.status}.`);
    const payload = await response.json() as { jobs?: GreenhouseJob[] };
    return payload.jobs ?? [];
  }

  private raw(job: GreenhouseJob, fetchedAt = new Date().toISOString()): RawJob {
    return {
      sourceJobId: `${this.boardToken}:${job.id}`,
      url: job.absolute_url ?? `https://boards.greenhouse.io/${this.boardToken}/jobs/${job.id}`,
      fetchedAt,
      payload: job as unknown as Record<string, unknown>,
    };
  }

  async search(query: SourceSearchQuery): Promise<RawJob[]> {
    const term = query.term.trim().toLowerCase();
    if (!term) return [];
    const jobs = await this.listJobs();
    return jobs.filter((job) => `${job.title ?? ""} ${job.content ?? ""} ${job.location?.name ?? ""}`.toLowerCase().includes(term)).map((job) => this.raw(job));
  }

  async fetchJob(url: string): Promise<RawJob | null> {
    const jobs = await this.listJobs();
    const match = jobs.find((job) => job.absolute_url === url || url.endsWith(`/jobs/${job.id}`));
    return match ? this.raw(match) : null;
  }

  async normalize(raw: RawJob): Promise<Omit<NormalizedJob, "id" | "opportunityScore" | "createdAt" | "updatedAt">> {
    const job = raw.payload as unknown as GreenhouseJob;
    const title = job.title?.trim() || "Untitled Greenhouse opportunity";
    const company = job.company?.name?.trim() || this.boardToken;
    const description = stripHtml(job.content ?? "");
    const location = job.location?.name?.trim() || null;
    const searchableText = `${title} ${description}`;
    const now = new Date().toISOString();
    return {
      source: this.id,
      sourceJobId: raw.sourceJobId,
      url: raw.url,
      title,
      company,
      companyUrl: null,
      location,
      country: location ? countryFor(location) : null,
      remoteType: remoteTypeFor(location ?? "", description),
      remoteRestriction: null,
      description,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      employmentType: null,
      experienceLevel: /\b(junior|graduate|entry[ -]?level|associate)\b/i.test(searchableText) ? "junior" : null,
      technologies: technologyVocabulary.filter((technology) => new RegExp(`\\b${escapeRegExp(technology)}\\b`, "i").test(searchableText)),
      postedAt: job.first_published ?? job.updated_at ?? null,
      firstSeenAt: now,
      lastSeenAt: now,
      applicantCount: null,
      applicationUrl: raw.url,
      jobStatus: "new",
      duplicateGroupId: null,
    };
  }

  async getApplicantCount(_raw: RawJob): Promise<ApplicantCount | null> {
    return null;
  }
}
