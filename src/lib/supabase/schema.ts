type SupabaseError = { code?: string; message?: string } | null | undefined;

export function isMissingTable(error: SupabaseError, table?: string) {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "PGRST205" || error.code === "42P01" ||
    message.includes("schema cache") || (table ? message.includes(table.toLowerCase()) : false);
}

export function migrationRequiredMessage(table = "search_preferences") {
  return `Supabase is connected, but public.${table} is missing. Apply the SQL migrations in supabase/migrations, then reload the schema cache.`;
}
