import { describe, expect, it } from "vitest";
import { formatCountdown, matchPhase } from "../lib/countdown";

describe("formatCountdown", () => {
  it("formats hours minutes and seconds", () => {
    expect(formatCountdown(0)).toBe("0m");
    expect(formatCountdown(5000)).toBe("5s");
    expect(formatCountdown(65_000)).toBe("1m 5s");
    expect(formatCountdown(3_600_000 + 120_000)).toBe("1h 2m");
  });
});

describe("matchPhase", () => {
  const deadline = 1000;
  const kickoff = 2000;
  it("returns open locked live finished", () => {
    expect(matchPhase(500, deadline, kickoff, 1000)).toBe("open");
    expect(matchPhase(1500, deadline, kickoff, 1000)).toBe("locked");
    expect(matchPhase(2500, deadline, kickoff, 1000)).toBe("live");
    expect(matchPhase(4000, deadline, kickoff, 1000)).toBe("finished");
  });
});
