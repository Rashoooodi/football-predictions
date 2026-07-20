import crypto from "crypto";

export function hashPin(pin: string): string {
  const pepper = process.env.JWT_SECRET;
  if (!pepper) throw new Error("FATAL: JWT_SECRET environment variable is missing (auth-utils). Please set JWT_SECRET in your environment.");
  return crypto.createHash("sha256").update(pin + pepper).digest("hex");
}

// In-memory rate limiter to prevent PIN brute-forcing
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function isRateLimited(ip: string): boolean {
  if (ip === "unknown") return false;

  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 15; // 15 attempts per 15 minutes

  const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }

  record.count += 1;
  rateLimitMap.set(ip, record);

  return record.count > maxRequests;
}
