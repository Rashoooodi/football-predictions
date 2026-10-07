import { describe, expect, it } from "vitest";
import { resolveUploadPath } from "../lib/uploads";
import path from "path";

describe("resolveUploadPath", () => {
  it("rejects parent traversal", () => {
    expect(resolveUploadPath(["..", "football.db"])).toBeNull();
    expect(resolveUploadPath(["foo", "..", "..", "etc", "passwd"])).toBeNull();
  });

  it("allows a file inside uploads", () => {
    const resolved = resolveUploadPath(["avatar.jpg"]);
    expect(resolved).toBeTruthy();
    expect(resolved!.startsWith(path.resolve(process.cwd(), "public", "uploads"))).toBe(
      true
    );
  });
});
