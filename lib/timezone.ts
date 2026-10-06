export function ensureTimezone(ts: string | null | undefined): string | null {
  if (!ts) return null;
  if (ts.includes("+") || ts.includes("Z")) return ts;
  return `${ts}+03:00`;
}
