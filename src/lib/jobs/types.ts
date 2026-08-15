export type RemoteType = "fully_remote" | "restricted_remote" | "hybrid" | "on_site" | "unknown";
export type ApplicationStatus = "new" | "saved" | "applied" | "assessment" | "interview" | "rejected" | "ghosted" | "offer" | "ignored";

export type ApplicantCount = {
  exact: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  isApproximate: boolean;
  source: string;
  observedAt: string;
};

export type NormalizedJob = {
  id: string;
  source: string;
  sourceJobId: string | null;
  url: string;
  title: string;
  company: string;
  companyUrl: string | null;
  location: string | null;
  country: string | null;
  remoteType: RemoteType;
  remoteRestriction: string | null;
  description: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  employmentType: string | null;
  experienceLevel: string | null;
  technologies: string[];
  postedAt: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  applicantCount: ApplicantCount | null;
  applicationUrl: string | null;
  jobStatus: ApplicationStatus;
  duplicateGroupId: string | null;
  opportunityScore: number;
  createdAt: string;
  updatedAt: string;
};

export type SearchPreferences = {
  desiredRoles: string[];
  positiveKeywords: string[];
  negativeKeywords: string[];
  preferredCountries: string[];
  allowedRemoteTypes: RemoteType[];
};
