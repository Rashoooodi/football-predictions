# 🏆 WORLD CUP Predictions Tracker

A private World Cup prediction tracker designed exclusively for family tournaments. Features a sleek dark mode UI, secure phone-number login, an advanced admin dashboard, automated leaderboards, and instant WhatsApp sharing.

---

## 🚀 Quick Start (Local Setup)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize the local database:**
   *(This automatically creates the default Admin user)*
   ```bash
   npm run init-db
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   # 1. JWT_SECRET: Generates secure session cookies.
   # How to get: Make up a random 32+ character string (or run `openssl rand -base64 32`).
   JWT_SECRET=your-random-secret-here

   # 2. VAPID Keys: Required for sending Native Web Push Notifications to iOS/Android.
   # How to get: Run `npx web-push generate-vapid-keys` in your terminal.
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
   VAPID_PRIVATE_KEY=your-private-key

   # 3. FIFA_API_TOKEN: Used to fetch live match scores automatically.
   # How to get: Request an access token from your live sports data provider API.
   FIFA_API_TOKEN=your-api-token

   # 4. MAINTENANCE_MODE: Toggle the entire site offline instantly
   MAINTENANCE_MODE="false"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the app!

---

## 👑 Admin Management

You can access the dedicated admin panel at `/admin` to manage the entire tournament.

**Default Admin Login:**
- **Phone:** `+0000000000`
- **Name:** Example User

### 📋 Key Admin Actions:
- **Users:** Add family members by entering their name, phone number, and an optional profile picture.
- **Matches:** Create upcoming matches by selecting two countries from the searchable dropdown, setting the kickoff time, and locking the prediction deadline.
- **Results:** Enter the final score for completed matches. The global leaderboard and user stats will calculate and update automatically!
- **History Import:** Migrate old predictions from WhatsApp by selecting a match, entering each family member's historical prediction, and clicking Import.

---

## ⚽ How Scoring Works

1. Predict the **exact** final score (e.g., Brazil `2` - `1` Argentina).
2. **Correct prediction** = `1 point`
3. **Wrong prediction** = `0 points`
4. **Tiebreakers:** If multiple people predict the exact same score, the earliest submission time ranks higher on the match leaderboard.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI & Styling:** React, Tailwind CSS (Custom Dark Mode interface)
- **Database:** SQLite (`better-sqlite3`)
- **Authentication:** JWT sessions (`jose`)
- **Image Processing:** Sharp
