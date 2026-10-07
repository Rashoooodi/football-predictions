import { NextResponse } from "next/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function methodNotAllowed(allow: string[]) {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: allow.join(", ") } }
  );
}

export function jsonOk<T>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}
