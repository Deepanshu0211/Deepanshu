import type { Weather } from "./objects";

// Live conditions for the visitor: their local clock decides day, golden hour and night; Open-Meteo
// (free, no key) supplies rain. Location defaults to the main city of the visitor's time zone, so
// nothing is asked for and only coarse coordinates leave the browser; precise location is opt-in.
const zones: Record<string, [number, number, string]> = {
  "Asia/Kolkata": [28.61, 77.21, "New Delhi"], "Asia/Calcutta": [28.61, 77.21, "New Delhi"], "Asia/Karachi": [24.86, 67.01, "Karachi"], "Asia/Dhaka": [23.81, 90.41, "Dhaka"],
  "Asia/Kathmandu": [27.72, 85.32, "Kathmandu"], "Asia/Colombo": [6.93, 79.86, "Colombo"], "Asia/Dubai": [25.2, 55.27, "Dubai"], "Asia/Riyadh": [24.71, 46.68, "Riyadh"],
  "Asia/Tehran": [35.69, 51.39, "Tehran"], "Asia/Kabul": [34.56, 69.21, "Kabul"], "Asia/Tashkent": [41.3, 69.24, "Tashkent"], "Asia/Almaty": [43.24, 76.89, "Almaty"],
  "Asia/Bangkok": [13.76, 100.5, "Bangkok"], "Asia/Jakarta": [-6.2, 106.85, "Jakarta"], "Asia/Singapore": [1.35, 103.82, "Singapore"], "Asia/Kuala_Lumpur": [3.14, 101.69, "Kuala Lumpur"],
  "Asia/Manila": [14.6, 120.98, "Manila"], "Asia/Ho_Chi_Minh": [10.82, 106.63, "Ho Chi Minh City"], "Asia/Shanghai": [31.23, 121.47, "Shanghai"], "Asia/Hong_Kong": [22.32, 114.17, "Hong Kong"],
  "Asia/Taipei": [25.03, 121.57, "Taipei"], "Asia/Seoul": [37.57, 126.98, "Seoul"], "Asia/Tokyo": [35.68, 139.69, "Tokyo"], "Asia/Jerusalem": [31.77, 35.21, "Jerusalem"],
  "Europe/London": [51.51, -.13, "London"], "Europe/Dublin": [53.35, -6.26, "Dublin"], "Europe/Lisbon": [38.72, -9.14, "Lisbon"], "Europe/Madrid": [40.42, -3.7, "Madrid"],
  "Europe/Paris": [48.86, 2.35, "Paris"], "Europe/Brussels": [50.85, 4.35, "Brussels"], "Europe/Amsterdam": [52.37, 4.9, "Amsterdam"], "Europe/Berlin": [52.52, 13.4, "Berlin"],
  "Europe/Zurich": [47.38, 8.54, "Zürich"], "Europe/Rome": [41.9, 12.5, "Rome"], "Europe/Vienna": [48.21, 16.37, "Vienna"], "Europe/Prague": [50.08, 14.44, "Prague"],
  "Europe/Warsaw": [52.23, 21.01, "Warsaw"], "Europe/Stockholm": [59.33, 18.07, "Stockholm"], "Europe/Oslo": [59.91, 10.75, "Oslo"], "Europe/Copenhagen": [55.68, 12.57, "Copenhagen"],
  "Europe/Helsinki": [60.17, 24.94, "Helsinki"], "Europe/Athens": [37.98, 23.73, "Athens"], "Europe/Istanbul": [41.01, 28.98, "Istanbul"], "Europe/Kyiv": [50.45, 30.52, "Kyiv"],
  "Europe/Moscow": [55.76, 37.62, "Moscow"], "Africa/Cairo": [30.04, 31.24, "Cairo"], "Africa/Lagos": [6.52, 3.38, "Lagos"], "Africa/Nairobi": [-1.29, 36.82, "Nairobi"],
  "Africa/Johannesburg": [-26.2, 28.05, "Johannesburg"], "Africa/Casablanca": [33.57, -7.59, "Casablanca"], "America/New_York": [40.71, -74.01, "New York"], "America/Toronto": [43.65, -79.38, "Toronto"],
  "America/Chicago": [41.88, -87.63, "Chicago"], "America/Denver": [39.74, -104.99, "Denver"], "America/Phoenix": [33.45, -112.07, "Phoenix"], "America/Los_Angeles": [34.05, -118.24, "Los Angeles"],
  "America/Vancouver": [49.28, -123.12, "Vancouver"], "America/Anchorage": [61.22, -149.9, "Anchorage"], "America/Mexico_City": [19.43, -99.13, "Mexico City"], "America/Bogota": [4.71, -74.07, "Bogotá"],
  "America/Lima": [-12.05, -77.04, "Lima"], "America/Santiago": [-33.45, -70.67, "Santiago"], "America/Sao_Paulo": [-23.55, -46.63, "São Paulo"], "America/Argentina/Buenos_Aires": [-34.6, -58.38, "Buenos Aires"],
  "Pacific/Honolulu": [21.31, -157.86, "Honolulu"], "Australia/Sydney": [-33.87, 151.21, "Sydney"], "Australia/Melbourne": [-37.81, 144.96, "Melbourne"], "Australia/Brisbane": [-27.47, 153.03, "Brisbane"],
  "Australia/Perth": [-31.95, 115.86, "Perth"], "Pacific/Auckland": [-36.85, 174.76, "Auckland"],
};

export interface Live { weather: Weather; summary: string; place: string; temperature: number | null; precise: boolean; at: number }

/** Approximate coordinates for this browser's time zone (falls back to its UTC offset). */
export function zoneLocation(): { lat: number; lon: number; place: string } {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone; const known = zones[zone];
  if (known) return { lat: known[0], lon: known[1], place: known[2] };
  const lon = -new Date().getTimezoneOffset() / 60 * 15; return { lat: 20, lon, place: zone.split("/").pop()?.replace(/_/g, " ") ?? "your area" };
}
function describe(code: number) {
  if (code >= 95) return "Thunderstorm"; if (code >= 85) return "Snow showers"; if (code >= 80) return "Rain showers"; if (code >= 71) return "Snow";
  if (code >= 61) return "Rain"; if (code >= 51) return "Drizzle"; if (code >= 45) return "Fog"; if (code >= 2) return code === 3 ? "Overcast" : "Partly cloudy"; return "Clear";
}
/** Day, golden hour or night from the local clock and (when known) today's sunrise and sunset. */
export function timeOfDay(now = new Date(), sunrise?: number, sunset?: number): Weather {
  const t = now.getTime() / 1000;
  if (sunrise && sunset) { if (t < sunrise - 1800 || t > sunset + 2400) return "night"; if (Math.abs(t - sunset) < 3600 || Math.abs(t - sunrise) < 2400) return "sunset"; return "day"; }
  const h = now.getHours() + now.getMinutes() / 60; return h < 5.5 || h >= 19.5 ? "night" : h < 7 || h >= 17.5 ? "sunset" : "day";
}
/** Current conditions; resolves to a time-of-day-only result if the weather service is unreachable. */
export async function liveConditions(precise?: { lat: number; lon: number }): Promise<Live> {
  const where = precise ? { ...precise, place: "your location" } : zoneLocation();
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${where.lat.toFixed(2)}&longitude=${where.lon.toFixed(2)}&current=weather_code,temperature_2m&daily=sunrise,sunset&timeformat=unixtime&forecast_days=1&timezone=auto`;
    const res = await fetch(url, { cache: "no-store" }); if (!res.ok) throw new Error(String(res.status));
    const data = await res.json(), code = Number(data.current?.weather_code ?? 0), wet = (code >= 51 && code <= 67) || (code >= 80 && code <= 99) || (code >= 71 && code <= 77);
    const clock = timeOfDay(new Date(), data.daily?.sunrise?.[0], data.daily?.sunset?.[0]);
    return { weather: wet ? "rain" : clock, summary: describe(code), place: where.place, temperature: Math.round(data.current?.temperature_2m), precise: Boolean(precise), at: Date.now() };
  } catch {
    return { weather: timeOfDay(), summary: "Local time", place: where.place, temperature: null, precise: Boolean(precise), at: Date.now() };
  }
}
