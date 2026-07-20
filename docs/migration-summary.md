# Family Football Predictions - Migration & Tech Summary

This document summarizes the architecture, database schema, pages, and API endpoints of the built project so you can easily hand it off to another AI assistant if needed.

## 🛠 Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS (Dark Mode preset)
- **Database:** SQLite (`better-sqlite3`)
- **Auth:** Stateless JWT (`jose`), Phone-number based (no OTP/passwords)
- **Images:** Sharp (profile picture compression & resizing)

## 🗄 SQLite Schema (`football.db`)

### 1. `users`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT)
-- `phone` (TEXT UNIQUE) - *e.g., `+0000000000`*
- `pfp_path` (TEXT NULL) - *e.g., `/uploads/12345.jpg`*
- `is_admin` (INTEGER DEFAULT 0)

### 2. `matches`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `team1_country` (TEXT)
- `team2_country` (TEXT)
- `team1_flag` (TEXT) - *Emoji flag*
- `team2_flag` (TEXT) - *Emoji flag*
- `kickoff_time` (TEXT) - *Local ISO string*
- `prediction_deadline` (TEXT) - *Local ISO string*
- `team1_score` (INTEGER NULL)
- `team2_score` (INTEGER NULL)
- `is_finished` (INTEGER DEFAULT 0)
- `created_at` (TEXT DEFAULT CURRENT_TIMESTAMP)

### 3. `predictions`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `user_id` (INTEGER, FK -> users)
- `match_id` (INTEGER, FK -> matches)
- `team1_score` (INTEGER)
- `team2_score` (INTEGER)
- `submitted_at` (TEXT)
- *Unique Constraint:* `UNIQUE(user_id, match_id)`

---

## 🖥 Pages & Layout

- `/` - **Login:** Phone number input. Checks if exists in DB, issues signed JWT session cookie.
- `/leaderboard` - **Main Dashboard:** Ranked users by exact score count (tiebreaker: earliest last-correct prediction). Displays active/upcoming matches in 2-per-card grid layout with live countdowns.
- `/predict/[matchId]` - **Match Prediction:** Submits/updates scores. Locks when `now > prediction_deadline`.
- `/family` - **Family Grid:** Lists all members, profile pictures, exact scores correct, and total predictions.
- `/history` - **Past Matches:** Completed games. Clicking on any card opens a modal showing everyone's predictions and a share-to-WhatsApp button.
- `/admin` - **Admin Dashboard (Tabs):**
  - **Users:** Create/Delete family members with custom name, phone, and optional photo upload (compressed via `sharp`).
  - **Matches:** Match creator using a searchable country/flag selector (32 World Cup teams preloaded).
  - **Results:** Enter scores for completed matches to trigger auto-recalculations.
  - **Import:** Bulk retroactive history importer (WhatsApp backfill tool). Set custom timestamps for tiebreaker accuracy.

---

## 🔌 API Routes

- `POST /api/login` -> Auth & cookie generation
- `GET /api/leaderboard` -> Sorted rankings
- `GET/POST /api/users` -> Admin user management
- `DELETE /api/users/[id]` -> User deletion
- `GET/POST /api/matches` -> Match list and creation
- `GET /api/matches/[id]` -> Single match details
- `GET /api/matches/today` -> Matches kickoff today or next 2 days
- `GET /api/matches/[id]/predictions` -> Details + predictions + winners
- `POST /api/matches/[id]/result` -> Resolve match scores & finalize
- `GET/POST /api/predictions` -> Submit or update personal prediction
- `GET /api/predictions/[matchId]` -> Get logged-in user's prediction
- `POST /api/import` -> Bulk retroactive backfill
- `GET /api/stats` -> Compiles streaks and designates "Score Prophet" (most exact scores)

---

## 🚀 How to Run & Build

1. **Install:** `npm install`
2. **Init DB:** `npx tsx lib/init-db.ts`
3. **Environment:** Create `.env.local` with `JWT_SECRET=your_secret_here`
4. **Development:** `npm run dev`
5. **Production Build:** `npm run build` && `npm start`
