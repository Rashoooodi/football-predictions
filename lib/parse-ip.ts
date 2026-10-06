export function parseForwardedFor(header: string | null): string | null {
  if (!header) return null;
  const ips = header
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ips.length === 0) return null;
  // Trusted reverse proxies append the true client IP last.
  return ips[ips.length - 1];
}

export function resolveClientIp(
  forwardedFor: string | null,
  realIp: string | null
): string {
  return parseForwardedFor(forwardedFor) || realIp || "unknown";
}
