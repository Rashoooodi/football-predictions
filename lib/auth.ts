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

export function authenticatePhone(phone: string): number | null {
  const user = db
    .prepare("SELECT id FROM users WHERE phone = ?")
    .get(phone) as { id: number } | undefined;
  return user?.id ?? null;
}
