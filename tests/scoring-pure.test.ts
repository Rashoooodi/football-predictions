import { describe, expect, it } from "vitest";
import {
  compareLeaderboardRows,
  isExactScore,
  parsePointsSetting,
  pointsForRank,
} from "../lib/scoring-pure";

describe("parsePointsSetting", () => {
  it("returns fallback for null/empty", () => {
    expect(parsePointsSetting(null, 2)).toBe(2);
    expect(parsePointsSetting(undefined, 1)).toBe(1);
    expect(parsePointsSetting("", 3)).toBe(3);
  });

  it("parses valid integers", () => {
    expect(parsePointsSetting("5", 2)).toBe(5);
    expect(parsePointsSetting("0", 2)).toBe(0);
  });

  it("rejects NaN and negatives", () => {
    expect(parsePointsSetting("nope", 2)).toBe(2);
    expect(parsePointsSetting("-1", 2)).toBe(2);
  });
});

describe("isExactScore", () => {
  it("matches both sides", () => {
    expect(
      isExactScore(
        { team1_score: 2, team2_score: 1 },
        { team1_score: 2, team2_score: 1 }
      )
    ).toBe(true);
  });

  it("fails when scores differ", () => {
    expect(
      isExactScore(
        { team1_score: 1, team2_score: 1 },
        { team1_score: 2, team2_score: 1 }
      )
    ).toBe(false);
  });

  it("fails when actual is missing", () => {
    expect(
      isExactScore(
        { team1_score: 0, team2_score: 0 },
        { team1_score: null, team2_score: 0 }
      )
    ).toBe(false);
  });
});

describe("compareLeaderboardRows", () => {
  it("sorts by points descending", () => {
    const a = { points: 3, earliest_correct: null };
    const b = { points: 5, earliest_correct: null };
    expect(compareLeaderboardRows(a, b)).toBeGreaterThan(0);
  });

  it("uses earliest correct as tiebreaker", () => {
    const a = { points: 2, earliest_correct: "2026-01-01T10:00:00Z" };
    const b = { points: 2, earliest_correct: "2026-01-01T11:00:00Z" };
    expect(compareLeaderboardRows(a, b)).toBeLessThan(0);
  });
});

describe("pointsForRank", () => {
  it("awards first vs other points", () => {
    expect(pointsForRank(1, 2, 1)).toBe(2);
    expect(pointsForRank(2, 2, 1)).toBe(1);
    expect(pointsForRank(0, 2, 1)).toBe(0);
  });

  it("doubles points on reward matches", () => {
    expect(pointsForRank(1, 2, 1, 1)).toBe(4);
    expect(pointsForRank(2, 2, 1, 1)).toBe(2);
  });
});
