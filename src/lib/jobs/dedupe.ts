import type { NormalizedJob } from "./types";

const normalize = (value: string | null) => (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Conservative grouping: keep records distinct unless company/title and a location or application URL agree. */
export function areLikelyDuplicates(a: NormalizedJob, b: NormalizedJob): boolean {
  if (a.source === b.source && a.sourceJobId && a.sourceJobId === b.sourceJobId) return true;
  const sameCompany = normalize(a.company) === normalize(b.company);
  const sameTitle = normalize(a.title) === normalize(b.title);
  const sameUrl = Boolean(a.applicationUrl && b.applicationUrl && a.applicationUrl === b.applicationUrl);
  const sameLocation = normalize(a.location) === normalize(b.location);
  return sameUrl || (sameCompany && sameTitle && sameLocation);
}

export function groupDuplicates(jobs: NormalizedJob[]): NormalizedJob[][] {
  const groups: NormalizedJob[][] = [];
  for (const job of jobs) {
    const group = groups.find((candidate) => candidate.some((existing) => areLikelyDuplicates(existing, job)));
    if (group) group.push(job); else groups.push([job]);
  }
  return groups;
}
