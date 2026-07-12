import { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Attackers can send fake IPs in this header. A trusted proxy (like Caddy/Nginx)
    // will always APPEND the true connection IP to the end of the list.
    const ips = forwardedFor.split(",").map(s => s.trim());
    return ips[ips.length - 1];
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function ensureTimezone(ts: string | null | undefined): string | null {
  if (!ts) return null;
  if (ts.includes("+") || ts.includes("Z")) return ts;
  return `${ts}+03:00`; // Default to Asia/Bahrain
}
