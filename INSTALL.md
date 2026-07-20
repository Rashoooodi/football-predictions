# Football Prediction — AI Agent Installation Guide

> This document is written for an AI agent (e.g. Antigravity, Claude, GPT-4o) to follow step-by-step to install and run the Football Prediction app on a new system.

---

## 📦 What This App Is

**Football Prediction** is a family/group football score prediction web app built with:
- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite via `better-sqlite3` (file-based, no external DB server needed)
- **Auth**: Username-only login (trust-based, no passwords), JWT sessions via `jose`
- **Image processing**: `sharp` (native Node.js module — requires compilation)
- **Styling**: Tailwind CSS
- **Runtime**: Node.js

The app is a PWA (Progressive Web App) and runs entirely as a single self-contained process.

---

## ✅ System Requirements

Before starting, verify the target system has:

| Requirement | Version | Check Command |
|---|---|---|
| Node.js | ≥ 18.x (LTS recommended) | `node --version` |
| npm | ≥ 9.x | `npm --version` |
| Python | ≥ 3.x (for `sharp` native build) | `python3 --version` |
| C++ build tools | Any recent version | `node-gyp --version` |

### Installing Node.js (if missing)
- **Mac**: `brew install node` or download from https://nodejs.org
- **Ubuntu/Debian**: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`
- **Windows**: Download installer from https://nodejs.org (LTS version)

### Installing build tools (required for `sharp` and `better-sqlite3`)
- **Mac**: `xcode-select --install`
- **Ubuntu/Debian**: `sudo apt-get install -y build-essential python3`
- **Windows**: Run `npm install --global windows-build-tools` as Administrator

---

## 🚀 Installation Steps

### Step 1 — Extract the zip

Extract the contents of `nbr-predictions.zip` to your desired location. Example:
```bash
unzip nbr-predictions.zip -d /path/to/your/projects/
cd /path/to/your/projects/nbr-predictions
```

### Step 2 — Install dependencies

```bash
npm install
```

> ⚠️ `sharp` and `better-sqlite3` are native modules. They will be compiled from source during `npm install`. This may take 1–3 minutes. If it fails, ensure build tools are installed (see System Requirements above).

### Step 3 — Configure environment

Create a `.env.local` file in the project root:

```bash
# On Mac/Linux:
echo "JWT_SECRET=your-secret-key-change-this-to-something-unique" > .env.local

# On Windows (PowerShell):
echo JWT_SECRET=your-secret-key-change-this-to-something-unique > .env.local
```

> 🔐 **Important**: Change the JWT_SECRET to a long random string unique to this deployment. This is used to sign login sessions. If two instances share the same secret, their sessions will be cross-compatible (which may or may not be desired).

Example of a strong secret:
```
***REMOVED***
```

### Step 4 — Start the app

**Development mode** (auto-reloads on code changes):
```bash
npm run dev
# Or on a specific port:
npm run dev -- -p 3000
```

**Production mode** (faster, no hot reload):
```bash
npm run build
npm start
# Or on a specific port:
npm start -- -p 3000
```

> 📝 The database (`football.db`) will be **automatically created** on first startup in the project root directory. The admin user `admin` will also be automatically seeded.

### Step 5 — Verify the app is running

Open a browser and navigate to:
```
http://localhost:3000
```

You should see the Football Prediction login page. Log in with:
- **Username**: `admin`

---

## 🗄️ Database Details

- **Location**: `./football.db` (project root, auto-created on startup)
- **Engine**: SQLite (no installation required, embedded)
- **Schema**: Auto-migrated on startup via `lib/init-db.ts`
- **Tables**: `users`, `matches`, `predictions`, `settings`

**To reset the database** (wipe all data and start fresh):
```bash
rm football.db football.db-shm football.db-wal
# Then restart the app — DB will be recreated automatically
```

**To back up the database**:
```bash
cp football.db football.db.backup-$(date +%Y%m%d)
```

---

## 🌐 Running in Production (Persistent)

To keep the app running permanently on a Linux server, use a process manager:

### Using PM2 (recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Build first
npm run build

# Start with PM2
pm2 start npm --name "nbr-predictions" -- start

# Or on a specific port
PORT=3000 pm2 start npm --name "nbr-predictions" -- start

# Make it start on system reboot
pm2 save
pm2 startup
```

### Using a systemd service (Linux)
Create `/etc/systemd/system/nbr-predictions.service`:
```ini
[Unit]
Description=NBR Predictions App
After=network.target

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/path/to/nbr-predictions
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=JWT_SECRET=your-secret-key-here
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then enable it:
```bash
sudo systemctl enable nbr-predictions
sudo systemctl start nbr-predictions
sudo systemctl status nbr-predictions
```

---

## 🔧 Port Configuration

By default Next.js uses port **3000**. To change it:

**Development**:
```bash
npm run dev -- -p 5001
```

**Production**:
```bash
PORT=5001 npm start
```

**Or permanently via `.env.local`**:
```
PORT=5001
```

---

## 🔒 HTTPS / Reverse Proxy (Optional but Recommended for Production)

For HTTPS, put the app behind **nginx** or **Caddy**:

### Caddy (easiest — auto HTTPS)
```
predictions.yourdomain.com {
    reverse_proxy localhost:3000
}
```

### Nginx
```nginx
server {
    server_name predictions.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 👤 Admin Access

The default admin account is:
- **Username**: `admin`
- **No password** (username-only login)

To add more users, log in as `admin` and go to **Admin → Manage Predictors**.

To change the admin username, edit `lib/init-db.ts`:
```typescript
// Find this block and change the values:
db.prepare(
  "INSERT INTO users (name, username, is_admin) VALUES (?, ?, 1)"
).run("Admin", "admin");  // ← Change these to your desired admin account
```
Then **delete the database** and restart so the new admin is seeded.

---

## 📁 Project Structure

```
nbr-predictions/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # All REST API endpoints
│   ├── admin/             # Admin panel pages
│   ├── leaderboard/       # Main leaderboard page
│   ├── predict/           # Match prediction page
│   ├── desktop/           # Desktop admin console
│   ├── layout.tsx         # Root layout (fonts, metadata)
│   └── page.tsx           # Login page
├── components/            # Shared React components
├── lib/
│   ├── auth.ts            # JWT session management
│   ├── db.ts              # SQLite database connection
│   ├── init-db.ts         # Schema creation & admin seeding
│   └── scoring.ts         # Points calculation logic
├── public/                # Static assets (PWA icons, uploads)
│   └── uploads/           # User profile photo storage
├── data/
│   └── countries.json     # Country/flag data for match setup
├── .env.local             # Environment variables (create this!)
├── package.json           # Dependencies
├── next.config.js         # Next.js config
├── tailwind.config.ts     # Tailwind CSS config
└── INSTALL.md             # This file
```

---

## 🐛 Troubleshooting

### `Error: EADDRINUSE` — Port already in use
```bash
# Find what's using the port (e.g. 3000):
lsof -i :3000        # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Use a different port:
npm run dev -- -p 3001
```

### `sharp` installation fails
```bash
# Try forcing a rebuild:
npm rebuild sharp

# Or install with specific platform flags:
npm install --platform=linux --arch=x64 sharp
```

### `better-sqlite3` installation fails
```bash
# Rebuild native module:
npm rebuild better-sqlite3

# Or clear cache and reinstall:
rm -rf node_modules package-lock.json
npm install
```

### Database corruption
```bash
# Delete and let app recreate it:
rm football.db football.db-shm football.db-wal
npm run dev
```

### `Module not found` errors
```bash
# Reinstall all dependencies:
rm -rf node_modules
npm install
```

---

## 📋 Quick Reference Checklist (for AI agents)

- [ ] Node.js ≥ 18 installed (`node --version`)
- [ ] Build tools installed (xcode-select / build-essential)
- [ ] Project extracted to target directory
- [ ] `npm install` completed successfully
- [ ] `.env.local` created with a unique `JWT_SECRET`
- [ ] App starts with `npm run dev` or `npm run build && npm start`
- [ ] Login page visible at `http://localhost:PORT`
- [ ] Admin login works with username `admin`
