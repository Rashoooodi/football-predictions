import { describe, expect, it } from "vitest";
import { SCORE_LIMITS } from "../lib/validation";

describe("SCORE_LIMITS", () => {
  it("exposes stable bounds", () => {
    expect(SCORE_LIMITS.MAX_GOALS).toBe(99);
    expect(SCORE_LIMITS.MIN_PIN_LEN).toBe(4);
    expect(SCORE_LIMITS.MAX_USERNAME_LEN).toBe(32);
  });
});
