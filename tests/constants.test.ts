import { describe, expect, it } from "vitest";
import {
  DEFAULT_FIRST_POINTS,
  DEFAULT_OTHER_POINTS,
  SESSION_MAX_AGE_SECONDS,
} from "../lib/constants";

describe("constants", () => {
  it("keeps session length at 30 days", () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(60 * 60 * 24 * 30);
  });

  it("keeps default scoring 2/1", () => {
    expect(DEFAULT_FIRST_POINTS).toBe(2);
    expect(DEFAULT_OTHER_POINTS).toBe(1);
  });
});
