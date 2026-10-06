import { NextRequest } from "next/server";
import { resolveClientIp } from "./parse-ip";

export { ensureTimezone } from "./timezone";

export function getClientIp(request: NextRequest): string {
  return resolveClientIp(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip")
  );
}
