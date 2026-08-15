import type { ApplicantCount, NormalizedJob } from "@/lib/jobs/types";

export type SourceSearchQuery = { term: string; countries: string[]; remoteTypes: string[] };
export type RawJob = { sourceJobId: string; url: string; fetchedAt: string; payload: Record<string, unknown> };

export interface JobSource {
  readonly id: string;
  search(query: SourceSearchQuery): Promise<RawJob[]>;
  fetchJob(url: string): Promise<RawJob | null>;
  normalize(raw: RawJob): Promise<Omit<NormalizedJob, "id" | "opportunityScore" | "createdAt" | "updatedAt">>;
  getApplicantCount(raw: RawJob): Promise<ApplicantCount | null>;
}

/** Sources must honor terms, robots.txt, rate limits, and access controls. */
export class UnsupportedSourceError extends Error {}
