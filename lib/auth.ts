import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import db from "./db";
import { isStillLocked } from "./timezone";
import { SESSION_MAX_AGE_SECONDS } from "./constants";

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is missing.");
  }
  return new TextEncoder().encode(secret);
}

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
    .sign(jwtSecret());

  cookies().set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    const userId = payload.userId;
    if (typeof userId !== "number" || !Number.isInteger(userId) || userId <= 0) {
      logout();
      return null;
    }

    const user = db
      .prepare("SELECT is_admin, is_banned, locked_until FROM users WHERE id = ?")
      .get(userId) as
      | { is_admin: number; is_banned: number; locked_until: string | null }
      | undefined;

    if (!user) {
      logout();
      return null;
    }
    if (user.is_banned === 1) {
      logout();
      return null;
    }
    if (isStillLocked(user.locked_until)) {
      logout();
      return null;
    }

    return {
      userId,
      isAdmin: user.is_admin === 1,
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
