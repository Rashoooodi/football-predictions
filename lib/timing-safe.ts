import crypto from "crypto";

export function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    const dummy = Buffer.alloc(aBuf.length);
    crypto.timingSafeEqual(aBuf, dummy);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function bearerMatches(header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;
  return timingSafeEqualString(header.slice(prefix.length), secret);
}
