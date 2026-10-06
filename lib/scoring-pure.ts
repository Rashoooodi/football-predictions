export type LeaderboardSortRow = {
  points: number;
  earliest_correct: string | null;
};

export function parsePointsSetting(
  value: string | null | undefined,
  fallback: number
): number {
  if (value == null || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function isExactScore(
  predicted: { team1_score: number; team2_score: number },
  actual: { team1_score: number | null; team2_score: number | null }
): boolean {
  if (actual.team1_score == null || actual.team2_score == null) return false;
  return (
    predicted.team1_score === actual.team1_score &&
    predicted.team2_score === actual.team2_score
  );
}

export function compareLeaderboardRows(
  a: LeaderboardSortRow,
  b: LeaderboardSortRow
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (a.earliest_correct && b.earliest_correct) {
    return a.earliest_correct.localeCompare(b.earliest_correct);
  }
  if (a.earliest_correct) return 1;
  if (b.earliest_correct) return -1;
  return 0;
}

export function pointsForRank(
  rank: number,
  firstPts: number,
  otherPts: number
): number {
  if (rank < 1) return 0;
  return rank === 1 ? firstPts : otherPts;
}
