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
        const normalized = await source.normalize(raw);
        const result = scoreOpportunity({ ...normalized, id: crypto.randomUUID(), opportunityScore: 0, createdAt: normalized.firstSeenAt, updatedAt: normalized.lastSeenAt }, preferences);
        jobs.push({ ...normalized, id: crypto.randomUUID(), opportunityScore: result.score, createdAt: normalized.firstSeenAt, updatedAt: normalized.lastSeenAt });
      }
    } catch (error) { failures.push({ source: source.id, message: error instanceof Error ? error.message : "Unknown source failure" }); }
  }
  return { jobs: groupDuplicates(jobs).map((group) => group.sort((a, b) => b.opportunityScore - a.opportunityScore)[0]), failures };
}
