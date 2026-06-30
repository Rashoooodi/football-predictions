# AI Developer Guide - Alkhan Predictions

Welcome to the **Alkhan Predictions** project! This codebase is a private, custom prediction league built for a family to predict football match scores, compete on a leaderboard, and follow matches together.

This document outlines the project architecture, mechanics, database constraints, and administrative operations to help you understand and work on the project efficiently.

---

## 🚀 1. Tech Stack & Architecture
* **Framework**: Next.js 14 (App Router)
* **Styling**: Tailwind CSS (Premium Dark/Glassmorphic theme with Outfit & Inter Google Fonts)
* **Database**: SQLite (managed via `better-sqlite3` synchronously in `lib/db.ts`)
* **Auth**: Cookie-based JWT sessions (managed in `lib/auth.ts`)
* **Image Processing**: `sharp` (used for cropping/resizing avatars to `200x200` cover JPEGs)

---

## 🗄️ 2. Database Schema
The database is located in the root directory at `./football.db`.

```sql
-- Users Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  pfp_path TEXT,                -- Path to cropped profile picture (e.g. /uploads/...)
  is_admin INTEGER DEFAULT 0,   -- 1 = Admin, 0 = Regular user
  last_login_at TEXT            -- UTC datetime string of last login
);

-- Matches Table
CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team1_country TEXT NOT NULL,
  team2_country TEXT NOT NULL,
  team1_flag TEXT NOT NULL,     -- Emoji flag (e.g. 🇧🇷)
  team2_flag TEXT NOT NULL,     -- Emoji flag (e.g. 🇯🇵)
  kickoff_time TEXT NOT NULL,   -- ISO Local String (YYYY-MM-DDTHH:MM)
  prediction_deadline TEXT NOT NULL,
  team1_score INTEGER,          -- Set by admin when match finishes
  team2_score INTEGER,          -- Set by admin when match finishes
  is_finished INTEGER DEFAULT 0 -- 1 = Finished, 0 = Upcoming/Live
);

-- Predictions Table
CREATE TABLE predictions (
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
```

---

## 🎯 3. Core Mechanics & Business Rules

### 🚫 Uniqueness Constraint (Score Blocking)
A fundamental house rule of the league is that **no two family members can predict the exact same score for the same match**. 
* **Backend Validation**: Check `app/api/predictions/route.ts`. The API query checks for duplicates and rejects them with a description of who has already taken the score:
  ```typescript
  const duplicate = db.prepare(
    "SELECT * FROM predictions WHERE match_id = ? AND team1_score = ? AND team2_score = ? AND user_id != ?"
  ).get(matchId, team1Score, team2Score, session.userId);
  ```
* **Frontend Validation**: Check `app/predict/[matchId]/page.tsx`. It runs a real-time check against `takenScores`. If the currently selected score combination is taken, it flashes a warning and disables the submission button.

### 👁️ Prediction Hiding & Masking
To prevent copying, family members cannot see what others predicted until the match goes live (i.e. the prediction deadline has passed).
* **Before Deadline**: `/api/matches/[id]/predictions` returns the predictions list but masks all scores as `null` except for the logged-in user's own score. It returns an anonymous array of `takenScores` for unique validation without revealing who chose what.
* **After Deadline (Match Live / Finished)**: The endpoint stops masking, and the full scoreboard is shown under the match details.

### 🔴 Active Dashboard Visibility
* `/api/matches/today` returns matches that are either **unfinished (`is_finished = 0`)** OR kickoff in the future.
* This ensures that even when a match is live and kickoff has passed, it stays visible on the active rankings dashboard so family members can click it and view the live leaderboard/predictions.

---

## 🛠️ 4. Key Codebase Entrypoints

* **Authentication**: [lib/auth.ts](file:///Users/rashidjanahi/projects/football-predictions/lib/auth.ts)
* **Database Setup**: [lib/db.ts](file:///Users/rashidjanahi/projects/football-predictions/lib/db.ts) and [lib/init-db.ts](file:///Users/rashidjanahi/projects/football-predictions/lib/init-db.ts)
* **Dashboard Page**: [app/leaderboard/page.tsx](file:///Users/rashidjanahi/projects/football-predictions/app/leaderboard/page.tsx)
* **Predict Match Page**: [app/predict/[matchId]/page.tsx](file:///Users/rashidjanahi/projects/football-predictions/app/predict/[matchId]/page.tsx)
* **User Manager UI**: [app/admin/users/page.tsx](file:///Users/rashidjanahi/projects/football-predictions/app/admin/users/page.tsx) - contains the interactive **HTML5 Canvas Profile Picture Cropper** (handles dragging, scaling, and square cropping on the client side).

---

## 💡 5. Troubleshooting Next.js caching during HMR
Sometimes when switching between production builds (`npm run build`) and development (`npm run dev`), Next.js hot module reloading gets stuck with webpack error logs (such as `Cannot find module './276.js'`).
To resolve:
1. Stop the running node process.
2. Run the clean cache command:
   ```bash
   rm -rf .next
   ```
3. Restart the dev server:
   ```bash
   npm run dev
   ```
