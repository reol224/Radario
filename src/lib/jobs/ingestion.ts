import { groupDuplicates } from "./dedupe";
import { scoreOpportunity } from "./score";
import type { NormalizedJob, SearchPreferences } from "./types";
import type { JobSource, SourceSearchQuery } from "@/lib/sources/types";

export type IngestionResult = { jobs: NormalizedJob[]; failures: { source: string; message: string }[] };

/** Queue-ready orchestration: a scheduler can invoke this without changing a source adapter. */
export async function ingestSources(sources: JobSource[], query: SourceSearchQuery, preferences: SearchPreferences): Promise<IngestionResult> {
  const jobs: NormalizedJob[] = [];
  const failures: { source: string; message: string }[] = [];
  for (const source of sources) {
    try {
      const rawJobs = await source.search(query);
      for (const raw of rawJobs) {
        try {
          const normalized = await source.normalize(raw);
          const applicantCount = await source.getApplicantCount(raw);
          const id = crypto.randomUUID();
          const candidate = { ...normalized, applicantCount, id, opportunityScore: 0, createdAt: normalized.firstSeenAt, updatedAt: normalized.lastSeenAt };
          const result = scoreOpportunity(candidate, preferences);
          jobs.push({ ...candidate, opportunityScore: result.score });
        } catch (error) {
          failures.push({ source: source.id, message: `Job ${raw.sourceJobId}: ${error instanceof Error ? error.message : "normalization failed"}` });
        }
      }
    } catch (error) { failures.push({ source: source.id, message: error instanceof Error ? error.message : "Unknown source failure" }); }
  }
  return { jobs: groupDuplicates(jobs).map((group) => group.sort((a, b) => b.opportunityScore - a.opportunityScore)[0]), failures };
}
