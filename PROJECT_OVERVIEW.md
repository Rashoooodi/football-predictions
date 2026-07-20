# NBR / Alkhan Predictions - Project Overview

This document provides a comprehensive overview of the NBR Predictions application, structured for the three main groups interacting with it: **Users (Players)**, **Administrators**, and **Developers**.

---

## 👤 1. For Users (Players)

Welcome to the family prediction league! Here is everything you need to know about how to play and compete.

### How to Play
1. **Login**: You don't need a password! Log in using the username provided by the administrator. Some users may be prompted to set a short PIN on first login.
2. **Predict Matches**: Go to the active matches and submit your predicted final score (e.g., Brazil 2 - 1 Argentina).
3. **Check the Leaderboard**: Once a match finishes, points are awarded, and the leaderboard updates automatically.

### Important Rules
* **The Unique Score Rule**: No two family members can predict the exact same score for the same match. If someone else has already picked `2-1`, you'll have to choose a different score (like `1-0` or `3-1`). First come, first served!
* **Blind Predictions**: To prevent copying, you cannot see what other players have predicted until the prediction deadline has passed (usually kickoff time).
* **Scoring**: You get 1 point for predicting the exact final score. If multiple people somehow tie, the earliest submission wins the tiebreaker.

---

## 👑 2. For Administrators

As an admin, you are responsible for managing the league, adding matches, and entering final results. 

### Admin Access
Log in with the designated admin account. By default, this is:
- **Username**: `admin`

Once logged in, you will have access to the `/admin` dashboard.

### Admin Duties
* **Managing Users**: Go to Admin -> Users (or Manage Predictors) to add new family members. Provide their name and username; optionally set an initial PIN or leave blank so the user sets it on first login. You can also upload and crop a profile photo for them.
* **Creating Matches**: Go to Admin -> Matches. Select the two competing countries, and set the kickoff time and prediction deadline.
* **Entering Results**: Once a real-life match ends, go to Admin -> Results. Enter the final score. The system will automatically calculate points and update the leaderboard.
* **Importing History**: If you have past predictions stored in WhatsApp chats, you can use the "Import" tool to log those historical predictions into the system for a specific match.

---

## 💻 3. For Developers

This section covers the technical architecture and constraints of the codebase.

### Tech Stack
* **Framework**: Next.js 14 (App Router)
* **Styling**: Tailwind CSS (Dark Mode, Glassmorphic UI)
* **Database**: SQLite (managed synchronously via `better-sqlite3`)
* **Authentication**: Custom JWT sessions via `jose` (cookie-based, passwordless)
* **Image Processing**: `sharp` (for HTML5 canvas profile picture cropping & resizing)

### Database Architecture
The app runs entirely on a local SQLite database (`football.db`) located in the root directory. 
* `users`: Stores player profiles and admin flags.
* `matches`: Stores match metadata (teams, flags, kickoff, scores).
* `predictions`: Maps `user_id` to `match_id` with their predicted scores.

### Key Business Logic
* **Unique Predictions**: Enforced both on the frontend (`takenScores` state blocking submission) and backend (SQL query rejecting duplicate score combinations for a single match).
* **Masking**: The API (`/api/matches/[id]/predictions`) masks all other users' predicted scores as `null` until the `prediction_deadline` passes, ensuring fairness.

### Local Development Setup
1. Ensure Node.js (≥18) and Python/C++ build tools are installed (required for compiling `sharp` and `better-sqlite3`).
2. Run `npm install`.
3. Create a `.env.local` file with a secure `JWT_SECRET=your-random-string`.
4. Run `npm run dev` to start the server. The database will automatically initialize and seed the default admin account.

*Note: If you encounter caching issues between production and development builds, delete the `.next` folder and restart the dev server.*
