const USERNAME_RE = /^[a-z0-9._]+$/;
const MAX_GOALS = 99;
const MIN_USERNAME_LEN = 3;
const MAX_USERNAME_LEN = 32;
const MIN_NAME_LEN = 2;
const MAX_NAME_LEN = 80;
const MIN_PIN_LEN = 4;
const MAX_PIN_LEN = 32;

export function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const username = raw.trim().toLowerCase();
  if (username.length < MIN_USERNAME_LEN || username.length > MAX_USERNAME_LEN) {
    return null;
  }
  if (!USERNAME_RE.test(username)) return null;
  return username;
}

export function isValidDisplayName(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  const name = raw.trim();
  return name.length >= MIN_NAME_LEN && name.length <= MAX_NAME_LEN;
}

export function isValidPin(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  const pin = raw.trim();
  return pin.length >= MIN_PIN_LEN && pin.length <= MAX_PIN_LEN;
}

export function parseMatchId(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw > 0) return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw)) {
    const n = Number.parseInt(raw, 10);
    return n > 0 ? n : null;
  }
  return null;
}

export function isValidScore(raw: unknown): raw is number {
  return (
    typeof raw === "number" &&
    Number.isInteger(raw) &&
    raw >= 0 &&
    raw <= MAX_GOALS
  );
}

export const SCORE_LIMITS = {
  MAX_GOALS,
  MIN_USERNAME_LEN,
  MAX_USERNAME_LEN,
  MIN_NAME_LEN,
  MAX_NAME_LEN,
  MIN_PIN_LEN,
  MAX_PIN_LEN,
} as const;
