/**
 * weatherService — OpenWeatherMap free tier entegrasyonu.
 *
 * Kullanım:
 *  - fetchWeatherForCities(cities, apiKey) → { CityName: WeatherData }
 *  - buildWeatherPromptContext(weatherMap) → prompt'a eklenecek metin
 *  - getWeatherIcon(iconCode) → emoji
 *  - getWeatherWarnings(weatherMap) → string[]
 */

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

// ─── Single city fetch ─────────────────────────────────────────────────────

export async function fetchCityWeather(city, apiKey) {
  if (!apiKey) return null;
  try {
    const url = `${OWM_BASE}/weather?q=${encodeURIComponent(city)},TR&appid=${apiKey}&units=metric&lang=tr`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = await res.json();
    return {
      city,
      temp:        Math.round(d.main.temp),
      feelsLike:   Math.round(d.main.feels_like),
      description: d.weather[0]?.description || '',
      icon:        d.weather[0]?.icon || '01d',
      windSpeed:   Math.round((d.wind?.speed || 0) * 3.6), // m/s → km/h
      humidity:    d.main.humidity,
      rain1h:      d.rain?.['1h'] || 0,
      nightTemp:   Math.round(d.main.temp_min),
    };
  } catch (_) { return null; }
}

// ─── Batch fetch for multiple cities ──────────────────────────────────────

export async function fetchWeatherForCities(cities, apiKey) {
  if (!apiKey || !cities?.length) return {};
  const results = {};
  await Promise.allSettled(
    cities.map(async (city) => {
      const w = await fetchCityWeather(city, apiKey);
      if (w) results[city] = w;
    })
  );
  return results;
}

// ─── Build prompt context string ───────────────────────────────────────────

export function buildWeatherPromptContext(weatherMap) {
  if (!weatherMap || !Object.keys(weatherMap).length) return '';

  const lines = Object.entries(weatherMap).map(([city, w]) => {
    const flags = [];
    if (w.rain1h > 10)   flags.push('⚠️ YOĞUN YAĞIŞ');
    if (w.windSpeed > 30) flags.push('⚠️ KUVVETLİ RÜZGAR');
    if (w.temp < 5)       flags.push('⚠️ SOĞUK HAVA');
    if (w.temp > 35)      flags.push('⚠️ AŞIRI SICAK');
    const warn = flags.length ? ` ${flags.join(' ')}` : '';
    return `  ${city}: ${w.description}, ${w.temp}°C, Rüzgar ${w.windSpeed}km/s, Gece min ${w.nightTemp}°C${warn}`;
  });

  return `\nGÜNCEL HAVA DURUMU (rotaya göre aktivite planını ayarla):\n${lines.join('\n')}`;
}

// ─── Weather icon (OpenWeatherMap icon code → emoji) ──────────────────────

const ICON_MAP = {
  '01d': '☀️',  '01n': '🌙',
  '02d': '⛅',  '02n': '⛅',
  '03d': '☁️',  '03n': '☁️',
  '04d': '☁️',  '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌦️',
  '11d': '⛈️',  '11n': '⛈️',
  '13d': '❄️',  '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};

export function getWeatherIcon(iconCode) {
  return ICON_MAP[iconCode] || '🌤️';
}

// ─── Critical warnings list ────────────────────────────────────────────────

export function getWeatherWarnings(weatherMap) {
  const warnings = [];
  for (const [city, w] of Object.entries(weatherMap || {})) {
    if (w.rain1h > 10)    warnings.push(`${city}: Yoğun yağış (${w.rain1h.toFixed(1)}mm/sa)`);
    if (w.windSpeed > 30) warnings.push(`${city}: Güçlü rüzgar (${w.windSpeed}km/s) — alkoven sürüşü riskli`);
    if (w.temp < 5)       warnings.push(`${city}: Soğuk (${w.temp}°C) — uyku tulumu gerekli`);
    if (w.temp > 35)      warnings.push(`${city}: Sıcak (${w.temp}°C) — serin saatlerde aktif ol`);
  }
  return warnings;
}
