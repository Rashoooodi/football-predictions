import countries from "../data/countries.json";

export type Country = { name: string; flag: string };

export function getAllCountries(): Country[] {
  return countries;
}

export function getCountryByName(name: string): Country | undefined {
  const needle = name.trim().toLowerCase();
  return countries.find((c) => c.name.toLowerCase() === needle);
}

export function searchCountries(query: string): Country[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return countries;
  return countries.filter((c) => c.name.toLowerCase().includes(needle));
}
