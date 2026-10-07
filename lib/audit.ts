import db from "./db";

export function writeAuditLog(params: {
  userId?: number | null;
  action: string;
  ip?: string | null;
  details?: string | null;
}): void {
  try {
    db.prepare(
      "INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)"
    ).run(
      params.userId ?? null,
      params.action,
      params.ip ?? null,
      params.details ?? null
    );
  } catch {
    // Audit must never break the main request path.
  }
}
