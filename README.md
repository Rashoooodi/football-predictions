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

3. Set your JWT secret in `.env.local`:
   ```
   JWT_SECRET=your-random-secret-here
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

## Hosting via Tailscale Funnel

To share the app with your family over the internet:

1. Install Tailscale:
   ```
   brew install tailscale
   ```

2. Login to Tailscale:
   ```
   tailscale up
   ```

3. Build and start the production server:
   ```
   npm run build
   npm start
   ```

4. In another terminal, expose port 3000 via funnel:
   ```
   tailscale funnel 3000
   ```

5. Tailscale will give you a public URL like `https://your-machine.tailnet.ts.net` - share this with your family.

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
