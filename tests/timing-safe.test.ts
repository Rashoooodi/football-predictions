import { describe, expect, it } from "vitest";
import { bearerMatches, timingSafeEqualString } from "../lib/timing-safe";

describe("timingSafeEqualString", () => {
  it("matches equal strings", () => {
    expect(timingSafeEqualString("secret", "secret")).toBe(true);
  });

  it("rejects different strings", () => {
    expect(timingSafeEqualString("secret", "secreT")).toBe(false);
    expect(timingSafeEqualString("ab", "abcd")).toBe(false);
  });
});

describe("bearerMatches", () => {
  it("accepts a matching bearer token", () => {
    expect(bearerMatches("Bearer abc", "abc")).toBe(true);
  });

  it("rejects missing or malformed headers", () => {
    expect(bearerMatches(null, "abc")).toBe(false);
    expect(bearerMatches("abc", "abc")).toBe(false);
    expect(bearerMatches("Bearer xyz", "abc")).toBe(false);
    expect(bearerMatches("Bearer abc", "")).toBe(false);
  });
});
