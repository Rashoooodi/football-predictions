export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0m";
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((ms % (1000 * 60)) / 1000);
  if (h > 0) return h + "h " + m + "m";
  if (m > 0) return m + "m " + s + "s";
  return s + "s";
}

export type MatchPhase = "open" | "locked" | "live" | "finished";

export function matchPhase(
  now: number,
  deadlineMs: number,
  kickoffMs: number,
  liveMs = 2 * 60 * 60 * 1000
): MatchPhase {
  if (now < deadlineMs) return "open";
  if (now < kickoffMs) return "locked";
  if (now < kickoffMs + liveMs) return "live";
  return "finished";
}
