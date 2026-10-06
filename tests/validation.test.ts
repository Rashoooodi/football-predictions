import { describe, expect, it } from "vitest";
import {
  isValidDisplayName,
  isValidPin,
  isValidScore,
  normalizeUsername,
  parseMatchId,
} from "../lib/validation";

describe("normalizeUsername", () => {
  it("lowercases and trims", () => {
    expect(normalizeUsername("  Rashid.1 ")).toBe("rashid.1");
  });

  it("rejects invalid characters and short names", () => {
    expect(normalizeUsername("ab")).toBeNull();
    expect(normalizeUsername("bad name")).toBeNull();
    expect(normalizeUsername("Bad!")).toBeNull();
    expect(normalizeUsername(12)).toBeNull();
  });
});

describe("isValidDisplayName", () => {
  it("requires 2-80 chars", () => {
    expect(isValidDisplayName("R")).toBe(false);
    expect(isValidDisplayName("RJ")).toBe(true);
  });
});

describe("isValidPin", () => {
  it("requires 4-32 chars", () => {
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("x".repeat(33))).toBe(false);
  });
});

describe("parseMatchId", () => {
  it("accepts positive integers", () => {
    expect(parseMatchId(7)).toBe(7);
    expect(parseMatchId("12")).toBe(12);
    expect(parseMatchId(0)).toBeNull();
    expect(parseMatchId("nope")).toBeNull();
  });
});

describe("isValidScore", () => {
  it("allows 0-99 integers only", () => {
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(99)).toBe(true);
    expect(isValidScore(100)).toBe(false);
    expect(isValidScore(-1)).toBe(false);
    expect(isValidScore(1.5)).toBe(false);
  });
});
