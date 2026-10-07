# 🏆 Football Predictions Tracker

A private football prediction tracker for family tournaments. Dark-mode UI, username + PIN login, admin dashboard, automated leaderboards, web push, and WhatsApp sharing.

---

## Quick Start

```bash
npm install
cp .env.example .env.local
# fill JWT_SECRET and other keys
npm run init-db
npm run dev
```

Open http://localhost:3000

Required env: `JWT_SECRET`. See `.env.example` for the full list.

## Admin

Admin panel: `/admin`

Default admin username: `admin` (seeded on first run). Set a PIN on first login.

## Scoring

Exact score only.

- First correct prediction: `first_correct_points` (default 2)
- Other correct predictions: `other_correct_points` (default 1)
- Wrong: 0
- Tiebreaker: earliest correct submission

See `docs/scoring.md`.

## Scripts

- `npm run dev` — development
- `npm run build` / `npm start` — production
- `npm test` — unit tests
- `npm run typecheck` — TypeScript
- `npm run init-db` — create SQLite schema

## Tech

Next.js 14, React, Tailwind, SQLite (`better-sqlite3`), JWT (`jose`), Sharp, Web Push.
