import path from "path";

export function resolveUploadPath(segments: string[]): string | null {
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const joined = path.resolve(uploadsRoot, ...segments);
  const prefix = uploadsRoot.endsWith(path.sep) ? uploadsRoot : uploadsRoot + path.sep;
  if (joined !== uploadsRoot && !joined.startsWith(prefix)) return null;
  return joined;
}
