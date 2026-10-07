import { describe, expect, it } from "vitest";
import { ensureTimezone } from "../lib/timezone";

describe("ensureTimezone", () => {
  it("returns null for empty", () => {
    expect(ensureTimezone(null)).toBeNull();
    expect(ensureTimezone(undefined)).toBeNull();
    expect(ensureTimezone("")).toBeNull();
  });

  it("keeps explicit offsets including negatives", () => {
    expect(ensureTimezone("2026-01-01T12:00:00Z")).toBe("2026-01-01T12:00:00Z");
    expect(ensureTimezone("2026-01-01T12:00:00+03:00")).toBe(
      "2026-01-01T12:00:00+03:00"
    );
    expect(ensureTimezone("2026-01-01T12:00:00-04:00")).toBe(
      "2026-01-01T12:00:00-04:00"
    );
  });

  it("defaults naive timestamps to +03:00", () => {
    expect(ensureTimezone("2026-01-01T12:00:00")).toBe(
      "2026-01-01T12:00:00+03:00"
    );
  });
});
