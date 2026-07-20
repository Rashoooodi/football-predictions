# 🏆 NBR Predictions Tracker

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

## 🌍 Deployment

### 1. Production (DigitalOcean)
To securely deploy the latest code to the live production server (`production.example.com`), we use an automated script that pulls backups, protects your `.env` and `football.db`, builds the Next.js bundle remotely, and reloads the server with zero downtime.
```bash
bash scripts/push-to-prod.sh
```

### 2. Staging (Tencent VPS)
If you need to push your code AND your local testing database (`football.db`) to a staging server for review, use SSH key-based authentication and avoid committing or using plaintext passwords.

Example (sanitized):
```bash
# Use an SSH key and a placeholder host. Replace with your SSH key and host.
rsync -avz -e "ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no" --exclude '.next' --exclude 'node_modules' --exclude 'public/uploads' --exclude 'football.db' --exclude '.git' ./ ubuntu@staging.example.com:~/nbr-predictions/
# To copy a local DB explicitly (careful: overwrites remote DB):
scp -i ~/.ssh/id_rsa football.db ubuntu@staging.example.com:~/nbr-predictions/football.db
# Then log in and run build/restart on the server (run these on the server, not via plaintext-password SSH):
ssh -i ~/.ssh/id_rsa ubuntu@staging.example.com 'cd nbr-predictions && npm install && npm run build && pm2 restart nbr-predictions'
```

Note: Do NOT use `sshpass` or embed passwords in scripts. If you manage deploy automation, use your CI provider's secret store or an SSH key with restricted access.

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
