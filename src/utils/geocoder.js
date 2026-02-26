/**
 * Mock geocoder — returns approximate coordinates for destinations.
 * In production this would call a real geocoding API.
 */

const COORDS_DB = [
  { keys: ['kapadok', 'cappadoc', 'göreme', 'goreme', 'nevşehir', 'nevsehir'], lat: 38.6431, lng: 34.8289, emoji: '🏜️' },
  { keys: ['bodrum'], lat: 37.0344, lng: 27.4305, emoji: '🏖️' },
  { keys: ['antalya'], lat: 36.8969, lng: 30.7133, emoji: '🌊' },
  { keys: ['istanbul', 'İstanbul', 'i̇stanbul'], lat: 41.0082, lng: 28.9784, emoji: '🕌' },
  { keys: ['pamukkale'], lat: 37.9255, lng: 29.1245, emoji: '🌊' },
  { keys: ['efes', 'ephesus', 'selçuk', 'selcuk'], lat: 37.9396, lng: 27.3414, emoji: '🏛️' },
  { keys: ['trabzon'], lat: 41.0027, lng: 39.7168, emoji: '🌿' },
  { keys: ['marmaris'], lat: 36.8556, lng: 28.2844, emoji: '⛵' },
  { keys: ['fethiye'], lat: 36.6562, lng: 29.1228, emoji: '🏝️' },
  { keys: ['göcek', 'gocek'], lat: 36.7523, lng: 28.9272, emoji: '⛵' },
  { keys: ['konya'], lat: 37.8713, lng: 32.4846, emoji: '🕌' },
  { keys: ['izmir', 'İzmir', 'i̇zmir'], lat: 38.4192, lng: 27.1287, emoji: '🏙️' },
  { keys: ['bursa'], lat: 40.1885, lng: 29.0610, emoji: '⛷️' },
  { keys: ['ankara'], lat: 39.9334, lng: 32.8597, emoji: '🏛️' },
  { keys: ['erzurum'], lat: 39.9043, lng: 41.2679, emoji: '🏔️' },
  { keys: ['rize', 'artvin'], lat: 41.0201, lng: 40.5234, emoji: '🌿' },
  { keys: ['van'], lat: 38.4891, lng: 43.4089, emoji: '🏔️' },
  { keys: ['mardin'], lat: 37.3212, lng: 40.7245, emoji: '🕌' },
  { keys: ['gaziantep', 'antep'], lat: 37.0662, lng: 37.3833, emoji: '🍽️' },
  { keys: ['safranbolu'], lat: 41.2497, lng: 32.6914, emoji: '🏡' },
  { keys: ['amasra', 'bartın', 'bartin'], lat: 41.7451, lng: 32.3883, emoji: '🌊' },
  { keys: ['alanya'], lat: 36.5436, lng: 31.9993, emoji: '🏰' },
  { keys: ['side'], lat: 36.7686, lng: 31.3889, emoji: '🏛️' },
  { keys: ['olympos', 'olimpos'], lat: 36.3987, lng: 30.4694, emoji: '🌊' },
  { keys: ['patagonia', 'patagonya'], lat: -41.8101, lng: -68.9063, emoji: '🦙' },
  { keys: ['paris'], lat: 48.8566, lng: 2.3522, emoji: '🗼' },
  { keys: ['rom', 'rome', 'roma'], lat: 41.9028, lng: 12.4964, emoji: '🏛️' },
  { keys: ['barselona', 'barcelona'], lat: 41.3851, lng: 2.1734, emoji: '⛵' },
  { keys: ['prag', 'prague', 'praha'], lat: 50.0755, lng: 14.4378, emoji: '🏰' },
];

/** Default — center of Turkey */
const DEFAULT = { lat: 39.0, lng: 35.0, emoji: '📍' };

export function getDestinationCoords(destination) {
  const lower = (destination || '').toLowerCase().trim();
  for (const entry of COORDS_DB) {
    if (entry.keys.some((k) => lower.includes(k.toLowerCase()))) {
      return { lat: entry.lat, lng: entry.lng, emoji: entry.emoji };
    }
  }
  return DEFAULT;
}

/**
 * Generates day waypoints in a scenic arc around the destination center.
 * Each day's point is offset slightly so the route looks like a real trip.
 */
export function generateWaypoints(destination, days) {
  const center = getDestinationCoords(destination);
  const radius = 0.06; // ~7km radius

  return Array.from({ length: days }, (_, i) => {
    const angle = (i / Math.max(days - 1, 1)) * Math.PI * 1.5 - Math.PI * 0.25;
    return {
      day: i + 1,
      coordinate: {
        latitude: center.lat + Math.sin(angle) * radius * (0.6 + (i % 3) * 0.2),
        longitude: center.lng + Math.cos(angle) * radius,
      },
    };
  });
}
