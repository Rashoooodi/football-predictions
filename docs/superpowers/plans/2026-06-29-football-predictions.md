# Football Predictions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark-mode Next.js web app for tracking football match predictions within a family, with username + PIN login, admin-managed matches, and WhatsApp history import.

**Architecture:** Next.js App Router with server actions, SQLite database via better-sqlite3, Tailwind CSS dark mode, file-based PFP storage, hosted via Tailscale funnel.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, better-sqlite3, jose (JWT), sharp (image resize)

**Spec:** `docs/superpowers/specs/2026-06-29-football-predictions-design.md`

---

## File Structure

```
football-predictions/
├── app/
│   ├── layout.tsx              # Root layout, dark mode, font
│   ├── page.tsx                # Login page
│   ├── globals.css             # Tailwind + dark theme vars
│   ├── leaderboard/page.tsx    # Main dashboard
│   ├── predict/[matchId]/page.tsx  # Prediction form
│   ├── family/page.tsx         # Family members grid
│   ├── history/page.tsx        # Past matches
│   └── admin/
│       ├── page.tsx            # Admin panel tabs
│       ├── users/page.tsx      # User management
│       ├── matches/page.tsx    # Create match
│       ├── results/page.tsx    # Enter results
│       └── import/page.tsx     # WhatsApp import
├── components/
│   ├── MatchCard.tsx           # 2-match card layout
│   ├── Leaderboard.tsx         # Ranked list
│   ├── CountdownTimer.tsx      # Time remaining
│   ├── CountrySelector.tsx     # Searchable flag dropdown
│   ├── MatchDetail.tsx         # All predictions for a match
│   ├── ShareButton.tsx         # WhatsApp share
│   └── StatsBadge.tsx          # Fun stats display
├── lib/
│   ├── db.ts                   # SQLite connection + schema
│   ├── auth.ts                 # JWT session helpers
│   ├── countries.ts            # Country data with flags
│   └── scoring.ts              # Points calculation
├── data/
│   └── countries.json          # 32 teams
├── public/
│   └── uploads/                # PFP images
├── middleware.ts               # Auth check
├── football.db                 # SQLite file
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `next.config.js`
- Create: `app/globals.css`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/<your-user>/projects/football-predictions
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --no-eslint --use-npm
```

When prompted: Yes to TypeScript, Tailwind, App Router. No to src dir, ESLint, import alias.

- [ ] **Step 2: Install dependencies**

```bash
npm install better-sqlite3 jose sharp
npm install -D @types/better-sqlite3
```

- [ ] **Step 3: Configure Tailwind for dark mode**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#1a1a1a",
        accent: "#10b981",
        border: "#2a2a2a",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Set up global dark styles**

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  background: #0a0a0a;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
}

@layer components {
  .card {
    @apply bg-surface border border-border rounded-xl p-4;
  }
  .btn-primary {
    @apply bg-accent text-black font-semibold rounded-lg px-4 py-2 hover:bg-emerald-400 transition;
  }
  .btn-secondary {
    @apply bg-transparent border border-border text-white rounded-lg px-4 py-2 hover:bg-surface transition;
  }
  .input {
    @apply bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent w-full;
  }
}
```

- [ ] **Step 5: Verify dev server runs**

```bash
npm run dev
```

Open http://localhost:3000 — should show dark page with Next.js logo.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with dark mode"
```

---

## Task 2: Database Setup

**Files:**
- Create: `lib/db.ts`
- Create: `lib/init-db.ts`

- [ ] **Step 1: Create database connection module**

Create `lib/db.ts`:

```typescript
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "football.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export default db;
```

- [ ] **Step 2: Create schema initialization**

Create `lib/init-db.ts`:

```typescript
import db from "./db";

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      pfp_path TEXT,
      is_admin INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team1_country TEXT NOT NULL,
      team2_country TEXT NOT NULL,
      team1_flag TEXT NOT NULL,
      team2_flag TEXT NOT NULL,
      kickoff_time TEXT NOT NULL,
      prediction_deadline TEXT NOT NULL,
      team1_score INTEGER,
      team2_score INTEGER,
      is_finished INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS predictions (
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

    CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
  `);

  // Create admin user if none exists
  const admin = db.prepare("SELECT id FROM users WHERE username = ?").get("admin");
  if (!admin) {
    db.prepare(
      "INSERT INTO users (name, username, is_admin) VALUES (?, ?, 1)"
    ).run("Admin", "admin");
    console.log("Created admin user: Admin (admin)");
  }
}

initDb();
```

- [ ] **Step 3: Create countries data file**

Create `data/countries.json`:

```json
[
  { "name": "Qatar", "flag": "🇶🇦" },
  { "name": "Ecuador", "flag": "🇪🇨" },
  { "name": "Senegal", "flag": "🇸🇳" },
  { "name": "Netherlands", "flag": "🇳🇱" },
  { "name": "England", "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { "name": "Iran", "flag": "🇮🇷" },
  { "name": "USA", "flag": "🇺🇸" },
  { "name": "Wales", "flag": "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { "name": "France", "flag": "🇫🇷" },
  { "name": "Australia", "flag": "🇦🇺" },
  { "name": "Denmark", "flag": "🇩🇰" },
  { "name": "Tunisia", "flag": "🇹🇳" },
  { "name": "Argentina", "flag": "🇦🇷" },
  { "name": "Saudi Arabia", "flag": "🇸🇦" },
  { "name": "Mexico", "flag": "🇲🇽" },
  { "name": "Poland", "flag": "🇵🇱" },
  { "name": "Belgium", "flag": "🇧🇪" },
  { "name": "Canada", "flag": "🇨🇦" },
  { "name": "Morocco", "flag": "🇲🇦" },
  { "name": "Croatia", "flag": "🇭🇷" },
  { "name": "Brazil", "flag": "🇧🇷" },
  { "name": "Serbia", "flag": "🇷🇸" },
  { "name": "Cameroon", "flag": "🇨🇲" },
  { "name": "Switzerland", "flag": "🇨🇭" },
  { "name": "Portugal", "flag": "🇵🇹" },
  { "name": "Ghana", "flag": "🇬🇭" },
  { "name": "Uruguay", "flag": "🇺🇾" },
  { "name": "South Korea", "flag": "🇰🇷" },
  { "name": "Germany", "flag": "🇩🇪" },
  { "name": "Japan", "flag": "🇯🇵" },
  { "name": "Spain", "flag": "🇪🇸" },
  { "name": "Costa Rica", "flag": "🇨🇷" }
]
```

- [ ] **Step 4: Create countries helper**

Create `lib/countries.ts`:

```typescript
import countries from "../data/countries.json";

export type Country = { name: string; flag: string };

export function getAllCountries(): Country[] {
  return countries;
}

export function getCountryByName(name: string): Country | undefined {
  return countries.find((c) => c.name === name);
}
```

- [ ] **Step 5: Test database initialization**

```bash
npx tsx lib/init-db.ts
```

Expected output: `Created admin user: Admin (+0000000000)` (first run) or no output (second run).

Verify `football.db` was created:

```bash
ls -la football.db
```

- [ ] **Step 6: Add tsx as dev dependency**

```bash
npm install -D tsx
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: set up SQLite database with schema and country data"
```

---

## Task 3: Authentication

**Files:**
- Create: `lib/auth.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create auth helpers**

Create `lib/auth.ts`:

```typescript
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import db from "./db";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);

export type Session = {
  userId: number;
  isAdmin: boolean;
};

export async function createSession(userId: number): Promise<void> {
  const user = db
    .prepare("SELECT is_admin FROM users WHERE id = ?")
    .get(userId) as { is_admin: number } | undefined;

  if (!user) throw new Error("User not found");

  const token = await new SignJWT({ userId, isAdmin: !!user.is_admin })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);

  cookies().set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      userId: payload.userId as number,
      isAdmin: payload.isAdmin as boolean,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireUser();
  if (!session.isAdmin) throw new Error("Admin only");
  return session;
}

export function logout(): void {
  cookies().delete("session");
}

export function authenticateUsername(username: string): number | null {
  const user = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username.trim().toLowerCase()) as { id: number } | undefined;
  return user?.id ?? null;
}
```

- [ ] **Step 2: Create middleware for route protection**

Create `middleware.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);

const PUBLIC_ROUTES = ["/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);

    // Admin route check
    if (pathname.startsWith("/admin") && !payload.isAdmin) {
      return NextResponse.redirect(new URL("/leaderboard", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
```

- [ ] **Step 3: Create .env file**

Create `.env.local`:

```
JWT_SECRET=your-random-secret-here-change-this
```

- [ ] **Step 4: Add .env.local to .gitignore**

Ensure `.gitignore` contains:

```
.env*.local
football.db
node_modules/
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add JWT auth with route protection middleware"
```

---

## Task 4: Login Page

**Files:**
- Create: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `app/api/login/route.ts`

- [ ] **Step 1: Update root layout**

Replace `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Football Predictions",
  description: "World Cup prediction tracker for the family",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create login API route**

Create `app/api/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { authenticateUsername, createSession, verifyPin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, pin } = await request.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const userId = authenticateUsername(username.trim());
  if (!userId) {
    return NextResponse.json({ error: "Account not found. Ask the admin to add you." }, { status: 404 });
  }

  // If user has a PIN set, require it. If not, the client should prompt the user to set one.
  if (pin && typeof pin === "string") {
    const ok = verifyPin(userId, pin.trim());
    if (!ok) return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Account not found. Ask the admin to add you." },
      { status: 404 }
    );
  }

  await createSession(userId);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create login page**

Replace `app/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin }),
    });

    if (res.ok) {
      router.push("/leaderboard");
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-1">⚽ Predictions</h1>
        <p className="text-gray-400 text-sm mb-6">Enter your username (and PIN if you have one)</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            required
          />
          <input
            type="password"
            placeholder="PIN (4 digits)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="input mt-2"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Test login flow**

```bash
npm run dev
```

1. Open http://localhost:3000
2. Enter `+0000000000`
3. Should redirect to `/leaderboard` (will show 404 — we haven't built it yet)
4. Try wrong number → should show "Account not found" error

- [ ] **Step 5: Commit**

```bash
git add -A
  git commit -m "feat: username+PIN login page with JWT session"
```

---

## Task 5: Admin Panel - User Management

**Files:**
- Create: `app/admin/page.tsx`
- Create: `app/admin/users/page.tsx`
- Create: `app/api/users/route.ts`
- Create: `app/api/users/[id]/route.ts`
- Create: `components/UserForm.tsx`

- [ ] **Step 1: Create admin layout shell**

Create `app/admin/page.tsx`:

```typescript
import Link from "next/link";

export default function AdminPage() {
  const tabs = [
    { href: "/admin/users", label: "Users", desc: "Add/edit family members" },
    { href: "/admin/matches", label: "Matches", desc: "Create upcoming matches" },
    { href: "/admin/results", label: "Results", desc: "Enter final scores" },
    { href: "/admin/import", label: "Import", desc: "Backfill WhatsApp history" },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <div className="grid gap-3">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="card hover:border-accent transition">
            <div className="font-semibold">{t.label}</div>
            <div className="text-sm text-gray-400">{t.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create users API route**

Create `app/api/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = db.prepare("SELECT * FROM users ORDER BY name").all();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const pfp = formData.get("pfp") as File | null;

  if (!name || !username) {
    return NextResponse.json({ error: "Name and username required" }, { status: 400 });
  }

  let pfpPath: string | null = null;
  if (pfp && pfp.size > 0) {
    const sharp = (await import("sharp")).default;
    const buf = Buffer.from(await pfp.arrayBuffer());
    const safeName = username.replace(/[^a-z0-9_-]/gi, "");
    const filename = `${Date.now()}-${safeName}.jpg`;
    const filepath = `public/uploads/${filename}`;
    await sharp(buf).resize(200, 200, { fit: "cover" }).jpeg().toFile(filepath);
    pfpPath = `/uploads/${filename}`;
  }

  try {
    const result = db
      .prepare("INSERT INTO users (name, username, pfp_path) VALUES (?, ?, ?)")
      .run(name, username, pfpPath);
    return NextResponse.json({ id: result.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }
}
```

- [ ] **Step 3: Create user delete route**

Create `app/api/users/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(params.id);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Create user management page**

Create `app/admin/users/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";

type User = {
  id: number;
  name: string;
  username: string;
  pfp_path: string | null;
  is_admin: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pfp, setPfp] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    const res = await fetch("/api/users");
    setUsers(await res.json());
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("username", username);
    if (pfp) formData.append("pfp", pfp);

    const res = await fetch("/api/users", { method: "POST", body: formData });

    if (res.ok) {
      setName("");
      setPhone("");
      setPfp(null);
      await loadUsers();
    } else {
      const data = await res.json();
      setError(data.error);
    }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this user? All their predictions will be removed.")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    await loadUsers();
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Users</h1>

      <form onSubmit={handleSubmit} className="card mb-6 space-y-3">
        <h2 className="font-semibold">Add New User</h2>
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="file" accept="image/*" onChange={(e) => setPfp(e.target.files?.[0] ?? null)} className="input" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Adding..." : "Add User"}
        </button>
      </form>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="card flex items-center gap-3">
            {u.pfp_path ? (
              <img src={u.pfp_path} alt={u.name} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center">
                {u.name[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="font-medium">{u.name} {u.is_admin ? "👑" : ""}</div>
              <div className="text-sm text-gray-400">{u.username}</div>
            </div>
            {!u.is_admin && (
              <button onClick={() => handleDelete(u.id)} className="text-red-400 text-sm">Delete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create uploads directory**

```bash
mkdir -p public/uploads
echo "uploads here" > public/uploads/.gitkeep
```

- [ ] **Step 6: Test user management**

```bash
npm run dev
```

1. Login as admin (admin)
2. Go to http://localhost:3000/admin → Users
3. Add a user (e.g., "Ahmed", username `ahmed`, with a photo)
4. Verify user appears in list with photo
5. Try adding same username again → should show "already exists" error
6. Delete the user → should disappear

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: admin user management with PFP upload"
```

---

## Task 6: Admin - Create Match with Country Selector

**Files:**
- Create: `app/admin/matches/page.tsx`
- Create: `app/api/matches/route.ts`
- Create: `components/CountrySelector.tsx`

- [ ] **Step 1: Create matches API route**

Create `app/api/matches/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const matches = db
    .prepare("SELECT * FROM matches ORDER BY kickoff_time DESC")
    .all();
  return NextResponse.json(matches);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { team1, team2, kickoffTime, predictionDeadline } = await request.json();

  if (!team1 || !team2 || !kickoffTime || !predictionDeadline) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const result = db
    .prepare(
      `INSERT INTO matches (team1_country, team2_country, team1_flag, team2_flag, kickoff_time, prediction_deadline)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      team1.name, team2.name, team1.flag,
      team2.name, team2.flag,
      kickoffTime, predictionDeadline
    );

  return NextResponse.json({ id: result.lastInsertRowid });
}
```

- [ ] **Step 2: Create CountrySelector component**

Create `components/CountrySelector.tsx`:

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { getAllCountries } from "@/lib/countries";

type Country = { name: string; flag: string };

export default function CountrySelector({
  value,
  onChange,
  label,
}: {
  value: Country | null;
  onChange: (c: Country) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const countries = getAllCountries();
  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input text-left flex items-center gap-2"
      >
        {value ? (
          <>
            <span className="text-xl">{value.flag}</span>
            <span>{value.name}</span>
          </>
        ) : (
          <span className="text-gray-500">Select country...</span>
        )}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-lg max-h-60 overflow-y-auto">
          <input
            autoFocus
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input border-0 rounded-none border-b border-border"
          />
          {filtered.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                onChange(c);
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 hover:bg-border flex items-center gap-2"
            >
              <span className="text-xl">{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-gray-500">No countries found</div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create match creation page**

Create `app/admin/matches/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CountrySelector from "@/components/CountrySelector";

type Country = { name: string; flag: string };

export default function CreateMatchPage() {
  const [team1, setTeam1] = useState<Country | null>(null);
  const [team2, setTeam2] = useState<Country | null>(null);
  const [kickoffTime, setKickoffTime] = useState("");
  const [predictionDeadline, setPredictionDeadline] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!team1 || !team2) {
      setError("Please select both teams");
      return;
    }

    if (new Date(predictionDeadline) > new Date(kickoffTime)) {
      setError("Prediction deadline must be before kickoff time");
      return;
    }

    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team1, team2, kickoffTime, predictionDeadline,
      }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.error);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create Match</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CountrySelector value={team1} onChange={setTeam1} label="Team 1" />
          <CountrySelector value={team2} onChange={setTeam2} label="Team 2" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Kickoff Time</label>
          <input
            type="datetime-local"
            value={kickoffTime}
            onChange={(e) => setKickoffTime(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Prediction Deadline</label>
          <input
            type="datetime-local"
            value={predictionDeadline}
            onChange={(e) => setPredictionDeadline(e.target.value)}
            className="input"
            required
          />
          <p className="text-xs text-gray-500 mt-1">When predictions lock</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="btn-primary w-full">Create Match</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Test match creation**

```bash
npm run dev
```

1. Login as admin → /admin → Matches
2. Select Brazil vs Argentina
3. Set kickoff time to future
4. Set deadline before kickoff
5. Submit → should redirect to /admin
6. Verify match in database:
   ```bash
   npx tsx -e "import db from './lib/db'; console.log(db.prepare('SELECT * FROM matches').all())"
   ```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: admin match creation with country selector"
```

---

## Task 7: Scoring Logic

**Files:**
- Create: `lib/scoring.ts`

- [ ] **Step 1: Create scoring helper**

Create `lib/scoring.ts`:

```typescript
import db from "./db";

export type LeaderboardEntry = {
  user_id: number;
  name: string;
  pfp_path: string | null;
  points: number;
  correct_count: number;
  rank: number;
};

export function calculateLeaderboard(): LeaderboardEntry[] {
  const users = db
    .prepare(`
      SELECT u.id as user_id, u.name, u.pfp_path,
             COUNT(p.id) as correct_count
      FROM users u
      LEFT JOIN predictions p ON p.user_id = u.id
      LEFT JOIN matches m ON p.match_id = m.id
      WHERE m.is_finished = 1
        AND p.team1_score = m.team1_score
        AND p.team2_score = m.team2_score
      GROUP BY u.id
    `)
    .all() as { user_id: number; name: string; pfp_path: string | null; correct_count: number }[];

  // For tiebreaker: get earliest submission time of last correct prediction
  const withPoints = users.map((u) => {
    const lastCorrect = db
      .prepare(`
        SELECT MIN(p.submitted_at) as earliest
        FROM predictions p
        JOIN matches m ON p.match_id = m.id
        WHERE p.user_id = ?
          AND m.is_finished = 1
          AND p.team1_score = m.team1_score
          AND p.team2_score = m.team2_score
      `)
      .get(u.user_id) as { earliest: string | null };

    return {
      ...u,
      points: u.correct_count,
      earliest_correct: lastCorrect.earliest,
    };
  });

  // Sort: points desc, then earliest correct asc
  withPoints.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (a.earliest_correct && b.earliest_correct) {
      return a.earliest_correct.localeCompare(b.earliest_correct);
    }
    return 0;
  });

  return withPoints.map((u, i) => ({
    user_id: u.user_id,
    name: u.name,
    pfp_path: u.pfp_path,
    points: u.points,
    correct_count: u.correct_count,
    rank: i + 1,
  }));
}

export function getMatchResults(matchId: number) {
  const match = db
    .prepare("SELECT * FROM matches WHERE id = ?")
    .get(matchId) as any;

  if (!match || !match.is_finished) return null;

  const predictions = db
    .prepare(`
      SELECT p.*, u.name, u.pfp_path
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.match_id = ?
      ORDER BY p.submitted_at ASC
    `)
    .all(matchId);

  const correct = predictions.filter(
    (p: any) =>
      p.team1_score === match.team1_score && p.team2_score === match.team2_score
  );

  return { match, predictions, correct };
}
```

- [ ] **Step 2: Create leaderboard API route**

Create `app/api/leaderboard/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { calculateLeaderboard } from "@/lib/scoring";

export async function GET() {
  const leaderboard = calculateLeaderboard();
  return NextResponse.json(leaderboard);
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: scoring logic and leaderboard API"
```

---

## Task 8: Prediction Page

**Files:**
- Create: `app/api/predictions/route.ts`
- Create: `app/api/predictions/[matchId]/route.ts`
- Create: `app/predict/[matchId]/page.tsx`

- [ ] **Step 1: Create predictions API route**

Create `app/api/predictions/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId, team1Score, team2Score } = await request.json();

  const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(matchId) as any;
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  if (new Date(match.prediction_deadline) < new Date()) {
    return NextResponse.json({ error: "Predictions locked" }, { status: 403 });
  }

  if (team1Score < 0 || team2Score < 0) {
    return NextResponse.json({ error: "Scores must be non-negative" }, { status: 400 });
  }

  db.prepare(`
    INSERT INTO predictions (user_id, match_id, team1_score, team2_score, submitted_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, match_id) DO UPDATE SET
      team1_score = excluded.team1_score,
      team2_score = excluded.team2_score,
      submitted_at = datetime('now')
  `).run(session.userId, matchId, team1Score, team2Score);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create get prediction route**

Create `app/api/predictions/[matchId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prediction = db
    .prepare("SELECT * FROM predictions WHERE user_id = ? AND match_id = ?")
    .get(session.userId, params.matchId);

  return NextResponse.json(prediction || null);
}
```

- [ ] **Step 3: Create prediction page**

Create `app/predict/[matchId]/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CountdownTimer from "@/components/CountdownTimer";

type Match = {
  id: number;
  team1_country: string;
  team2_country: string;
  team1_flag: string;
  team2_flag: string;
  kickoff_time: string;
  prediction_deadline: string;
  team1_score: number | null;
  team2_score: number | null;
  is_finished: number;
};

export default function PredictPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [existing, setExisting] = useState<{ team1_score: number; team2_score: number } | null>(null);
  const [score1, setScore1] = useState("0");
  const [score2, setScore2] = useState("0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const [matchRes, predRes] = await Promise.all([
        fetch(`/api/matches?id=${matchId}`),
        fetch(`/api/predictions/${matchId}`),
      ]);

      if (matchRes.ok) {
        const m = await matchRes.json();
        setMatch(m);
      }

      if (predRes.ok) {
        const p = await predRes.json();
        if (p) {
          setExisting(p);
          setScore1(String(p.team1_score));
          setScore2(String(p.team2_score));
        }
      }
    }
    load();
  }, [matchId]);

  const deadlinePassed = match
    ? new Date(match.prediction_deadline) < new Date()
    : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: Number(matchId),
        team1Score: Number(score1),
        team2Score: Number(score2),
      }),
    });

    if (res.ok) {
      router.push("/leaderboard");
    } else {
      const data = await res.json();
      setError(data.error);
    }
    setLoading(false);
  }

  if (!match) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Predict</h1>

      <div className="card mb-4">
        <div className="flex items-center justify-between text-3xl mb-2">
          <div className="text-center flex-1">
            <div className="text-5xl">{match.team1_flag}</div>
            <div className="text-sm mt-1">{match.team1_country}</div>
          </div>
          <div className="text-gray-500">vs</div>
          <div className="text-center flex-1">
            <div className="text-5xl">{match.team2_flag}</div>
            <div className="text-sm mt-1">{match.team2_country}</div>
          </div>
        </div>
        <div className="text-center text-sm text-gray-400">
          Kickoff: {new Date(match.kickoff_time).toLocaleString()}
        </div>
        <CountdownTimer deadline={match.prediction_deadline} kickoff={match.kickoff_time} />
      </div>

      {deadlinePassed ? (
        <div className="card text-center text-gray-400">
          🔒 Predictions locked
          {match.is_finished && (
            <div className="mt-2 text-2xl font-bold text-white">
              {match.team1_score} - {match.team2_score}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="flex items-center justify-center gap-4">
            <input
              type="number"
              min="0"
              max="20"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              className="input w-20 text-center text-2xl"
            />
            <span className="text-2xl text-gray-500">-</span>
            <input
              type="number"
              min="0"
              max="20"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              className="input w-20 text-center text-2xl"
            />
          </div>

          {existing && (
            <p className="text-sm text-gray-400 text-center">
              You predicted {existing.team1_score} - {existing.team2_score}
            </p>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Saving..." : existing ? "Update Prediction" : "Submit Prediction"}
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add matches by id GET**

Modify `app/api/matches/route.ts` to add a GET by id handler. Create `app/api/matches/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(params.id);
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(match);
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: prediction page with score input and deadline locking"
```

---

## Task 9: Countdown Timer Component

**Files:**
- Create: `components/CountdownTimer.tsx`

- [ ] **Step 1: Create countdown component**

Create `components/CountdownTimer.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";

export default function CountdownTimer({
  deadline,
  kickoff,
}: {
  deadline: string;
  kickoff: string;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const deadlineMs = new Date(deadline).getTime();
  const kickoffMs = new Date(kickoff).getTime();
  const liveEnd = kickoffMs + 2 * 60 * 60 * 1000;

  function format(ms: number): string {
    if (ms <= 0) return "0m";
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  let label = "";
  let color = "text-gray-400";

  if (now < deadlineMs) {
    label = `⏰ Predictions close in ${format(deadlineMs - now)}`;
    color = "text-accent";
  } else if (now < kickoffMs) {
    label = `⚽ Match starts in ${format(kickoffMs - now)}`;
    color = "text-yellow-400";
  } else if (now < liveEnd) {
    label = "🔴 LIVE";
    color = "text-red-400";
  } else {
    label = "Finished";
    color = "text-gray-500";
  }

  return <div className={`text-center text-sm font-medium mt-2 ${color}`}>{label}</div>;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: countdown timer component"
```

---

## Task 10: Leaderboard Page

**Files:**
- Create: `app/leaderboard/page.tsx`
- Create: `components/MatchCard.tsx`
- Create: `components/MatchDetail.tsx`
- Create: `app/api/matches/today/route.ts`

- [ ] **Step 1: Create today's matches API**

Create `app/api/matches/today/route.ts`:

```typescript
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const matches = db
    .prepare(`
      SELECT * FROM matches
      WHERE date(kickoff_time) = date('now')
         OR (kickoff_time > datetime('now') AND kickoff_time < datetime('now', '+2 days'))
      ORDER BY kickoff_time ASC
    `)
    .all();

  return NextResponse.json(matches);
}
```

- [ ] **Step 2: Create MatchCard component (2 matches per card)**

Create `components/MatchCard.tsx`:

```typescript
"use client";

import Link from "next/link";
import CountdownTimer from "./CountdownTimer";

type Match = {
  id: number;
  team1_country: string;
  team2_country: string;
  team1_flag: string;
  team2_flag: string;
  kickoff_time: string;
  prediction_deadline: string;
  team1_score: number | null;
  team2_score: number | null;
  is_finished: number;
};

function StatusBadge({ match }: { match: Match }) {
  const now = Date.now();
  const kickoff = new Date(match.kickoff_time).getTime();
  const liveEnd = kickoff + 2 * 60 * 60 * 1000;

  let label = "";
  let color = "";

  if (match.is_finished) {
    label = "Finished";
    color = "bg-gray-600 text-gray-200";
  } else if (now < kickoff) {
    label = "Upcoming";
    color = "bg-emerald-900 text-emerald-300";
  } else if (now < liveEnd) {
    label = "Live";
    color = "bg-red-900 text-red-300";
  } else {
    label = "Finished";
    color = "bg-gray-600 text-gray-200";
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{label}</span>
  );
}

function MatchItem({ match }: { match: Match }) {
  return (
    <Link href={`/predict/${match.id}`} className="block p-3 hover:bg-border rounded-lg transition">
      <div className="flex items-center justify-between mb-1">
        <StatusBadge match={match} />
        <span className="text-xs text-gray-500">
          {new Date(match.kickoff_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{match.team1_flag}</span>
          <span className="text-sm truncate">{match.team1_country}</span>
        </div>
        <div className="text-center px-2">
          {match.is_finished ? (
            <span className="text-lg font-bold">{match.team1_score} - {match.team2_score}</span>
          ) : (
            <span className="text-gray-500 text-sm">vs</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm truncate">{match.team2_country}</span>
          <span className="text-2xl">{match.team2_flag}</span>
        </div>
      </div>
      <CountdownTimer deadline={match.prediction_deadline} kickoff={match.kickoff_time} />
    </Link>
  );
}

export default function MatchCard({ matches }: { matches: Match[] }) {
  return (
    <div className="card">
      <div className={`grid ${matches.length > 1 ? "grid-cols-2" : "grid-cols-1"} divide-x divide-border`}>
        {matches.map((m) => (
          <MatchItem key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create leaderboard page**

Create `app/leaderboard/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MatchCard from "@/components/MatchCard";

type LeaderboardEntry = {
  user_id: number;
  name: string;
  pfp_path: string | null;
  points: number;
  correct_count: number;
  rank: number;
};

type Match = {
  id: number;
  team1_country: string;
  team2_country: string;
  team1_flag: string;
  team2_flag: string;
  kickoff_time: string;
  prediction_deadline: string;
  team1_score: number | null;
  team2_score: number | null;
  is_finished: number;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    async function load() {
      const [lbRes, matchRes] = await Promise.all([
        fetch("/api/leaderboard"),
        fetch("/api/matches/today"),
      ]);
      setLeaderboard(await lbRes.json());
      setMatches(await matchRes.json());
    }
    load();
  }, []);

  // Group matches into pairs of 2
  const matchPairs: Match[][] = [];
  for (let i = 0; i < matches.length; i += 2) {
    matchPairs.push(matches.slice(i, i + 2));
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">⚽ Leaderboard</h1>
        <div className="flex gap-2">
          <Link href="/family" className="btn-secondary text-sm">Family</Link>
          <Link href="/history" className="btn-secondary text-sm">History</Link>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card mb-6">
        {leaderboard.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No matches finished yet</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div key={entry.user_id} className="flex items-center gap-3 py-2">
                <div className="w-8 text-center font-bold text-lg">
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                </div>
                {entry.pfp_path ? (
                  <img src={entry.pfp_path} alt={entry.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center">
                    {entry.name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{entry.name}</div>
                  <div className="text-xs text-gray-400">{entry.correct_count} correct</div>
                </div>
                <div className="text-2xl font-bold">{entry.points}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Matches */}
      <h2 className="text-lg font-semibold mb-3">Matches</h2>
      {matchPairs.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No upcoming matches</p>
      ) : (
        <div className="space-y-3">
          {matchPairs.map((pair, i) => (
            <MatchCard key={i} matches={pair} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Test leaderboard**

```bash
npm run dev
```

1. Login → should see leaderboard (empty if no finished matches)
2. Matches section shows upcoming matches in 2-per-card layout
3. Click a match → goes to prediction page

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: leaderboard page with 2-match cards"
```

---

## Task 11: Admin - Enter Results

**Files:**
- Create: `app/admin/results/page.tsx`
- Create: `app/api/matches/[id]/result/route.ts`

- [ ] **Step 1: Create result entry API**

Create `app/api/matches/[id]/result/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { team1Score, team2Score } = await request.json();

  if (team1Score < 0 || team2Score < 0) {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  db.prepare(`
    UPDATE matches
    SET team1_score = ?, team2_score = ?, is_finished = 1
    WHERE id = ?
  `).run(team1Score, team2Score, params.id);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create results page**

Create `app/admin/results/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";

type Match = {
  id: number;
  team1_country: string;
  team2_country: string;
  team1_flag: string;
  team2_flag: string;
  kickoff_time: string;
  team1_score: number | null;
  team2_score: number | null;
  is_finished: number;
};

export default function ResultsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [scores, setScores] = useState<Record<number, { s1: string; s2: string }>>({});

  async function load() {
    const res = await fetch("/api/matches");
    const all = await res.json();
    // Show recent matches (finished + upcoming that might be done)
    const recent = all
      .filter((m: Match) => new Date(m.kickoff_time) < new Date(Date.now() + 24 * 60 * 60 * 1000))
      .slice(0, 20);
    setMatches(recent);

    const initial: Record<number, { s1: string; s2: string }> = {};
    recent.forEach((m: Match) => {
      initial[m.id] = {
        s1: m.team1_score?.toString() ?? "0",
        s2: m.team2_score?.toString() ?? "0",
      };
    });
    setScores(initial);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(matchId: number) {
    const s = scores[matchId];
    if (!s) return;

    const res = await fetch(`/api/matches/${matchId}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team1Score: Number(s.s1),
        team2Score: Number(s.s2),
      }),
    });

    if (res.ok) {
      await load();
      alert("Result saved!");
    } else {
      const data = await res.json();
      alert(data.error);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Enter Results</h1>

      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{m.team1_flag}</span>
                <span className="text-sm">{m.team1_country}</span>
                <span className="text-gray-500 mx-1">vs</span>
                <span className="text-2xl">{m.team2_flag}</span>
                <span className="text-sm">{m.team2_country}</span>
              </div>
              {m.is_finished ? (
                <span className="text-xs bg-gray-600 text-gray-200 px-2 py-0.5 rounded-full">Done</span>
              ) : (
                <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded-full">Pending</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={scores[m.id]?.s1 ?? "0"}
                onChange={(e) => setScores({ ...scores, [m.id]: { ...scores[m.id], s1: e.target.value } })}
                className="input w-16 text-center text-xl"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                min="0"
                value={scores[m.id]?.s2 ?? "0"}
                onChange={(e) => setScores({ ...scores, [m.id]: { ...scores[m.id], s2: e.target.value } })}
                className="input w-16 text-center text-xl"
              />
              <button onClick={() => handleSubmit(m.id)} className="btn-primary ml-auto">
                Save
              </button>
            </div>
          </div>
        ))}
        {matches.length === 0 && (
          <p className="text-gray-400 text-center py-8">No matches to score</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Test result entry**

1. Login as admin → /admin → Results
2. See list of recent matches
3. Enter scores for a match
4. Click Save → should show "Done" badge
5. Check leaderboard → winner's points should update

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: admin result entry with scoring"
```

---

## Task 12: Family View

**Files:**
- Create: `app/family/page.tsx`
- Create: `app/api/family/route.ts`

- [ ] **Step 1: Create family API**

Create `app/api/family/route.ts`:

```typescript
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const members = db
    .prepare(`
      SELECT u.id, u.name, u.pfp_path, u.is_admin,
        COUNT(p.id) as total_predictions,
        SUM(CASE WHEN m.is_finished = 1
                  AND p.team1_score = m.team1_score
                  AND p.team2_score = m.team2_score
                 THEN 1 ELSE 0 END) as correct
      FROM users u
      LEFT JOIN predictions p ON p.user_id = u.id
      LEFT JOIN matches m ON p.match_id = m.id
      GROUP BY u.id
      ORDER BY correct DESC
    `)
    .all();

  return NextResponse.json(members);
}
```

- [ ] **Step 2: Create family page**

Create `app/family/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Member = {
  id: number;
  name: string;
  pfp_path: string | null;
  is_admin: number;
  total_predictions: number;
  correct: number;
};

export default function FamilyPage() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetch("/api/family").then((r) => r.json()).then(setMembers);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Family</h1>
        <Link href="/leaderboard" className="btn-secondary text-sm">Back</Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {members.map((m) => (
          <div key={m.id} className="card text-center">
            {m.pfp_path ? (
              <img src={m.pfp_path} alt={m.name} className="w-16 h-16 rounded-full mx-auto mb-2" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-border flex items-center justify-center mx-auto mb-2 text-xl">
                {m.name[0]}
              </div>
            )}
            <div className="font-semibold">{m.name} {m.is_admin ? "👑" : ""}</div>
            <div className="text-sm text-gray-400 mt-1">
              {m.correct || 0} correct / {m.total_predictions || 0} predictions
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: family view page"
```

---

## Task 13: History Page with Match Detail

**Files:**
- Create: `app/history/page.tsx`
- Create: `components/MatchDetail.tsx`
- Create: `app/api/history/route.ts`

- [ ] **Step 1: Create history API**

Create `app/api/history/route.ts`:

```typescript
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const matches = db
    .prepare(`
      SELECT m.*,
        COUNT(p.id) as prediction_count,
        SUM(CASE WHEN p.team1_score = m.team1_score
                  AND p.team2_score = m.team2_score
                 THEN 1 ELSE 0 END) as correct_count
      FROM matches m
      LEFT JOIN predictions p ON p.match_id = m.id
      WHERE m.is_finished = 1
      GROUP BY m.id
      ORDER BY m.kickoff_time DESC
    `)
    .all();

  return NextResponse.json(matches);
}
```

- [ ] **Step 2: Create match detail API**

Create `app/api/matches/[id]/predictions/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(params.id) as any;
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const predictions = db
    .prepare(`
      SELECT p.*, u.name, u.pfp_path
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.match_id = ?
      ORDER BY p.submitted_at ASC
    `)
    .all(params.id);

  const correct = predictions.filter(
    (p: any) =>
      match.is_finished &&
      p.team1_score === match.team1_score &&
      p.team2_score === match.team2_score
  );

  return NextResponse.json({ match, predictions, correct });
}
```

- [ ] **Step 3: Create MatchDetail component**

Create `components/MatchDetail.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import ShareButton from "./ShareButton";

type Detail = {
  match: {
    id: number;
    team1_country: string;
    team2_country: string;
    team1_flag: string;
    team2_flag: string;
    kickoff_time: string;
    team1_score: number | null;
    team2_score: number | null;
    is_finished: number;
  };
  predictions: {
    id: number;
    user_id: number;
    team1_score: number;
    team2_score: number;
    submitted_at: string;
    name: string;
    pfp_path: string | null;
  }[];
  correct: typeof Detail extends never ? never : any[];
};

export default function MatchDetail({ matchId, onClose }: { matchId: number; onClose: () => void }) {
  const [data, setData] = useState<Detail | null>(null);

  useEffect(() => {
    fetch(`/api/matches/${matchId}/predictions`).then((r) => r.json()).then(setData);
  }, [matchId]);

  if (!data) return <div className="p-4">Loading...</div>;

  const { match, predictions, correct } = data;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-surface rounded-xl border border-border max-w-md w-full p-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Match Predictions</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        {/* Match header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <div className="text-3xl">{match.team1_flag}</div>
            <div className="text-sm">{match.team1_country}</div>
          </div>
          <div className="text-2xl font-bold">
            {match.is_finished ? `${match.team1_score} - ${match.team2_score}` : "vs"}
          </div>
          <div className="text-center flex-1">
            <div className="text-3xl">{match.team2_flag}</div>
            <div className="text-sm">{match.team2_country}</div>
          </div>
        </div>

        {/* Predictions list */}
        <div className="space-y-2 mb-4">
          {predictions.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No predictions yet</p>
          ) : (
            predictions.map((p, i) => {
              const isCorrect = match.is_finished &&
                p.team1_score === match.team1_score &&
                p.team2_score === match.team2_score;
              return (
                <div key={p.id} className="flex items-center gap-3 p-2 bg-background rounded-lg">
                  <span className="text-gray-500 w-6">{i + 1}.</span>
                  {p.pfp_path ? (
                    <img src={p.pfp_path} alt={p.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-sm">
                      {p.name[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(p.submitted_at).toLocaleString()}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${isCorrect ? "text-emerald-400" : "text-gray-400"}`}>
                    {p.team1_score} - {p.team2_score}
                    {isCorrect && <span className="ml-1">✓</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Share button */}
        {match.is_finished && (
          <ShareButton matchId={matchId} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create history page**

Create `app/history/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MatchDetail from "@/components/MatchDetail";

type Match = {
  id: number;
  team1_country: string;
  team2_country: string;
  team1_flag: string;
  team2_flag: string;
  kickoff_time: string;
  team1_score: number;
  team2_score: number;
  is_finished: number;
  prediction_count: number;
  correct_count: number;
};

export default function HistoryPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/history").then((r) => r.json()).then(setMatches);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">History</h1>
        <Link href="/leaderboard" className="btn-secondary text-sm">Back</Link>
      </div>

      <div className="space-y-2">
        {matches.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No finished matches yet</p>
        ) : (
          matches.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className="card w-full text-left hover:border-accent transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">{m.team1_flag}</span>
                  <span className="text-sm">{m.team1_country}</span>
                </div>
                <div className="text-lg font-bold">{m.team1_score} - {m.team2_score}</div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-sm">{m.team2_country}</span>
                  <span className="text-2xl">{m.team2_flag}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">
                {m.correct_count} correct out of {m.prediction_count} predictions
              </div>
            </button>
          ))
        )}
      </div>

      {selected && (
        <MatchDetail matchId={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: history page with match detail modal"
```

---

## Task 14: WhatsApp Share Button

**Files:**
- Create: `components/ShareButton.tsx`

- [ ] **Step 1: Create share button**

Create `components/ShareButton.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";

export default function ShareButton({ matchId }: { matchId: number }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/matches/${matchId}/predictions`)
      .then((r) => r.json())
      .then(setData);
  }, [matchId]);

  if (!data) return null;

  const { match, predictions, correct } = data;

  function buildMessage() {
    const lines: string[] = [];
    lines.push(`🏆 ${match.team1_flag} ${match.team1_country} ${match.team1_score}-${match.team2_score} ${match.team2_country} ${match.team2_flag}`);
    lines.push("");

    if (correct.length > 0) {
      lines.push("✅ Correct predictions:");
      correct.forEach((p: any, i: number) => {
        lines.push(`${i + 1}. ${p.name} (${p.team1_score}-${p.team2_score})${i === 0 ? " - 1st place! 🎉" : ""}`);
      });
    } else {
      lines.push("❌ Nobody got it right!");
    }

    lines.push("");
    lines.push("❌ Wrong:");
    const wrong = predictions.filter(
      (p: any) =>
        p.team1_score !== match.team1_score ||
        p.team2_score !== match.team2_score
    );
    wrong.forEach((p: any) => {
      lines.push(`• ${p.name} (${p.team1_score}-${p.team2_score})`);
    });

    return lines.join("\n");
  }

  function handleShare() {
    const message = encodeURIComponent(buildMessage());
    const url = `https://wa.me/?text=${message}`;
    window.open(url, "_blank");
  }

  return (
    <button onClick={handleShare} className="btn-primary w-full">
      📤 Share to WhatsApp
    </button>
  );
}
```

- [ ] **Step 2: Test share**

1. Finish a match with predictions
2. Open history → click match → see Share button
3. Click Share → should open WhatsApp with formatted message

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: WhatsApp share button"
```

---

## Task 15: Import WhatsApp History

**Files:**
- Create: `app/admin/import/page.tsx`
- Create: `app/api/import/route.ts`

- [ ] **Step 1: Create import API**

Create `app/api/import/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId, predictions, team1Score, team2Score, isFinished } = await request.json();

  if (!matchId || !Array.isArray(predictions)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const insertPrediction = db.prepare(`
    INSERT INTO predictions (user_id, match_id, team1_score, team2_score, submitted_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, match_id) DO UPDATE SET
      team1_score = excluded.team1_score,
      team2_score = excluded.team2_score,
      submitted_at = excluded.submitted_at
  `);

  const tx = db.transaction(() => {
    predictions.forEach((p: any) => {
      if (p.team1Score === null || p.team2Score === null) return;
      insertPrediction.run(
        p.userId, matchId, p.team1Score, p.team2Score, p.submittedAt || new Date().toISOString()
      );
    });

    if (isFinished && team1Score !== null && team2Score !== null) {
      db.prepare(`
        UPDATE matches
        SET team1_score = ?, team2_score = ?, is_finished = 1
        WHERE id = ?
      `).run(team1Score, team2Score, matchId);
    }
  });

  tx();

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create import page**

Create `app/admin/import/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = { id: number; name: string; };
type Match = {
  id: number;
  team1_country: string;
  team2_country: string;
  team1_flag: string;
  team2_flag: string;
  kickoff_time: string;
  is_finished: number;
};

export default function ImportPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<Record<number, { s1: string; s2: string; time: string }>>({});
  const [result, setResult] = useState({ s1: "", s2: "" });
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/matches").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([m, u]) => {
      setMatches(m);
      setUsers(u);
    });
  }, []);

  const selectedMatchData = matches.find((m) => m.id === selectedMatch);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) return;

    const preds = Object.entries(predictions)
      .filter(([_, v]) => v.s1 !== "" && v.s2 !== "")
      .map(([userId, v]) => ({
        userId: Number(userId),
        team1Score: Number(v.s1),
        team2Score: Number(v.s2),
        submittedAt: v.time || new Date().toISOString(),
      }));

    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: selectedMatch,
        predictions: preds,
        team1Score: isFinished ? Number(result.s1) : null,
        team2Score: isFinished ? Number(result.s2) : null,
        isFinished,
      }),
    });

    if (res.ok) {
      alert("Imported successfully!");
      router.push("/admin");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Import WhatsApp History</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Match selector */}
        <div className="card">
          <label className="block text-sm text-gray-400 mb-1">Select Match</label>
          <select
            value={selectedMatch ?? ""}
            onChange={(e) => setSelectedMatch(Number(e.target.value))}
            className="input"
            required
          >
            <option value="">Choose a match...</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.team1_flag} {m.team1_country} vs {m.team2_country} {m.team2_flag}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Need to create a match first?{" "}
            <a href="/admin/matches" className="text-accent underline">Create it here</a>
          </p>
        </div>

        {/* Predictions for each user */}
        {selectedMatchData && (
          <div className="card">
            <h2 className="font-semibold mb-3">Predictions</h2>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-2">
                  <div className="flex-1 text-sm">{u.name}</div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={predictions[u.id]?.s1 ?? ""}
                    onChange={(e) => setPredictions({
                      ...predictions,
                      [u.id]: { ...predictions[u.id], s1: e.target.value, time: predictions[u.id]?.time || "" },
                    })}
                    className="input w-14 text-center"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={predictions[u.id]?.s2 ?? ""}
                    onChange={(e) => setPredictions({
                      ...predictions,
                      [u.id]: { ...predictions[u.id], s2: e.target.value, time: predictions[u.id]?.time || "" },
                    })}
                    className="input w-14 text-center"
                  />
                  <input
                    type="datetime-local"
                    value={predictions[u.id]?.time ?? ""}
                    onChange={(e) => setPredictions({
                      ...predictions,
                      [u.id]: { ...predictions[u.id], s1: predictions[u.id]?.s1 ?? "", s2: predictions[u.id]?.s2 ?? "", time: e.target.value },
                    })}
                    className="input text-xs"
                    title="Submission time (for tiebreaker)"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final result */}
        {selectedMatchData && (
          <div className="card">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={isFinished}
                onChange={(e) => setIsFinished(e.target.checked)}
              />
              <span>Match is finished — enter result</span>
            </label>
            {isFinished && (
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedMatchData.team1_flag}</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={result.s1}
                  onChange={(e) => setResult({ ...result, s1: e.target.value })}
                  className="input w-16 text-center"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={result.s2}
                  onChange={(e) => setResult({ ...result, s2: e.target.value })}
                  className="input w-16 text-center"
                />
                <span className="text-xl">{selectedMatchData.team2_flag}</span>
              </div>
            )}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={!selectedMatch}>
          Import
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Test import flow**

1. Create a past match (e.g., Brazil vs Argentina, June 15)
2. Go to /admin/import
3. Select the match
4. Enter predictions for each user with timestamps
5. Check "Match is finished", enter result
6. Click Import → should save everything
7. Check leaderboard → imported predictions should count

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: WhatsApp history import"
```

---

## Task 16: Fun Stats

**Files:**
- Create: `app/api/stats/route.ts`
- Modify: `app/leaderboard/page.tsx`

- [ ] **Step 1: Create stats API**

Create `app/api/stats/route.ts`:

```typescript
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const users = db.prepare("SELECT id, name, pfp_path FROM users").all() as any[];

  const stats = users.map((u) => {
    const matches = db.prepare(`
      SELECT m.id, m.team1_score, m.team2_score, m.is_finished,
             p.team1_score as p1, p.team2_score as p2
      FROM matches m
      LEFT JOIN predictions p ON p.match_id = m.id AND p.user_id = ?
      WHERE m.is_finished = 1
      ORDER BY m.kickoff_time ASC
    `).all(u.id) as any[];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalCorrect = 0;

    for (const m of matches) {
      if (!m.p1) continue;

      const isCorrect = m.p1 === m.team1_score && m.p2 === m.team2_score;

      if (isCorrect) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        totalCorrect++;
      } else {
        tempStreak = 0;
      }
    }

    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      if (!m.p1) continue;
      const isCorrect = m.p1 === m.team1_score && m.p2 === m.team2_score;
      if (isCorrect) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      user_id: u.id,
      name: u.name,
      pfp_path: u.pfp_path,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_correct: totalCorrect,
    };
  });

  const sortedByCorrect = [...stats].sort((a, b) => b.total_correct - a.total_correct);
  const topUser = sortedByCorrect[0];

  return NextResponse.json({
    stats,
    scoreProphet: topUser && topUser.total_correct > 0
      ? { name: topUser.name, count: topUser.total_correct }
      : null,
  });
}
```

- [ ] **Step 2: Add stats to leaderboard**

Modify `app/leaderboard/page.tsx`:

Add to imports:
```typescript
```

Add state:
```typescript
const [stats, setStats] = useState<{ stats: any[]; scoreProphet: any | null }>({ stats: [], scoreProphet: null });
```

Add to the `load` function:
```typescript
const statsRes = await fetch("/api/stats");
const statsData = await statsRes.json();
setStats(statsData);
```

Add this section before the leaderboard card:
```typescript
{stats.scoreProphet && (
  <div className="card mb-4 text-center">
    <div className="text-sm text-gray-400">Score Prophet</div>
    <div className="text-lg font-bold">{stats.scoreProphet.name}</div>
    <div className="text-xs text-gray-500">{stats.scoreProphet.count} correct predictions</div>
  </div>
)}

{stats.stats.some((s) => s.longest_streak > 0) && (
  <div className="card mb-4">
    <h2 className="font-semibold mb-2">Streaks</h2>
    {stats.stats
      .filter((s) => s.longest_streak > 0)
      .sort((a, b) => b.longest_streak - a.longest_streak)
      .slice(0, 3)
      .map((s) => (
        <div key={s.user_id} className="flex justify-between text-sm py-1">
          <span>{s.name}</span>
          <span className="text-gray-400">
            {s.current_streak} current - Best: {s.longest_streak}
          </span>
        </div>
      ))}
  </div>
)}
```

- [ ] **Step 3: Test stats**

1. Finish several matches with predictions
2. Open leaderboard - should see Score Prophet card and streaks

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: fun stats with streaks and score prophet"
```

---

## Task 17: Polish and Tailscale Setup

**Files:**
- Modify: `next.config.js`
- Create: `README.md`

- [ ] **Step 1: Configure Next.js for external hosting**

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

module.exports = nextConfig;
```

- [ ] **Step 2: Build production version**

```bash
npm run build
```

Verify no errors. Then test production mode:

```bash
npm start
```

Open http://localhost:3000 - verify everything works.

- [ ] **Step 3: Create README**

Create `README.md`:

```markdown
# Family Football Predictions

World Cup prediction tracker for the family.

## Setup

1. Install dependencies: `npm install`
2. Initialize database: `npx tsx lib/init-db.ts`
3. Set JWT secret in `.env.local`
4. Run dev server: `npm run dev`

## Admin Access

Default admin: username `admin` (Admin)

## Hosting via Tailscale

1. Install Tailscale: `brew install tailscale`
2. Start the app: `npm start`
3. Expose via funnel: `tailscale funnel 3000`
4. Share the funnel URL with family

## Adding Family Members

1. Login as admin
2. Go to /admin - Users
3. Add each family member with their username and photo (optional PIN)
```

- [ ] **Step 4: Test full flow end-to-end**

1. `npm run dev`
2. Login as admin (+0000000000)
3. Add 2-3 family members via /admin/users
4. Create a match via /admin/matches (e.g., Brazil vs Argentina)
5. Logout, login as a family member
6. Make a prediction
7. Login as admin, enter result via /admin/results
8. Check leaderboard updates
9. Check family view shows stats
10. Check history shows match detail
11. Test WhatsApp share
12. Test import flow with a past match

- [ ] **Step 5: Set up Tailscale funnel**

```bash
brew install tailscale
tailscale up
npm start &
tailscale funnel 3000
```

This gives you a public URL like `https://your-machine.tail-scale.ts.net` to share with family.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: polish, README, and Tailscale funnel setup"
```

---

## Summary

This plan covers 17 tasks:

1. Project setup
2. Database + schema + countries
3. Authentication (JWT)
4. Login page
5. Admin: user management
6. Admin: match creation with country selector
7. Scoring logic
8. Prediction page
9. Countdown timer
10. Leaderboard page (2-match cards)
11. Admin: enter results
12. Family view
13. History page with match detail
14. WhatsApp share
15. Import WhatsApp history
16. Fun stats (streaks, Score Prophet)
17. Polish + Tailscale setup

After completion, you'll have a fully functional family football predictions app with:
- Phone login (no passwords)
- Dark mode UI
- Admin panel for matches, users, results, and import
- Real-time countdown timers
- 2-match-per-card layout
- WhatsApp share
- Leaderboard with fun stats
- Full prediction history
