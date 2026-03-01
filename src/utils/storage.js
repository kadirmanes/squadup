/**
 * Storage utility — thin AsyncStorage wrapper.
 * All trip data is persisted under a single versioned key.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIP_KEY = 'nomadwise_trip_v1';

export async function saveTrip(payload) {
  try {
    await AsyncStorage.setItem(TRIP_KEY, JSON.stringify(payload));
  } catch (_) {}
}

export async function loadTrip() {
  try {
    const raw = await AsyncStorage.getItem(TRIP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export async function clearTrip() {
  try {
    await AsyncStorage.removeItem(TRIP_KEY);
  } catch (_) {}
}

// ─── Visited places ───────────────────────────────────────────────────────

const VISITED_KEY = 'visited_places';

export async function getVisitedPlaces() {
  try {
    const raw = await AsyncStorage.getItem(VISITED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

export async function addVisitedPlace(title) {
  try {
    const places = await getVisitedPlaces();
    if (!places.includes(title)) {
      await AsyncStorage.setItem(VISITED_KEY, JSON.stringify([...places, title]));
    }
  } catch (_) {}
}

// ─── Vehicle profile ───────────────────────────────────────────────────────

const VEHICLE_PROFILE_KEY = 'vehicle_profile';

export async function saveVehicleProfile(profile) {
  try {
    await AsyncStorage.setItem(VEHICLE_PROFILE_KEY, JSON.stringify(profile));
  } catch (_) {}
}

export async function getVehicleProfile() {
  try {
    const raw = await AsyncStorage.getItem(VEHICLE_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

// ─── Weather API key ───────────────────────────────────────────────────────

const WEATHER_KEY = 'weather_api_key';

export async function saveWeatherApiKey(key) {
  try { await AsyncStorage.setItem(WEATHER_KEY, key.trim()); } catch (_) {}
}

export async function getWeatherApiKey() {
  try { return await AsyncStorage.getItem(WEATHER_KEY); } catch (_) { return null; }
}

// ─── OSM POI cache (24h TTL per coordinate key) ───────────────────────────

const OSM_CACHE_KEY = 'osm_poi_cache';
const OSM_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function saveOsmCache(cacheObj) {
  try {
    await AsyncStorage.setItem(OSM_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: cacheObj }));
  } catch (_) {}
}

export async function loadOsmCache() {
  try {
    const raw = await AsyncStorage.getItem(OSM_CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > OSM_CACHE_TTL) return null;
    return data;
  } catch (_) { return null; }
}
