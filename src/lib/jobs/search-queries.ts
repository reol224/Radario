import type { SearchPreferences } from "./types";

export function generateSearchQueries(preferences: SearchPreferences): string[] {
  const keywords = preferences.positiveKeywords.slice(0, 2).join(" ");
  const expanded = preferences.desiredRoles.flatMap((role) => [role, keywords ? `${role} ${keywords}` : role]);
  return [...new Set(expanded.map((query) => query.trim()).filter(Boolean))];
}
