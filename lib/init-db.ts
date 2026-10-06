import db from "./db";

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      pfp_path TEXT,
      is_admin INTEGER DEFAULT 0,
      last_login_at TEXT,
      is_hidden INTEGER DEFAULT 0,
      pin TEXT DEFAULT NULL,
      is_banned INTEGER DEFAULT 0,
      failed_attempts INTEGER DEFAULT 0,
      locked_until DATETIME
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
      prediction_open_time TEXT,
      api_id TEXT DEFAULT NULL,
      is_hidden INTEGER DEFAULT 1,
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
    INSERT OR IGNORE INTO settings (key, value) VALUES ('first_correct_points', '2');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('other_correct_points', '1');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('ban_message', 'Access denied');

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subscription_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS banned_ips (
      ip TEXT PRIMARY KEY,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      ip_address TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_matches_api_id ON matches(api_id);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  const admin = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin");
  if (!admin) {
    db.prepare(
      "INSERT INTO users (name, username, is_admin) VALUES (?, ?, 1)"
    ).run("Admin", "admin");
    console.log("Created admin user: Admin (admin)");
  }
}

initDb();
