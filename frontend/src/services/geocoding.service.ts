export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

const configuredEndpoint = import.meta.env.VITE_GEOCODING_URL || 'https://nominatim.openstreetmap.org';
const resultCache = new Map<string, GeocodingResult[]>();
let lastRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();
const sharedTimestampKey = 'parkzee_geocoding_last_request_at';

async function requestJson(url: URL): Promise<any> {
  const perform = async () => {
    let sharedLastRequestAt = lastRequestAt;
    try { sharedLastRequestAt = Math.max(sharedLastRequestAt, Number(localStorage.getItem(sharedTimestampKey) || 0)); } catch { /* Storage may be unavailable in restricted browser contexts. */ }
    const waitMs = Math.max(0, 1100 - (Date.now() - sharedLastRequestAt));
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastRequestAt = Date.now();
    try { localStorage.setItem(sharedTimestampKey, String(lastRequestAt)); } catch { /* Keep in-tab limiting when storage is unavailable. */ }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    let response: Response;
    try { response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal }); }
    finally { window.clearTimeout(timeout); }
    if (!response.ok) throw new Error('Address lookup is temporarily unavailable. You can still pin the map manually.');
    return response.json();
  };
  if (navigator.locks) return navigator.locks.request('parkzee-geocoding-rate-limit', perform);
  const task = requestQueue.then(perform);
  requestQueue = task.then(() => undefined, () => undefined);
  return task;
}

export const geocodingService = {
  async search(query: string): Promise<GeocodingResult[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const cacheKey = `search:${normalized}`;
    if (resultCache.has(cacheKey)) return resultCache.get(cacheKey)!;
    const url = new URL('/search', configuredEndpoint);
    url.search = new URLSearchParams({ q: query.trim(), format: 'jsonv2', limit: '5', addressdetails: '1' }).toString();
    const rows = await requestJson(url);
    const results = rows.map((row: any) => ({ latitude: Number(row.lat), longitude: Number(row.lon), displayName: row.display_name }))
      .filter((row: GeocodingResult) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));
    resultCache.set(cacheKey, results);
    return results;
  },

  async reverse(latitude: number, longitude: number): Promise<string | null> {
    const key = `reverse:${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
    if (resultCache.has(key)) return resultCache.get(key)![0]?.displayName ?? null;
    const url = new URL('/reverse', configuredEndpoint);
    url.search = new URLSearchParams({ lat: String(latitude), lon: String(longitude), format: 'jsonv2' }).toString();
    const row = await requestJson(url);
    const results = row?.display_name ? [{ latitude, longitude, displayName: row.display_name }] : [];
    resultCache.set(key, results);
    return results[0]?.displayName ?? null;
  },
};
