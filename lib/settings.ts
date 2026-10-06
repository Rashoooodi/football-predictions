import db from "./db";
import { parsePointsSetting } from "./scoring-pure";

interface SettingRow {
  value: string;
}

export function getSetting(key: string, fallback = ""): string {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | SettingRow
    | undefined;
  return row?.value ?? fallback;
}

export function getPointsSettings(): { firstPts: number; otherPts: number } {
  return {
    firstPts: parsePointsSetting(getSetting("first_correct_points"), 2),
    otherPts: parsePointsSetting(getSetting("other_correct_points"), 1),
  };
}

export function setSetting(key: string, value: string): void {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
}
