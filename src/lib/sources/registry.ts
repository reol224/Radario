import { manualSource } from "./manual";
import type { JobSource } from "./types";

export type SourceDescriptor = {
  id: string;
  name: string;
  category: "manual" | "public-board" | "company-careers";
  applicantCounts: "available" | "unavailable" | "source-dependent";
  status: "active" | "planned";
  complianceNote: string;
  source?: JobSource;
};

export const sourceDescriptors: SourceDescriptor[] = [
  { id: "manual", name: "Manual URL intake", category: "manual", applicantCounts: "unavailable", status: "active", complianceNote: "You provide the listing URL; no automated fetching is performed.", source: manualSource },
  { id: "company-careers", name: "Company career pages", category: "company-careers", applicantCounts: "source-dependent", status: "planned", complianceNote: "Only public, permitted pages with respectful rate limits.", },
  { id: "greenhouse", name: "Greenhouse", category: "company-careers", applicantCounts: "unavailable", status: "planned", complianceNote: "Use public feeds or approved APIs; applicant counts stay unknown when unavailable.", },
  { id: "lever", name: "Lever", category: "company-careers", applicantCounts: "unavailable", status: "planned", complianceNote: "Use public postings or approved APIs; never bypass access controls.", },
  { id: "linkedin", name: "LinkedIn", category: "public-board", applicantCounts: "source-dependent", status: "planned", complianceNote: "Requires an approved integration or user-provided data; no anti-bot bypassing.", },
  { id: "indeed", name: "Indeed", category: "public-board", applicantCounts: "source-dependent", status: "planned", complianceNote: "Requires an approved integration and compliance with site terms.", },
];

export const activeSources = sourceDescriptors.flatMap((descriptor) => descriptor.source ? [descriptor.source] : []);
