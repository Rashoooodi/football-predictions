import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);

const PUBLIC_ROUTES = ["/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // MAINTENANCE MODE CHECK
  if (process.env.MAINTENANCE_MODE === "true") {
    // Allow admins to still access the admin panel if they bypass or already have a session, 
    // but redirect normal public traffic to maintenance.
    if (pathname !== "/maintenance" && !pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  // Prevent redirect loop if already on maintenance
  if (pathname === "/maintenance" && process.env.MAINTENANCE_MODE !== "true") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);

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
