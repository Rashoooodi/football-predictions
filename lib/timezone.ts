export function ensureTimezone(ts: string | null | undefined): string | null {
  if (!ts) return null;
  if (/Z$/i.test(ts) || /[+-]\d{2}:?\d{2}$/.test(ts)) return ts;
  return `${ts}+03:00`;
}

export function parseSqliteDateTime(value: string): Date {
  if (/Z$/i.test(value) || /[+-]\d{2}:?\d{2}$/.test(value)) {
    return new Date(value.includes("T") ? value : value.replace(" ", "T"));
  }
  return new Date(value.replace(" ", "T") + "Z");
}

export function isStillLocked(lockedUntil: string | null | undefined, now = new Date()): boolean {
  if (!lockedUntil) return false;
  return parseSqliteDateTime(lockedUntil) > now;
}
