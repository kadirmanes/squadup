/**
 * osmService — OpenStreetMap Overpass API entegrasyonu.
 *
 * Sorgulanan POI tipleri:
 *  drinking_water  → İçme suyu noktaları
 *  motorhome_dump  → Karavan boşaltım istasyonları
 *  toilets         → Tuvalet
 *  shower          → Duş
 *  campsite        → Kamp alanı
 *  lpg_station     → LPG istasyonu
 *
 * Kullanım:
 *  queryPOIsForRoute(days, radiusM) → { coordKey: POI[] }
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// ─── POI type definitions ──────────────────────────────────────────────────

export const POI_DEFS = [
  { key: 'drinking_water',  icon: '💧', label: 'İçme Suyu',         color: '#1565C0', filter: (t) => t.amenity === 'drinking_water' },
  { key: 'motorhome_dump',  icon: '🚐', label: 'Karavan Boşaltım',  color: '#2E7D32', filter: (t) => t.service === 'motorhome_dump' },
  { key: 'toilets',         icon: '🚻', label: 'Tuvalet',           color: '#5C6560', filter: (t) => t.amenity === 'toilets' },
  { key: 'shower',          icon: '🚿', label: 'Duş',               color: '#00897B', filter: (t) => t.amenity === 'shower' },
  { key: 'campsite',        icon: '⛺', label: 'Kamp Alanı',        color: '#4A7C59', filter: (t) => t.amenity === 'campsite' },
  { key: 'lpg_station',     icon: '⛽', label: 'LPG İstasyonu',     color: '#E65100', filter: (t) => t.amenity === 'fuel' && t['fuel:lpg'] === 'yes' },
];

// ─── Build Overpass QL query ───────────────────────────────────────────────

function buildQuery(lat, lng, radiusM) {
  const around = `around:${radiusM},${lat},${lng}`;
  return `[out:json][timeout:30];
(
  node["amenity"="drinking_water"](${around});
  node["service"="motorhome_dump"](${around});
  node["amenity"="toilets"](${around});
  node["amenity"="shower"](${around});
  node["amenity"="campsite"](${around});
  node["amenity"="fuel"]["fuel:lpg"="yes"](${around});
);
out body;`;
}

// ─── Parse element → POI object ───────────────────────────────────────────

function parsePOI(el) {
  const tags = el.tags || {};
  const def = POI_DEFS.find((d) => d.filter(tags));
  if (!def) return null;
  return {
    id:    el.id,
    type:  def.key,
    icon:  def.icon,
    label: def.label,
    color: def.color,
    name:  tags.name || def.label,
    lat:   el.lat,
    lng:   el.lon,
  };
}

// ─── Query single coordinate ───────────────────────────────────────────────

export async function queryPOIs(lat, lng, radiusM = 20000) {
  const body = buildQuery(lat, lng, radiusM);
  const res = await fetch(OVERPASS_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'text/plain' },
    body,
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const json = await res.json();
  return (json.elements || []).map(parsePOI).filter(Boolean);
}

// ─── Query all route days (returns map keyed by "lat,lng") ────────────────

export async function queryPOIsForRoute(days, radiusM = 20000) {
  const results = {};
  for (const day of days) {
    const coord = day.coordinate;
    if (!coord) continue;
    const key = `${coord.latitude.toFixed(2)},${coord.longitude.toFixed(2)}`;
    if (results[key]) continue; // already queried
    try {
      results[key] = await queryPOIs(coord.latitude, coord.longitude, radiusM);
    } catch (e) {
      console.warn(`[osmService] queryPOIs failed for day ${day.day}:`, e.message);
      results[key] = [];
    }
  }
  return results;
}
