/**
 * Normalizes PostgreSQL connection strings for pg v8.23+ so sslmode=require / prefer
 * explicitly opts into libpq compatibility without emitting runtime deprecation warnings.
 */
export function normalizePgConnectionString(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return trimmed;
  try {
    const parsed = new URL(trimmed);
    const sslMode = parsed.searchParams.get("sslmode");
    if (
      (sslMode === "require" || sslMode === "prefer" || sslMode === "verify-ca") &&
      !parsed.searchParams.has("uselibpqcompat")
    ) {
      parsed.searchParams.set("uselibpqcompat", "true");
      return parsed.toString();
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}
