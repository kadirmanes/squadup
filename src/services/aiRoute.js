/**
 * NomadWise AI — Anthropic API Route Generator
 *
 * Features:
 *  - 2-phase route generation (city list → full route)
 *  - Meal recommendations (optional, based on includeMeals pref)
 *  - 3 accommodation options per day
 *  - Free time & shopping block at 16:00
 *  - Visited places memory (excluded from prompts)
 *  - Single activity replacement
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVisitedPlaces } from '../utils/storage';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-haiku-4-5-20251001';
export const API_KEY_STORAGE = 'anthropic_api_key';

// ─── API Key helpers ──────────────────────────────────────────────────────

export async function getApiKey() {
  try {
    return await AsyncStorage.getItem(API_KEY_STORAGE);
  } catch {
    return null;
  }
}

export async function saveApiKey(key) {
  await AsyncStorage.setItem(API_KEY_STORAGE, key.trim());
}

// ─── Labels ───────────────────────────────────────────────────────────────

const BUDGET_LABELS = {
  ekonomik: 'ekonomik (düşük bütçe, ücretsiz alanlar tercih edilmeli)',
  standart: 'standart (orta segment, konfor & tasarruf dengesi)',
  lux:      'lüks (premium mekanlar, fine dining, glamping)',
};

const ACCOM_LABELS = {
  caravan: 'karavan (karavan parkı, kamp alanı, elektrik & su bağlantılı)',
  camping: 'çadır kampı (doğada, ücretsiz ya da ücretli kamp alanları)',
  hotel:   'otel / pansiyon (butik otel, konakevi veya pansiyon)',
};

// ─── Prompt builder ───────────────────────────────────────────────────────

function buildPrompt(prefs) {
  const {
    startLocation, destination, startDate, endDate, days,
    accommodationType, budget, interests, includeMeals,
    selectedCities, visitedPlaces, previousCity,
  } = prefs;

  const accomLabel  = ACCOM_LABELS[accommodationType] || accommodationType;
  const budgetLabel = BUDGET_LABELS[budget] || budget;
  const interestStr = (interests || []).length > 0 ? interests.join(', ') : 'genel keşif';
  const isCaravan   = accommodationType === 'caravan';
  const vehicleDesc = isCaravan ? 'karavan (ort. 70 km/h)' : 'araç (ort. 90 km/h)';

  const routeInstruction = selectedCities?.length
    ? `${selectedCities.join(' → ')} güzergahında ${days} günlük bir ${accomLabel} seyahati planla.`
    : `${startLocation}'dan ${destination}'a ${days} günlük bir ${accomLabel} seyahati planla.`;

  const visitedNote = visitedPlaces?.length
    ? `\nDaha önce görülen (tekrar önerme): ${visitedPlaces.join(', ')}`
    : '';

  // For batch continuation: previous city to compute travel for day 1 of this batch
  const prevCityNote = previousCity
    ? `\nBu planın ilk günü ${previousCity}'dan geliyor, yolculuk aktivitesi ekle.`
    : '';

  const mealRules = includeMeals
    ? `YEMEK:
- Sabah kahvaltısı (kalkıştan önce veya yolda mola olarak): tag "Yemek", kısa not yeter.
- Öğle (varışa göre uygun saatte): gerçek restoran adı, yöresel öneri, cost kişi başı. Tag "Yemek".
- Akşam (19:30 civarı): gerçek restoran adı, cost kişi başı. Tag "Yemek".`
    : `YEMEK:
- Öğle ve akşam için tag "Yemek" ekle, genel öneri yeterli.`;

  return `Sen Türkiye ve Avrupa seyahatlerini çok iyi bilen bir rehbersin.

${routeInstruction}
Tarihler: ${startDate} → ${endDate}
Araç: ${vehicleDesc}
Bütçe: ${budgetLabel}
İlgi: ${interestStr}${visitedNote}${prevCityNote}

YOLCULUK KURALLARI (ÇOK ÖNEMLİ):
- 1. gün: yolculuk aktivitesi YOK, doğrudan gezi yap (başlangıç şehri).
- 2. gün ve sonrası: İlk aktivite mutlaka 07:30'da şehirlerarası yolculuk olsun.
  - title: "[Önceki Şehir]'den [Mevcut Şehir]'e Yolculuk"
  - tag: "Yolculuk"
  - cost: "Yakıt ~₺xxx" (tahmini mesafeye göre)
  - description: "~X saatlik yolculuk. [Önemli mola noktası] önerilir."
  - Varış saatini hesapla: 07:30 + yolculuk süresi.
  - Sonraki tüm aktiviteler varış saatinden itibaren başlasın.
- Kısa yollar (1-2 saat): aktiviteler 09:30-10:00'da başlayabilir.
- Uzun yollar (4-6 saat): aktiviteler 13:00-14:00'da başlasın.

DİĞER KURALLAR:
1. Her aktivite başlığında GERÇEK mekan adı kullan.
2. description: 1 kısa cümle (max 12 kelime).
3. Her gün 16:00'da "Serbest Zaman & Alışveriş": gerçek çarşı/pazar/AVM adı, tag "Serbest".
4. Her gün 3 konaklama seçeneği: kamp, otel, kiralık.
5. Günde aktivite sayısı: yola çıkılan günlerde 5, gezi günlerinde 6.
6. Tag: Kültür, Doğa, Yemek, Akşam, Aktivite, Sabah, Huzur, Keşif, Macera, Gastronomi, Premium, Serbest, Yolculuk.
${mealRules}

SADECE JSON yanıt ver:

{"route":[{"day":1,"location":"Şehir","lat":39.9,"lng":32.8,"activities":[{"time":"09:00","title":"Mekan Adı","tag":"Kültür","cost":"Ücretsiz","description":"1 cümle.","address":"Semt"}],"accommodationOptions":[{"type":"kamp","name":"Kamp adı","address":"Semt","cost":"₺xx/gece","note":"Not"},{"type":"otel","name":"Otel adı","address":"Semt","cost":"₺xx/gece","note":"Not"},{"type":"kiralık","name":"Daire","address":"Semt","cost":"₺xx/gece","note":"Not"}]}]}`;
}

// ─── JSON extractor ───────────────────────────────────────────────────────

function extractJSON(text) {
  // Try direct parse first
  try { return JSON.parse(text.trim()); } catch (_) {}

  // Find first { … last } block
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s === -1 || e === -1 || s >= e) throw new Error('JSON bulunamadı');
  try {
    return JSON.parse(text.slice(s, e + 1));
  } catch (parseErr) {
    throw new Error(`JSON parse hatası: ${parseErr.message.slice(0, 120)}`);
  }
}

// ─── Phase 1: generate city list (fast) ──────────────────────────────────

export async function generateCityList(preferences, apiKey, onProgress) {
  if (!apiKey) throw new Error('API_KEY_MISSING');

  onProgress?.('Güzergah şehirleri belirleniyor...');

  const { startLocation, destination, days } = preferences;
  const prompt = `${startLocation}'dan ${destination}'a ${days} günlük güzergahta her gün kalınacak şehirleri listele. Coğrafi açıdan mantıklı sırayla, ${days} şehir olsun.
SADECE şu JSON formatında yanıt ver:
{"cities": ["Şehir1", "Şehir2", "Şehir3"]}`;

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 512,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('API_KEY_INVALID');
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text || '';
  console.log('[generateCityList] raw:', text.slice(0, 200));
  try {
    const parsed = extractJSON(text);
    return Array.isArray(parsed?.cities) ? parsed.cities : [];
  } catch (parseErr) {
    console.error('[generateCityList] JSON parse failed:', parseErr.message);
    return [];
  }
}

// ─── Phase 2: full route generation (with auto-batching for long trips) ──

const BATCH_SIZE = 5; // max days per API call

export async function generateAIRoute(preferences, apiKey, onProgress) {
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const visitedPlaces = await getVisitedPlaces();
  const prefs = { ...preferences, visitedPlaces };

  const cities = prefs.selectedCities;

  // Auto-batch: if more than BATCH_SIZE cities, split into multiple calls
  if (cities && cities.length > BATCH_SIZE) {
    return _generateBatched(prefs, apiKey, onProgress);
  }

  return _generateSingle(prefs, apiKey, onProgress, 0);
}

async function _callAPI(prefs, apiKey) {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 8192,
      messages:   [{ role: 'user', content: buildPrompt(prefs) }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('API_KEY_INVALID');
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const stopReason = data?.stop_reason;
  const text = data?.content?.[0]?.text || '';

  console.log('[_callAPI] stop_reason:', stopReason, '| chars:', text.length);

  if (stopReason === 'max_tokens') {
    throw new Error('AI yanıtı token limitini aştı. Seçili şehir sayısını azalt.');
  }

  let parsed;
  try {
    parsed = extractJSON(text);
  } catch (parseErr) {
    console.error('[_callAPI] extractJSON failed:', parseErr.message, '| tail:', text.slice(-80));
    throw parseErr;
  }

  if (!parsed?.route?.length) {
    console.error('[_callAPI] no route:', JSON.stringify(parsed)?.slice(0, 200));
    throw new Error('Geçersiz AI yanıtı — route alanı bulunamadı');
  }

  return parsed.route;
}

async function _generateSingle(prefs, apiKey, onProgress, dayOffset) {
  onProgress?.('Rota oluşturuluyor...');
  const route = await _callAPI(prefs, apiKey);

  // Adjust day numbers if this is a batch continuation
  if (dayOffset > 0) {
    route.forEach((d) => { d.day = d.day + dayOffset; });
  }

  return normalizeAIResponse(route, prefs);
}

async function _generateBatched(prefs, apiKey, onProgress) {
  const cities = prefs.selectedCities;
  const batches = [];
  for (let i = 0; i < cities.length; i += BATCH_SIZE) {
    batches.push(cities.slice(i, i + BATCH_SIZE));
  }

  const allDays = [];
  let dayOffset = 0;

  for (let i = 0; i < batches.length; i++) {
    onProgress?.(`Rota oluşturuluyor (${i + 1}/${batches.length})...`);
    const batchPrefs = {
      ...prefs,
      selectedCities: batches[i],
      days: batches[i].length,
      // Tell AI the last city of the previous batch so it can plan travel on day 1
      previousCity: i > 0 ? batches[i - 1].at(-1) : null,
    };
    const route = await _callAPI(batchPrefs, apiKey);
    route.forEach((d) => { d.day = d.day + dayOffset; });
    allDays.push(...route);
    dayOffset += batches[i].length;
  }

  return normalizeAIResponse(allDays, prefs);
}

// ─── Single activity replacement ─────────────────────────────────────────

export async function replaceActivity(dayInfo, activity, reason, preferences, apiKey) {
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const { accommodationType, budget, interests } = preferences;
  const visitedPlaces = await getVisitedPlaces();

  const visitedNote = visitedPlaces.length > 0
    ? `\nDaha önce gittiği yerler (TEKRAR ÖNERMEYİN): ${visitedPlaces.join(', ')}`
    : '';

  const prompt = `Sen deneyimli bir seyahat rehberisin.

Şehir: ${dayInfo.location}
Saat: ${activity.time}
Değiştirilecek aktivite: ${activity.title} (tag: ${activity.tag})
Değiştirme sebebi: ${reason}
Konaklama tipi: ${ACCOM_LABELS[accommodationType] || accommodationType}
Bütçe: ${BUDGET_LABELS[budget] || budget}
İlgi alanları: ${(interests || []).join(', ') || 'genel'}${visitedNote}

Bu aktivite yerine AYNI şehirde, AYNI saatte farklı ve daha uygun bir aktivite öner.
SADECE şu JSON formatında yanıt ver:
{
  "time": "${activity.time}",
  "title": "Yeni aktivite başlığı",
  "tag": "Kültür",
  "cost": "₺xxx",
  "description": "2-3 cümle açıklama.",
  "address": "Mekanın adresi (isteğe bağlı)"
}`;

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 512,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text || '';
  return extractJSON(text);
}

// ─── Normalize AI response → app format ──────────────────────────────────

const BUDGET_ESTIMATES = {
  caravan: { ekonomik: 400,  standart: 980,  lux: 5080 },
  camping: { ekonomik: 280,  standart: 750,  lux: 5900 },
  hotel:   { ekonomik: 800,  standart: 2020, lux: 9320 },
};

function normalizeAIResponse(route, preferences) {
  const { days: totalDays, accommodationType = 'caravan', budget = 'standart' } = preferences;
  const dailyCost = BUDGET_ESTIMATES[accommodationType]?.[budget] || 980;

  const dayPlans = route.map((day) => ({
    day:           day.day,
    location:      day.location,
    locationEmoji: '📍',
    date:          day.date || null,
    title:         day.location,
    subtitle:      day.date || day.location,
    activities: (day.activities || []).map((act) => ({
      time:        act.time,
      title:       act.title,
      tag:         act.tag || 'Keşif',
      cost:        act.cost || null,
      description: act.description || null,
      address:     act.address || null,
    })),
    accommodationOptions: day.accommodationOptions || null,
    // backward compat: first option as default
    accommodation: day.accommodationOptions?.[0] || day.accommodation || null,
    estimatedCost: dailyCost,
    coordinate:    { latitude: day.lat || 39.0, longitude: day.lng || 35.0 },
  }));

  const totalBudget = {
    fuel:          0,
    accommodation: 0,
    food:          0,
    total:         dailyCost * totalDays,
    tier:          budget,
    currency:      '₺',
  };

  return {
    days: dayPlans,
    totalBudget,
    meta: { ...preferences, aiGenerated: true, generatedAt: new Date().toISOString() },
  };
}
