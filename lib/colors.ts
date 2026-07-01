export const COUNTRY_COLORS: Record<string, string> = {
  "Argentina": "#60a5fa", // blue-400
  "Brazil": "#fde047",    // yellow-300
  "France": "#3b82f6",    // blue-500
  "England": "#f87171",   // red-400
  "Spain": "#ef4444",     // red-500
  "Germany": "#d1d5db",   // gray-300
  "Portugal": "#b91c1c",  // red-700
  "Italy": "#2563eb",     // blue-600
  "Netherlands": "#f97316", // orange-500
  "Belgium": "#dc2626",   // red-600
  "Croatia": "#ef4444",   // red-500
  "Uruguay": "#38bdf8",   // sky-400
  "Colombia": "#fde047",  // yellow-300
  "Senegal": "#22c55e",   // green-500
  "Morocco": "#dc2626",   // red-600
  "USA": "#1d4ed8",       // blue-700
  "Mexico": "#15803d",    // green-700
  "Japan": "#3b82f6",     // blue-500
  "South Korea": "#dc2626", // red-600
  "Saudi Arabia": "#16a34a", // green-600
  "Bahrain": "#e11d48",   // rose-600
  "Qatar": "#9f1239",     // rose-800
  "UAE": "#22c55e",       // green-500
  "Kuwait": "#3b82f6",    // blue-500
  "Oman": "#ef4444",      // red-500
};

export function getCountryColor(countryName: string): string {
  if (COUNTRY_COLORS[countryName]) return COUNTRY_COLORS[countryName];
  const match = Object.keys(COUNTRY_COLORS).find(k => k.toLowerCase() === countryName.toLowerCase());
  if (match) return COUNTRY_COLORS[match];
  return "#ffffff"; // fallback
}
