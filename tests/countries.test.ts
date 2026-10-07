import { describe, expect, it } from "vitest";
import { getCountryByName, searchCountries } from "../lib/countries";

describe("getCountryByName", () => {
  it("matches case-insensitively", () => {
    const country = getCountryByName("qatar");
    expect(country).toBeTruthy();
    expect(country!.name).toBe("Qatar");
  });
});

describe("searchCountries", () => {
  it("returns all countries for empty query", () => {
    expect(searchCountries("").length).toBeGreaterThan(10);
  });

  it("filters by substring", () => {
    const hits = searchCountries("arg");
    expect(hits.some((c) => c.name.toLowerCase().includes("arg"))).toBe(true);
  });
});
