import type { JobSource, RawJob, SourceSearchQuery } from "./types";
import type { ApplicantCount, NormalizedJob } from "@/lib/jobs/types";

export const manualSource: JobSource = {
  id: "manual",
  async search(_query: SourceSearchQuery): Promise<RawJob[]> { return []; },
  async fetchJob(url: string): Promise<RawJob> { return { sourceJobId: url, url, fetchedAt: new Date().toISOString(), payload: {} }; },
  async getApplicantCount(_raw: RawJob): Promise<ApplicantCount | null> { return null; },
  async normalize(raw: RawJob): Promise<Omit<NormalizedJob, "id" | "opportunityScore" | "createdAt" | "updatedAt">> {
    const now = new Date().toISOString();
    return { source: "manual", sourceJobId: raw.sourceJobId, url: raw.url, title: "New opportunity to review", company: "Manual inbox", companyUrl: null, location: null, country: null, remoteType: "unknown", remoteRestriction: null, description: null, salaryMin: null, salaryMax: null, salaryCurrency: null, employmentType: null, experienceLevel: null, technologies: [], postedAt: null, firstSeenAt: now, lastSeenAt: now, applicantCount: null, applicationUrl: raw.url, jobStatus: "new", duplicateGroupId: null };
  },
};
