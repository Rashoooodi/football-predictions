import { describe, expect, it } from "vitest";
import { hashPin, pinMatches } from "../lib/auth-utils";

describe("hashPin", () => {
  it("is deterministic for the same pin", () => {
    expect(hashPin("1234")).toBe(hashPin("1234"));
  });

  it("changes when the pin changes", () => {
    expect(hashPin("1234")).not.toBe(hashPin("1235"));
  });
});

describe("pinMatches", () => {
  it("accepts a hashed pin", () => {
    const hash = hashPin("1234");
    expect(pinMatches(hash, hash, "1234")).toBe(true);
  });

  it("accepts a leftover plaintext pin of the same length", () => {
    expect(pinMatches("1234", hashPin("9999"), "1234")).toBe(true);
  });

  it("rejects a wrong pin", () => {
    expect(pinMatches(hashPin("1234"), hashPin("9999"), "9999")).toBe(false);
  });
});
