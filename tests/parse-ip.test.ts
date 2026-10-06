import { describe, expect, it } from "vitest";
import { parseForwardedFor, resolveClientIp } from "../lib/parse-ip";

describe("parseForwardedFor", () => {
  it("returns null for empty", () => {
    expect(parseForwardedFor(null)).toBeNull();
    expect(parseForwardedFor("")).toBeNull();
  });

  it("takes the last hop as the real client", () => {
    expect(parseForwardedFor("1.1.1.1, 8.8.8.8")).toBe("8.8.8.8");
  });
});

describe("resolveClientIp", () => {
  it("prefers forwarded-for last hop", () => {
    expect(resolveClientIp("10.0.0.1, 203.0.113.9", "127.0.0.1")).toBe(
      "203.0.113.9"
    );
  });

  it("falls back to x-real-ip then unknown", () => {
    expect(resolveClientIp(null, "9.9.9.9")).toBe("9.9.9.9");
    expect(resolveClientIp(null, null)).toBe("unknown");
  });
});
