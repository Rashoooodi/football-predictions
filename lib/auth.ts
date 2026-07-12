import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import db from "./db";

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is missing.");
}
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

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
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.userId as number;
    
    // SECURITY PATCH: Enforce ban instantly even for active sessions across ALL APIs
    const user = db.prepare("SELECT is_banned, locked_until FROM users WHERE id = ?").get(userId) as { is_banned: number, locked_until: string | null } | undefined;
    
    if (!user) {
      logout();
      return null;
    }
    if (user.is_banned === 1) {
      logout();
      return null;
    }
    if (user.locked_until && new Date(user.locked_until + "Z") > new Date()) {
      logout();
      return null;
    }

    return {
      userId,
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
