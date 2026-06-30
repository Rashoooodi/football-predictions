import db from "./db";

export type LeaderboardEntry = {
  user_id: number;
  name: string;
  pfp_path: string | null;
  points: number;
  correct_count: number;
  rank: number;
};

export function calculateLeaderboard(): LeaderboardEntry[] {
  const users = db
    .prepare(
      "SELECT u.id as user_id, u.name, u.pfp_path, " +
        "COUNT(p.id) as correct_count " +
        "FROM users u " +
        "LEFT JOIN predictions p ON p.user_id = u.id " +
        "LEFT JOIN matches m ON p.match_id = m.id " +
        "WHERE m.is_finished = 1 " +
        "AND p.team1_score = m.team1_score " +
        "AND p.team2_score = m.team2_score " +
        "GROUP BY u.id"
    )
    .all() as {
    user_id: number;
    name: string;
    pfp_path: string | null;
    correct_count: number;
  }[];

  const withPoints = users.map((u) => {
    const lastCorrect = db
      .prepare(
        "SELECT MIN(p.submitted_at) as earliest " +
          "FROM predictions p " +
          "JOIN matches m ON p.match_id = m.id " +
          "WHERE p.user_id = ? " +
          "AND m.is_finished = 1 " +
          "AND p.team1_score = m.team1_score " +
          "AND p.team2_score = m.team2_score"
      )
      .get(u.user_id) as { earliest: string | null };

    return {
      ...u,
      points: u.correct_count,
      earliest_correct: lastCorrect.earliest,
    };
  });

  withPoints.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (a.earliest_correct && b.earliest_correct) {
      return a.earliest_correct.localeCompare(b.earliest_correct);
    }
    return 0;
  });

  return withPoints.map((u, i) => ({
    user_id: u.user_id,
    name: u.name,
    pfp_path: u.pfp_path,
    points: u.points,
    correct_count: u.correct_count,
    rank: i + 1,
  }));
}

export function getMatchResults(matchId: number) {
  const match = db
    .prepare("SELECT * FROM matches WHERE id = ?")
    .get(matchId) as any;

  if (!match || !match.is_finished) return null;

  const predictions = db
    .prepare(
      "SELECT p.*, u.name, u.pfp_path " +
        "FROM predictions p " +
        "JOIN users u ON p.user_id = u.id " +
        "WHERE p.match_id = ? " +
        "ORDER BY p.submitted_at ASC"
    )
    .all(matchId);

  const correct = predictions.filter(
    (p: any) =>
      p.team1_score === match.team1_score && p.team2_score === match.team2_score
  );

  return { match, predictions, correct };
}