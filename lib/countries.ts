import countries from "../data/countries.json";

export type Country = { name: string; flag: string };

export function getAllCountries(): Country[] {
  return countries;
}

export function getCountryByName(name: string): Country | undefined {
  return countries.find((c) => c.name === name);
}
