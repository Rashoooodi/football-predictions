# Alkhan Predictions

World Cup prediction tracker for the family. Phone-number login, dark mode UI, admin-managed matches, WhatsApp share, and history import.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Initialize the database (creates admin user automatically):
   ```
   npm run init-db
   ```

3. Create a `.env.local` file and add the required environment variables:
   ```
   # 1. JWT_SECRET: Generates secure session cookies.
   # How to get: Make up a random 32+ character string or use `openssl rand -base64 32`.
   JWT_SECRET=your-random-secret-here

   # 2. VAPID Keys: Required for sending Native Web Push Notifications to iOS/Android.
   # How to get: Run `npx web-push generate-vapid-keys` in your terminal.
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
   VAPID_PRIVATE_KEY=your-private-key

   # 3. FIFA_API_TOKEN: Used to fetch live match scores automatically.
   # How to get: Request an access token from your live sports data provider API.
   FIFA_API_TOKEN=your-api-token

   # 4. MAINTENANCE_MODE: Toggle the entire site offline
   MAINTENANCE_MODE="false"
   ```

4. Run the dev server:
   ```
   npm run dev
   ```

5. Open http://localhost:3000

## Admin Access

The default admin account is:
- **Phone:** `+0000000000`
- **Name:** Rashid

Login with that phone number to access the admin panel at `/admin`.

## Adding Family Members

1. Login as admin
2. Go to `/admin` then "Users"
3. Add each family member with their name, phone number, and optional profile photo

## Creating Matches

1. Login as admin
2. Go to `/admin` then "Matches"
3. Select two countries from the searchable dropdown
4. Set kickoff time and prediction deadline
5. Submit

## Entering Results

1. Login as admin
2. Go to `/admin` then "Results"
3. Enter the final score for each match
4. Save - the leaderboard updates automatically

## Importing WhatsApp History

If you have predictions from WhatsApp before using this app:

1. Login as admin
2. Go to `/admin` then "Import"
3. Select an existing match (or create one first)
4. Enter each family member's prediction and submission time
5. Check "Match is finished" and enter the result if applicable
6. Click Import

## Deploying to Production

To securely deploy the latest code to the live production server (DigitalOcean), we use an automated script that pulls backups and syncs files securely without overwriting the production database.

1. Ensure your `.env.local` and `.gitignore` are configured properly.
2. Run the deployment script:
   ```bash
   bash scripts/push-to-prod.sh
   ```

## Deploying to Staging (Test Server)

If you want to sync your code **AND** your local testing database (`football.db`) to the Staging VPS (Tencent) for review:

```bash
sshpass -p 'REDACTED_PASSWORD' rsync -avz -e "ssh -o StrictHostKeyChecking=no" --exclude '.next' --exclude 'node_modules' --exclude 'public/uploads' --exclude 'football.db' --exclude 'football.db-*' --exclude '.git' ./ ubuntu@staging.example.com:~/nbr-predictions/ && sshpass -p 'REDACTED_PASSWORD' scp -o StrictHostKeyChecking=no football.db ubuntu@staging.example.com:~/nbr-predictions/football.db && sshpass -p 'REDACTED_PASSWORD' ssh -o StrictHostKeyChecking=no ubuntu@staging.example.com 'cd nbr-predictions && npm install && npm run build && pm2 restart nbr-predictions'
```

## How Scoring Works

- Predict the exact final score (e.g., Brazil 2-1 Argentina)
- Correct prediction = 1 point
- Wrong prediction = 0 points
- If multiple people get it right, the earliest submission wins the tiebreaker

## Tech Stack

- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS (dark mode)
- SQLite (better-sqlite3)
- JWT authentication (jose)
- Sharp for image processing
