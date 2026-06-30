import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "football.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.pragma("foreign_keys = ON");

// Auto-migrate new security columns & tables
try { db.prepare("ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0").run(); } catch (e) {}
try { db.prepare("ALTER TABLE users ADD COLUMN locked_until DATETIME").run(); } catch (e) {}

db.prepare(`
  CREATE TABLE IF NOT EXISTS banned_ips (
    ip TEXT PRIMARY KEY,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

export default db;
