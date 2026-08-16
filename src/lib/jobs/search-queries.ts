import type { SearchPreferences } from "./types";

export function generateSearchQueries(preferences: SearchPreferences): string[] {
  const roles = preferences.desiredRoles.map((role) => role.trim()).filter(Boolean);
  const keywords = preferences.positiveKeywords.map((keyword) => keyword.trim()).filter(Boolean);
  const expanded = roles.flatMap((role) => [
    role,
    ...keywords.slice(0, 3).map((keyword) => `${role} ${keyword}`),
  ]);
  const technologyQueries = keywords.slice(0, 6).map((keyword) => `${keyword} Developer`);
  return [...new Set([...expanded, ...technologyQueries].map((query) => query.trim()).filter(Boolean))];
}
