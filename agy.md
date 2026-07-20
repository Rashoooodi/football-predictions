# Football Prediction: AI & Developer Central Brain

Welcome to the **Football Prediction** repository. This document is the absolute source of truth for the entire project's architecture, infrastructure, deployment workflow, business logic, and design philosophy. 
If you are an AI assistant (like Antigravity) or a new developer, **READ THIS ENTIRE FILE** before making any changes.

---

## 🏗️ 1. Core Tech Stack & Infrastructure
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS & Custom Vanilla CSS (`app/globals.css`, Premium Dark/Glassmorphic theme with Outfit & Inter Google Fonts)
- **Database**: SQLite (managed via `better-sqlite3` synchronously in `lib/db.ts`)
- **Process Manager**: PM2 (running on an Ubuntu VPS)
- **Web Server / Reverse Proxy**: Caddy
- **Image Processing**: `sharp` (used for cropping/resizing avatars to `200x200` cover JPEGs)

### Critical Regional Settings
- **Time Zone**: `Asia/Bahrain` MUST be strictly enforced for all UI dates.
- **Date Formatting**: Always use `en-GB` formatting for displaying dates (e.g., `new Date().toLocaleString("en-GB", { timeZone: "Asia/Bahrain" })`).

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
* **Backend Validation**: Check `app/api/predictions/route.ts`. The API query checks for duplicates and rejects them with a description of who has already taken the score.
* **Frontend Validation**: Check `app/predict/[matchId]/page.tsx`. It runs a real-time check against `takenScores`. If the currently selected score combination is taken, it flashes a warning and disables the submission button.

### 👁️ Prediction Hiding & Masking
To prevent copying, family members cannot see what others predicted until the match goes live (i.e. the prediction deadline has passed).
* **Before Deadline**: `/api/matches/[id]/predictions` returns the predictions list but masks all scores as `null` except for the logged-in user's own score. It returns an anonymous array of `takenScores` for unique validation without revealing who chose what.
* **After Deadline (Match Live / Finished)**: The endpoint stops masking, and the full scoreboard is shown under the match details.

### 🔴 Active Dashboard Visibility
* `/api/matches/today` returns matches that are either **unfinished (`is_finished = 0`)** OR kickoff in the future.
* This ensures that even when a match is live and kickoff has passed, it stays visible on the active rankings dashboard so family members can click it and view the live leaderboard/predictions.

### 🏗️ Core Architectural Decisions
- **Monolithic Desktop vs. Segmented Mobile**: 
  - Mobile devices use segmented routes (`/leaderboard`, `/matches`, `/predict`, etc.).
  - Desktop users are automatically redirected to the monolithic `/desktop` route which renders all views and the admin panel as a single-page application using React state.
  - **Rule**: Whenever you build a feature for mobile, you MUST identically build it into the `/desktop` monolith.
- **SQLite Database**: We use a WAL-mode SQLite database (`football.db`). All migrations are handled automatically inside `lib/db.ts` upon server start.

---

## 🛠️ 4. Key Codebase Entrypoints
* **Authentication**: `lib/auth.ts` (Cookie-based JWT sessions)
* **Database Setup**: `lib/db.ts` and `lib/init-db.ts`
* **Dashboard Page**: `app/leaderboard/page.tsx`
* **Predict Match Page**: `app/predict/[matchId]/page.tsx`
* **User Manager UI**: `app/admin/users/page.tsx` - contains the interactive **HTML5 Canvas Profile Picture Cropper** (handles dragging, scaling, and square cropping on the client side).

---

## 🚀 5. The Bulletproof Deployment Workflow
We do **NOT** use `git pull` on the server anymore. We use a highly secure, one-click local `rsync` script that strictly protects production data.

### Step-by-Step Deployment (How to push code):
Do not ssh into the server manually to deploy. From your **local laptop terminal**, run exactly one command:
```bash
bash scripts/push-to-prod.sh
```

### What `push-to-prod.sh` does:
1. **Auto-Downloads Backups**: It securely pulls the latest database backups from the VPS down to your laptop (`~/backups/nbr/`) before doing anything.
2. **Safe Code Push**: It runs `rsync` to push the new code to the VPS, completely ignoring the database and user uploads (thanks to `.rsyncignore`).
3. **Remote Trigger**: It triggers `scripts/deploy-prod.sh` directly on the server to handle the build.

### The `.rsyncignore` Shield
To prevent catastrophic data wipes, the following are strictly blocked from being synced to the server:
- `*.db`, `*.db-shm`, `*.db-wal` (Protects the database)
- `public/uploads/` (Protects user profile pictures)
- `.env*`, `*.log`, `node_modules/`, `.next/`, `.git/`

---

## 🌍 6. Dual-Server Infrastructure & Metrics
The application runs across a specialized dual-server setup:

### 🖥️ Servers & Routing
* **New Server (Primary)**: `production.example.com` handling `production.example.com`. This is the high-performance core running Next.js via PM2.
* **Old Server (Fallback)**: `staging.example.com` routing legacy traffic with appropriate DNS and maintenance procedures.

### 📈 Grafana Dashboard
* Grafana is installed on the New Server and accessible at `grafana.production.example.com` (replace with your monitoring host).
* It queries the live `football.db` SQLite database using the `frser-sqlite-datasource` plugin for real-time app metrics.
* **Security Bypass**: A systemd override (`ProtectHome=read-only`) is injected into the Grafana service to bypass Ubuntu's strict sandbox and grant it read access to the database inside the `ubuntu` home directory.

### ⏱️ Staggered Live Match Cron Jobs
To guarantee instantly synced scores, precise sub-minute staggered cron jobs are in place:
* **New Server**: Fetches live matches every **30 seconds** (using a staggered `sleep 30` cron rule).
* **Old Server**: Fetches live matches every **2 minutes and 30 seconds** (using a staggered `sleep 150` rule inside a 5-minute block).

---

## 🔄 7. Maintenance Mode & Zero Downtime (Caddy Fallback)
We employ a completely seamless maintenance mode so users never see a broken page.
- **The Caddyfile**: Caddy listens on port 80/443 and reverse proxies to Next.js on `localhost:5000`. 
- **The 502 Fallback**: If Next.js goes offline (during a build or PM2 restart), Caddy intercepts the `502 Bad Gateway` error and instantly serves a beautiful `/var/www/html/fallback.html` page.
- **Auto-Refresh**: `fallback.html` contains `<meta http-equiv="refresh" content="5">`. As soon as PM2 comes back online, the users' browsers automatically kick them back into the live production app. 

---

## 💾 8. The "Tank-Proof" Automated Backup System
We have a native Linux `crontab` job running on the VPS that executes `scripts/backup_db.sh` every **5 minutes**.

### Backup Structure (Designed for Rclone):
- The script creates a daily folder: `/home/ubuntu/nbr-predictions/backups/DD-MM-YYYY-Backup`
- Inside this folder, it creates:
  1. `database.db` (A snapshot of `football.db` generated safely using the SQLite `.backup` command to preserve WAL transactions).
  2. `Systemfiles.zip` (A zipped archive of the entire codebase, excluding heavy node_modules and `.next` caches).
- Every 5 minutes, it silently overwrites these two files with the freshest data for that day.
- **Auto-Cleanup**: It automatically deletes backup folders older than 7 days to prevent server disk bloat. 
- A single backup folder is ~1MB. The server will only ever use <10MB for backups at any given time.

---

## 🔔 9. Telegram Notifications & Settings
The website uses a Telegram Bot to send alerts for security events and signups.
- **Configuration**: The `telegram_bot_token` and `telegram_chat_id` are saved in the `settings` table of the database (manageable via Admin UI).
- **Triggers**: Admin can toggle alerts for New Signups, Banned IPs, Brute Force Attempts, and Honeypot Triggers.
- **Important**: If debugging, ensure the chat ID is correct (groups start with `-`) and that the admin has hit `/start` in the bot's direct messages.

---

## 🎨 10. Design Philosophy & UI Rules
- **Vibrant & Dynamic**: This application relies heavily on dynamic borders, glassmorphism, glowing drop-shadows, and micro-animations. Generic, boring UI is unacceptable.
- **Line Breaks**: When displaying user-generated text (like the Announcement Banner), ALWAYS use the Tailwind `whitespace-pre-wrap` class to preserve their exact line breaks.
- **Admin UI Parity**: The Admin panel is massive. It handles CSV exports, Telegram toggles, Database backups, custom Ban messages, and Announcement Pinning. Ensure changes in API logic reflect perfectly in the UI.

---

## 🛡️ 11. Security
- **Admin Authentication**: Secured via JWT cookies. Checked against `is_admin = 1` in the database.
- **Honeypot**: There is a fake "admin" username setup in the login handler. If anyone attempts to brute-force or log in with it, they are instantly permanently IP banned and a Telegram alert is dispatched. 
- **Rate Limiting**: Brute-forcing is prevented via IP bans on multiple failed PIN attempts.

---

## 💡 12. Troubleshooting Next.js caching during HMR
Sometimes when switching between production builds (`npm run build`) and development (`npm run dev`), Next.js hot module reloading gets stuck with webpack error logs (such as `Cannot find module './276.js'`).
To resolve:
1. Stop the running node process.
2. Run `rm -rf .next`
3. Restart the dev server (`npm run dev`)

---

## 📝 13. Critical AI Rules
If you are an AI reading this:
1. **Never use `rsync` directly in your terminal for this project.** If you need to deploy, just run `bash scripts/push-to-prod.sh`.
2. **Never modify or overwrite `football.db` directly on the server.** If restoring a backup, ALWAYS stop PM2 (`pm2 stop nbr-predictions`), completely delete `football.db-wal` and `football.db-shm` caches, copy the `.db` backup, and then restart PM2.
3. **No placeholders.** Always implement fully working code.
4. **Timezones:** Always enforce `Asia/Bahrain` for `toLocaleString` conversions. 
