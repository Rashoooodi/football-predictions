import db from "./db";

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      pfp_path TEXT,
      is_admin INTEGER DEFAULT 0,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team1_country TEXT NOT NULL,
      team2_country TEXT NOT NULL,
      team1_flag TEXT NOT NULL,
      team2_flag TEXT NOT NULL,
      kickoff_time TEXT NOT NULL,
      prediction_deadline TEXT NOT NULL,
      team1_score INTEGER,
      team2_score INTEGER,
      is_finished INTEGER DEFAULT 0,
      with_reward INTEGER DEFAULT 1,
      is_frozen INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id INTEGER NOT NULL,
      team1_score INTEGER NOT NULL,
      team2_score INTEGER NOT NULL,
      submitted_at TEXT NOT NULL,
      UNIQUE(user_id, match_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (match_id) REFERENCES matches(id)
    );

    CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT UNIQUE,
      value TEXT
    );
    INSERT OR IGNORE INTO settings (key, value) VALUES ('announcement', '');
  `);

  const admin = db
    .prepare("SELECT id FROM users WHERE phone = ?")
    .get("+0000000000");
  if (!admin) {
    db.prepare(
      "INSERT INTO users (name, phone, is_admin) VALUES (?, ?, 1)"
    ).run("Rashid", "+0000000000");
    console.log("Created admin user: Rashid (+0000000000)");
  }
}

initDb();
