# Football Predictions - Family World Cup Tracker

## Overview

A lightweight web app for tracking football match predictions within a family during World Cup season. Built with Next.js + SQLite, hosted via Tailscale funnel. ~10 users, phone-number login, admin-managed accounts and matches.

---

## Architecture

```
Next.js App (App Router)
├── Frontend: React + Tailwind CSS (dark mode)
├── Backend: Next.js API Routes + Server Actions
├── Database: SQLite via better-sqlite3
├── File Storage: Local filesystem for PFPs (public/uploads/)
└── Hosting: Tailscale funnel on laptop
```

Single project structure. Run with `npm start` in production, `npm run dev` for development.

---

## Data Model

### users
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| name | TEXT NOT NULL | Display name |
| phone | TEXT UNIQUE NOT NULL | Login identifier |
| pfp_path | TEXT | Filename in public/uploads/ |
| is_admin | BOOLEAN | Default false |

### matches
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| team1_country | TEXT NOT NULL | e.g., "Brazil" |
| team2_country | TEXT NOT NULL | e.g., "Argentina" |
| team1_flag | TEXT NOT NULL | Flag emoji 🇧🇷 |
| team2_flag | TEXT NOT NULL | Flag emoji 🇦🇷 |
| kickoff_time | DATETIME NOT NULL | When match starts |
| prediction_deadline | DATETIME NOT NULL | When predictions lock |
| team1_score | INTEGER | Nullable, filled after match |
| team2_score | INTEGER | Nullable, filled after match |
| is_finished | BOOLEAN | Default false |
| created_at | DATETIME | Auto-set |

### predictions
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| user_id | INTEGER FK→users | |
| match_id | INTEGER FK→matches | |
| team1_score | INTEGER NOT NULL | User's predicted score |
| team2_score | INTEGER NOT NULL | User's predicted score |
| submitted_at | DATETIME NOT NULL | For tiebreaker ordering |
| UNIQUE(user_id, match_id) | | One prediction per user per match |

---

## Country Data

Pre-loaded list of 32 World Cup teams with flag emojis:

```
🇶🇦 Qatar, 🇪🇨 Ecuador, 🇸🇳 Senegal, 🇳🇱 Netherlands
🏴󠁧󠁢󠁥󠁮󠁧󠁿 England, 🇮🇷 Iran, 🇺🇸 USA, 🇼󠁷󠁳󠁣󠁡󠁿 Wales
🇫🇷 France, 🇦🇺 Australia, 🇩🇰 Denmark, 🇹🇳 Tunisia
🇦🇷 Argentina, 🇸🇦 Saudi Arabia, 🇲🇽 Mexico, 🇵🇱 Poland
🇧🇪 Belgium, 🇨🇦 Canada, 🇲🇦 Morocco, 🇭🇷 Croatia
🇧🇷 Brazil, 🇷🇸 Serbia, 🇨🇲 Cameroon, 🇨🇭 Switzerland
🇵🇹 Portugal, 🇬🇭 Ghana, 🇺🇾 Uruguay, 🇰🇷 South Korea
🇩🇪 Germany, 🇯🇵 Japan, 🇪🇸 Spain, 🇨🇷 Costa Rica
```

Stored as JSON array in `data/countries.json`. Admin selects from searchable dropdown.

---

## Pages & Routes

### `/` — Login Page
- Phone number input field
- "Login" button
- Validates against users table
- Sets session cookie (simple JWT or encrypted cookie)
- Redirect to `/leaderboard`

### `/leaderboard` — Main Dashboard
**Top section: Leaderboard**
- Ranked list of all family members
- Shows: PFP, name, total points
- Tiebreaker: earliest last-correct-prediction
- Highlight current user's position

**Bottom section: Today's Matches**
- 2 matches per card (side by side layout)
- Each match shows:
  - Country flags + names
  - Kickoff time
  - Status badge (Upcoming/Live/Finished)
  - Countdown timer (if upcoming)
  - User's prediction (if submitted)
  - "Predict" or "Edit" button

Click on any match → opens match detail view with all predictions

### `/predict/[matchId]` — Prediction Page
- Match info (teams, flags, kickoff time)
- Countdown to deadline
- Score input (two number inputs: Team1 - Team2)
- "Submit Prediction" button
- If already predicted: shows current prediction, can edit
- Locked after deadline passes

### `/family` — Family View
- Grid of all family members
- Each card shows:
  - PFP, name
  - Total points
  - Recent predictions (last 5 matches)
  - Correct predictions count
- Click on member → see their full prediction history

### `/history` — Past Matches
- List of all finished matches
- Each shows: final score, who got it right, who was first
- Click to see all predictions vs actual

### `/admin` — Admin Panel (Admin Only)

**Tab 1: Manage Users**
- List of all users with PFP, name, phone
- "Add User" form:
  - Name input
  - Phone number input
  - PFP upload (image file)
- Edit/delete existing users

**Tab 2: Create Match**
- Country selector (searchable dropdown with flags)
- Kickoff time (datetime picker)
- Prediction deadline (datetime picker)
- "Create Match" button

**Tab 3: Enter Results**
- List of unfinished matches
- Score input for each match
- "Submit Result" button → marks match finished, calculates winners

**Tab 4: Import WhatsApp History**
- Select match (or create new past match)
- For each family member:
  - Their name (pre-filled)
  - Score prediction input
  - Submission time (optional, for tiebreaker)
- Final result input
- "Import All" bulk submit

---

## Scoring System

- Exact score match = **1 point**
- Wrong prediction = **0 points**
- Tiebreaker: if multiple correct, earliest `submitted_at` wins
- Leaderboard sorted by:
  1. Total points (descending)
  2. Earliest last-correct-prediction (ascending)

---

## Match Status Badges

| Status | Color | Condition |
|--------|-------|-----------|
| Upcoming | 🟢 Green | `now < kickoff_time` |
| Live | 🟡 Yellow | `kickoff_time <= now < kickoff_time + 2h` (approximate match duration) |
| Finished | ⚪ Gray | `is_finished = true` |

---

## Countdown Timer

On match cards, show:
- "Predictions close in 2h 15m" (if before deadline)
- "Match starts in 45m" (if after deadline, before kickoff)
- "LIVE" (during match)
- Final score (after match)

---

## Fun Stats

On leaderboard and profile pages:

1. **Current Streak** — Consecutive correct predictions
2. **Longest Streak** — Best streak ever
3. **Total Correct** — Number of exact score predictions
4. **Score Prophet** — Badge for user with most correct predictions

---

## WhatsApp Share

After a match ends:
- Generate summary text:
  ```
  🏆 Match Result: Brazil 2-1 Argentina
  
  ✅ Correct predictions:
  1. Rashid (2-1) - 1st place!
  2. Ahmed (2-1) - 2nd place
  
  ❌ Wrong: Everyone else
  
  Leaderboard:
  1. Rashid - 5pts
  2. Ahmed - 4pts
  3. Omar - 3pts
  ```
- "Share to WhatsApp" button
- Opens WhatsApp with pre-filled message

---

## UI Design

### Dark Mode Theme
- Background: `#0a0a0a`
- Card surface: `#1a1a1a`
- Accent: `#10b981` (emerald green)
- Text: `#ffffff` (primary), `#9ca3af` (secondary)
- Borders: `#2a2a2a`
- Status colors: Green/Yellow/Gray as noted above

### Mobile-First Layout
- Designed for phone screens first
- Responsive breakpoints for tablet/desktop
- Touch-friendly buttons and inputs
- Bottom navigation on mobile

### Typography
- Font: Inter or system font stack
- Headings: Bold, white
- Body: Regular, gray-200
- Monospace for scores

---

## File Structure

```
football-predictions/
├── app/
│   ├── layout.tsx          # Root layout with dark mode
│   ├── page.tsx            # Login page
│   ├── leaderboard/
│   │   └── page.tsx        # Main dashboard
│   ├── predict/
│   │   └── [matchId]/
│   │       └── page.tsx    # Prediction page
│   ├── family/
│   │   └── page.tsx        # Family view
│   ├── history/
│   │   └── page.tsx        # Past matches
│   └── admin/
│       ├── page.tsx        # Admin panel
│       ├── create-match/   # Match creation
│       ├── import/         # WhatsApp import
│       └── enter-results/  # Result entry
├── components/
│   ├── MatchCard.tsx
│   ├── Leaderboard.tsx
│   ├── PredictionForm.tsx
│   ├── CountdownTimer.tsx
│   ├── CountrySelector.tsx
│   └── ShareButton.tsx
├── lib/
│   ├── db.ts              # SQLite connection
│   ├── auth.ts            # Session management
│   └── countries.ts       # Country data with flags
├── data/
│   └── countries.json     # 32 teams with flags
├── public/
│   └── uploads/           # User PFPs
├── football.db            # SQLite database file
├── package.json
└── tailwind.config.js
```

---

## Session Management

- Login: validate phone → set encrypted cookie with user ID
- Cookie: `session` with JWT (user_id, is_admin)
- Middleware: check session on all routes except `/`
- Admin routes: check `is_admin` flag

---

## API Routes

```
POST /api/login              # Phone login
GET  /api/users              # List users (admin)
POST /api/users              # Create user (admin)
PUT  /api/users/[id]         # Update user (admin)
DELETE /api/users/[id]       # Delete user (admin)
GET  /api/matches            # List matches
POST /api/matches            # Create match (admin)
GET  /api/matches/[id]       # Get match details
PUT  /api/matches/[id]       # Update match (admin)
POST /api/matches/[id]/result  # Enter result (admin)
GET  /api/predictions/[matchId]  # Get predictions for match
POST /api/predictions        # Submit/update prediction
GET  /api/leaderboard        # Get leaderboard data
POST /api/import             # Bulk import (admin)
GET  /api/stats/[userId]     # Get user stats
```

---

## Edge Cases

1. **Prediction after deadline** — Return error, show "Predictions locked"
2. **Duplicate prediction** — Update existing (upsert based on user_id + match_id)
3. **Admin enters result for unfinished match** — Calculate winners, update points
4. **User not found on login** — Show "Account not found, ask admin"
5. **Cookie expired** — Redirect to login
6. **Large PFP upload** — Resize to 200x200, compress

---

## Implementation Order

1. Project setup (Next.js + Tailwind + SQLite)
2. Database schema + seed countries
3. Login page + session management
4. Admin panel: user management
5. Admin panel: match creation with country selector
6. Prediction page + countdown timer
7. Leaderboard page
8. Admin: enter results + scoring logic
9. Family view page
10. History page
11. WhatsApp share button
12. Fun stats + badges
13. Import UI for WhatsApp history
14. Polish: animations, responsive, error handling
