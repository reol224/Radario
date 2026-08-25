const countryNames = ["Argentina", "Australia", "Austria", "Belgium", "Brazil", "Bulgaria", "Canada", "Chile", "China", "Croatia", "Czechia", "Denmark", "Egypt", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "India", "Indonesia", "Ireland", "Israel", "Italy", "Japan", "Latvia", "Lithuania", "Luxembourg", "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand", "Norway", "Philippines", "Poland", "Portugal", "Romania", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Thailand", "Turkey", "United Arab Emirates", "United Kingdom", "United States", "Vietnam"];
const locationHints: Record<string, string> = {
  "new york": "United States", "san francisco": "United States", "los angeles": "United States", "chicago": "United States", "boston": "United States",
  "toronto": "Canada", "montreal": "Canada", "vancouver": "Canada", "ottawa": "Canada", "calgary": "Canada",
  "bengaluru": "India", "bangalore": "India", "mumbai": "India", "delhi": "India", "hyderabad": "India",
  "london": "United Kingdom", "manchester": "United Kingdom", "dublin": "Ireland", "sydney": "Australia", "melbourne": "Australia",
};

export function inferCountry(location: string | null | undefined) {
  const value = location?.trim() ?? "";
  if (!value) return null;
  const lower = value.toLowerCase();
  const explicit = countryNames.find((country) => lower.includes(country.toLowerCase()));
  if (explicit) return explicit;
  const hint = Object.entries(locationHints).find(([city]) => lower.includes(city));
  return hint?.[1] ?? null;
}
