import { describe, expect, it } from "vitest";
import { escapeHtml } from "../lib/html";

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml(`<a href="x">R&J</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;R&amp;J&lt;/a&gt;"
    );
  });
});
