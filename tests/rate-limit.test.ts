import { describe, expect, it } from "vitest";
import { isRateLimited } from "../lib/auth-utils";

describe("isRateLimited", () => {
  const ip = `test-${Date.now()}-${Math.random()}`;

  it("allows the first burst then trips", () => {
    let tripped = false;
    for (let i = 0; i < 16; i += 1) {
      if (isRateLimited(ip)) tripped = true;
    }
    expect(tripped).toBe(true);
  });
});
