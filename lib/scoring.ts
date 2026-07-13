import db from "./db";

export type LeaderboardEntry = {
  user_id: number;
  name: string;
  username: string;
  pfp_path: string | null;
  points: number;
  correct_count: number;
  rank: number;
};

interface SettingRow {
  value: string;
}

interface UserRow {
  user_id: number;
  name: string;
  username: string;
  pfp_path: string | null;
  is_hidden: number;
}

interface MatchRow {
  id: number;
  team1_score: number | null;
  team2_score: number | null;
  is_finished: number;
}

interface PredictionRow {
  id: number;
  user_id: number;
  match_id: number;
  team1_score: number;
  team2_score: number;
  submitted_at: string;
  name: string;
  pfp_path: string | null;
}

let cachedLeaderboard: LeaderboardEntry[] | null = null;
let lastCacheTime = 0;

export function calculateLeaderboard(includeHidden = false): LeaderboardEntry[] {
  if (!includeHidden && cachedLeaderboard && Date.now() - lastCacheTime < 30000) {
    return cachedLeaderboard;
  }

  const firstPtsSetting = db.prepare("SELECT value FROM settings WHERE key = 'first_correct_points'").get() as SettingRow | undefined;
  const otherPtsSetting = db.prepare("SELECT value FROM settings WHERE key = 'other_correct_points'").get() as SettingRow | undefined;
  const firstPts = firstPtsSetting ? parseInt(firstPtsSetting.value) : 2;
  const otherPts = otherPtsSetting ? parseInt(otherPtsSetting.value) : 1;

  // 1. Get correct count and points for active users using Window Functions
  const users = db
    .prepare(
      `WITH CorrectPreds AS (
         SELECT p.user_id, p.match_id, p.submitted_at,
                ROW_NUMBER() OVER(PARTITION BY p.match_id ORDER BY p.submitted_at ASC) as rnk
         FROM predictions p
         JOIN matches m ON p.match_id = m.id
         WHERE (m.is_finished = 1 OR (m.is_finished = 0 AND m.team1_score IS NOT NULL AND m.team2_score IS NOT NULL))
           AND p.team1_score = m.team1_score
           AND p.team2_score = m.team2_score
       )
       SELECT u.id as user_id, u.name, u.username, u.pfp_path, u.is_hidden,
              COUNT(cp.match_id) as correct_count,
              IFNULL(SUM(CASE WHEN cp.match_id IS NULL THEN 0 WHEN cp.rnk = 1 THEN ? ELSE ? END), 0) as points
       FROM users u
       LEFT JOIN CorrectPreds cp ON cp.user_id = u.id
       GROUP BY u.id`
    )
    .all(firstPts, otherPts) as {
    user_id: number;
    name: string;
    username: string;
    pfp_path: string | null;
    correct_count: number;
    points: number;
    is_hidden: number;
  }[];

  // 2. Fetch the earliest correct prediction for all users in ONE query (for tiebreakers)
  const earliestList = db
    .prepare(
      "SELECT p.user_id, MIN(p.submitted_at) as earliest " +
        "FROM predictions p " +
        "JOIN matches m ON p.match_id = m.id " +
        "WHERE (m.is_finished = 1 OR (m.is_finished = 0 AND m.team1_score IS NOT NULL AND m.team2_score IS NOT NULL)) " +
        "AND p.team1_score = m.team1_score " +
        "AND p.team2_score = m.team2_score " +
        "GROUP BY p.user_id"
    )
    .all() as { user_id: number; earliest: string | null }[];

  const earliestMap = new Map<number, string>();
  earliestList.forEach(item => {
    if (item.earliest) earliestMap.set(item.user_id, item.earliest);
  });

  const withPoints = users.map((u) => {
    return {
      ...u,
      earliest_correct: earliestMap.get(u.user_id) || null,
    };
  });

  // 3. Ensure everyone (even with 0 points) is included
  const allUsers = db.prepare("SELECT id as user_id, name, username, pfp_path, is_hidden FROM users").all() as UserRow[];
  const userMap = new Map<number, typeof withPoints[0]>();
  withPoints.forEach(item => userMap.set(item.user_id, item));

  const completeList = allUsers.map(u => {
    const existing = userMap.get(u.user_id);
    if (existing) return existing;
    return {
      user_id: u.user_id,
      name: u.name,
      username: u.username,
      pfp_path: u.pfp_path,
      is_hidden: u.is_hidden,
      correct_count: 0,
      points: 0,
      earliest_correct: null
    };
  });

  completeList.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (a.earliest_correct && b.earliest_correct) {
      return a.earliest_correct.localeCompare(b.earliest_correct);
    }
    if (a.earliest_correct) return 1;
    if (b.earliest_correct) return -1;
    return 0;
  });

  const finalFiltered = completeList.filter(u => includeHidden ? true : !u.is_hidden);

  const result = finalFiltered.map((u, i) => ({
    user_id: u.user_id,
    name: u.name,
    username: u.username,
    pfp_path: u.pfp_path,
    points: u.points,
    correct_count: u.correct_count,
    rank: i + 1,
  }));

  if (!includeHidden) {
    cachedLeaderboard = result;
    lastCacheTime = Date.now();
  }

  return result;
}

export function getMatchResults(matchId: number) {
  const match = db
    .prepare("SELECT * FROM matches WHERE id = ?")
    .get(matchId) as MatchRow | undefined;

  if (!match || !match.is_finished) return null;

  const predictions = db
    .prepare(
      "SELECT p.*, u.name, u.pfp_path " +
        "FROM predictions p " +
        "JOIN users u ON p.user_id = u.id " +
        "WHERE p.match_id = ? " +
        "ORDER BY p.submitted_at ASC"
    )
    .all(matchId) as PredictionRow[];

  const correct = predictions.filter(
    (p: PredictionRow) =>
      p.team1_score === match.team1_score && p.team2_score === match.team2_score
  );

  return { match, predictions, correct };
}