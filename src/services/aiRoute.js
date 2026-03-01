/**
 * NomadWise AI — Anthropic API Route Generator
 *
 * Calls Claude to generate a real, location-specific travel plan.
 * Each day includes:
 *   - Actual city landmarks / nature areas / restaurants
 *   - Activity descriptions (2-3 sentences of real info)
 *   - Accommodation for that night (name, address, facilities, cost)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

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

// ─── Prompt builder ───────────────────────────────────────────────────────

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

function buildPrompt(prefs) {
  const {
    startLocation, destination, startDate, endDate, days,
    accommodationType, budget, interests,
  } = prefs;

  const accomLabel  = ACCOM_LABELS[accommodationType]  || accommodationType;
  const budgetLabel = BUDGET_LABELS[budget] || budget;
  const interestStr = (interests || []).length > 0
    ? interests.join(', ')
    : 'genel keşif';

  return `Sen Türkiye ve Avrupa'yı çok iyi bilen deneyimli bir seyahat rehberisin.

${startLocation}'dan ${destination}'a ${days} günlük bir ${accomLabel} seyahati planla.
Tarihler: ${startDate} → ${endDate}
Bütçe: ${budgetLabel}
İlgi alanları: ${interestStr}

KURALAR:
1. Her gün FARKLI bir şehirde geç — ${startLocation}'dan ${destination}'a mantıklı coğrafi güzergah izle.
2. Her aktivitenin başlığında o şehrin GERÇEK mekan adını kullan (örn. "Sümela Manastırı Turu", "Eymir Gölü Sabah Koşusu").
3. Her aktivitenin "description" alanına o yer hakkında 2-3 cümle gerçek bilgi yaz.
4. Her günün sonunda "accommodation" alanında o gece kalınacak yeri belirt:
   - Karavan: gerçek karavan parkı veya kamp alanı adı + adres
   - Çadır: kamp alanı veya doğal alan
   - Otel: butik otel veya pansiyon adı + semt
5. Konaklama maliyetleri bütçeye uygun olsun.
6. Aktivite "tag" değerleri şunlardan biri olsun: Kültür, Doğa, Yemek, Akşam, Aktivite, Sabah, Huzur, Keşif, Macera, Gastronomi, Premium.

SADECE aşağıdaki JSON formatında yanıt ver. Başka hiçbir şey yazma:

{
  "route": [
    {
      "day": 1,
      "location": "Şehir adı",
      "lat": 39.9334,
      "lng": 32.8597,
      "activities": [
        {
          "time": "09:00",
          "title": "Gerçek mekan adı içeren aktivite başlığı",
          "tag": "Kültür",
          "cost": "Ücretsiz",
          "description": "Bu yer hakkında 2-3 cümle gerçek bilgi."
        }
      ],
      "accommodation": {
        "name": "Konaklama yeri adı",
        "address": "Mahalle/Semt, Şehir",
        "cost": "₺xxx/gece",
        "facilities": "Elektrik, su, duş, tuvalet",
        "note": "Kısa pratik not"
      }
    }
  ]
}`;
}

// ─── JSON extractor ───────────────────────────────────────────────────────

function extractJSON(text) {
  // Find the first { ... } block
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('JSON bulunamadı');
  return JSON.parse(text.slice(start, end + 1));
}

// ─── Main generator ───────────────────────────────────────────────────────

/**
 * Calls Claude API and returns a structured route plan.
 * @param {Object} preferences
 * @param {string} apiKey
 * @param {function} [onProgress] — called with status string during generation
 * @returns {{ days: Array, totalBudget: Object, meta: Object }}
 */
export async function generateAIRoute(preferences, apiKey, onProgress) {
  if (!apiKey) throw new Error('API_KEY_MISSING');

  onProgress?.('Yapay zeka rotanı analiz ediyor...');

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key':          apiKey,
      'anthropic-version':  '2023-06-01',
      'content-type':       'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 8192,
      messages:   [{ role: 'user', content: buildPrompt(preferences) }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('API_KEY_INVALID');
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  onProgress?.('Şehirler ve mekanlar seçiliyor...');

  const data = await response.json();
  const text = data?.content?.[0]?.text || '';

  onProgress?.('Konaklama yerleri belirleniyor...');

  const parsed = extractJSON(text);
  if (!parsed?.route?.length) throw new Error('Geçersiz AI yanıtı');

  // Normalize to internal format
  const { days, accommodationType, budget } = preferences;
  return normalizeAIResponse(parsed.route, preferences);
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
    activities:    (day.activities || []).map((act) => ({
      time:        act.time,
      title:       act.title,
      tag:         act.tag || 'Keşif',
      cost:        act.cost || null,
      description: act.description || null,
    })),
    accommodation: day.accommodation || null,
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
