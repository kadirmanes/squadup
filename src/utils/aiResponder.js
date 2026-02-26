/**
 * NomadWise AI — Context-aware mock response engine.
 *
 * In production: replace generateResponse() with an Anthropic Claude API call.
 * The prompt structure and context injection logic stays the same.
 */

// ─── Response pools ────────────────────────────────────────────────────────

const POOLS = {
  selamlama: [
    (ctx) => `Merhaba! ${ctx.destination} seyahatin için buradayım. Ne öğrenmek istersin?`,
    (ctx) => `Selam! ${ctx.days} günlük ${ctx.destination} maceran için hazırım. Sor bakalım! 🧭`,
  ],
  bütçe: {
    ekonomik: [
      (ctx) => `${ctx.destination} için ekonomik seyahatte günlük ~₺${Math.round(ctx.dailyCost)} harcama bekliyoruz. Ücretsiz müzeler ve halk plajlarına odaklanarak bütçeyi %20 daha düşürebilirsin.`,
      () => `Ekonomik seyahatte altın kural: öğle yemeğini yerel pazardan, akşamı ise mahalle lokantasından ye. Ortalama %40 tasarruf sağlar!`,
    ],
    standart: [
      (ctx) => `${ctx.destination} standart bütçede oldukça keyifli. Günlük ~₺${Math.round(ctx.dailyCost)} ile hem konforlu hem de yerel deneyimler yaşayabilirsin.`,
      () => `Standart bütçeyle önerim: ulaşım için otobüs veya günlük araç kiralama, konaklama için ise butik pansiyonlar.`,
    ],
    lux: [
      (ctx) => `${ctx.destination} lüks seyahatte gerçekten nefes kesici deneyimler seni bekliyor. Glamping, özel plajlar ve fine dining ile unutulmaz bir gezi.`,
      () => `Lüks paket için rezervasyonları en az 2 hafta önceden yap. Özellikle glamping alanları ve özel turlar hızla dolabiliyor.`,
    ],
  },
  yemek: [
    (ctx) => `${ctx.destination} mutfağı harika! Özellikle yerel pazarları ve halk lokantalarını keşfetmeni öneririm. Rotanda bunlar işaretli.`,
    () => `Her gün bir yerel lezzet dene: sabah köy kahvaltısı, öğle pazar yemeği, akşam ise restoran. Hem ucuz hem otantik!`,
    (ctx) => `${ctx.destination} bölgesinin özel lezzetleri planında yerini almış. Aktiviteler sekmesinde tüm yemek duraklarını görebilirsin.`,
  ],
  hava: {
    coastal: [
      (ctx) => `${ctx.destination} bu dönemde genellikle güneşli! ☀️ Ortalama 26-30°C, rüzgar hafif. UV koruması unutma.`,
    ],
    mountain: [
      (ctx) => `${ctx.destination} için dağlık iklim bekle — gündüz güzel, akşam serin. Hafif bir mont al yanına. 🏔️`,
    ],
    city: [
      (ctx) => `${ctx.destination} şehir iklimiyle değişken olabilir. Parçalı bulutlu, zaman zaman sağanak. Şemsiye tavsiyem! ☂️`,
    ],
    default: [
      (ctx) => `${ctx.destination} için hava durumu verilerini çekiyorum... Genel olarak seyahat sezonunda iyi görünüyor!`,
    ],
  },
  konaklama: {
    caravan: [
      (ctx) => `Karavan seyahatinde ${ctx.destination} çevresinde ${Math.max(ctx.days, 2)} harika kamping noktası var. Planında su doldurma ve boşaltma istasyonları işaretlendi.`,
      () => `Karavan için öneri: varıştan 1 gün önce rezervasyon yap. Hafta sonu yerleri çok çabuk doluyor!`,
    ],
    camping: [
      (ctx) => `${ctx.destination}'da ücretsiz kamp alanları mevcut. Planında işaretlenen ${ctx.days} alan yetkili ve güvenli.`,
      () => `Çadır kampında ateş yakma kurallarını önceden öğren. Bazı alanlarda yasak olabiliyor.`,
    ],
    hotel: [
      (ctx) => `${ctx.destination} otel seçiminde merkezi konum önemli. Planında seçilen oteller şehre 10-15 dk mesafede.`,
      () => `Butik otellerde erken check-in için sabah 8'de arayabilirsin — genellikle ücretsiz ayarlıyorlar.`,
    ],
  },
  güzergah: [
    (ctx) => `${ctx.days} günlük ${ctx.destination} güzergahı için ${ctx.days * 3} aktivite planlandı. Her gün yaklaşık ${Math.ceil(ctx.days * 50)}km sürüş.`,
    (ctx) => `Alternatif güzergah önerim: ${ctx.destination}'ya kuzeyden gir, gün batımını güney sahil yolundan izle. Çok daha etkileyici!`,
    () => `Rotanda küçük değişiklik önerisi: 2. gün öğleden sonra boş bırak. Keşfedilecek küçük sürpriz yerler her zaman çıkar!`,
  ],
  genel: [
    (ctx) => `${ctx.destination} için ${ctx.days} gün harika bir süre! Bu bölgede her günün kendine özgü bir ritmi var.`,
    () => `Seyahatte en iyi anılar planlı olmayan anlarda oluşur. Rotanda esneklik payı bıraktım.`,
    (ctx) => `${ctx.accommodation === 'caravan' ? '🚐 Karavan' : ctx.accommodation === 'camping' ? '⛺ Çadır' : '🏨 Otel'} ile ${ctx.destination} — mükemmel kombinasyon!`,
    () => `Herhangi bir aktivite veya yer hakkında daha fazla bilgi almak ister misin?`,
    () => `Premium üyeler için sesli rehber özelliği bu bölgede çok detaylı. Denemek ister misin?`,
  ],
};

// ─── Context extractor ────────────────────────────────────────────────────

function buildContext(preferences, tripData) {
  if (!preferences) return { destination: 'hedefiniz', days: 3, dailyCost: 500, accommodation: 'hotel', budget: 'standart' };
  const dailyCost = tripData?.totalBudget?.total / (preferences.days || 1) || 500;
  return {
    destination: preferences.destination,
    days: preferences.days,
    dailyCost,
    accommodation: preferences.accommodationType,
    budget: preferences.budget,
  };
}

function getWeatherType(destination = '') {
  const d = destination.toLowerCase();
  if (['bodrum', 'antalya', 'marmaris', 'fethiye', 'alanya', 'side', 'olimpos', 'göcek'].some(k => d.includes(k))) return 'coastal';
  if (['kapadok', 'erzurum', 'rize', 'trabzon', 'artvin', 'pamukkale'].some(k => d.includes(k))) return 'mountain';
  if (['istanbul', 'ankara', 'izmir', 'bursa', 'konya'].some(k => d.includes(k))) return 'city';
  return 'default';
}

// ─── Keyword router ───────────────────────────────────────────────────────

function pickResponse(key, ctx, subKey) {
  const pool = POOLS[key];
  if (!pool) return null;
  const arr = subKey ? pool[subKey] || pool.default || [] : Array.isArray(pool) ? pool : Object.values(pool).flat();
  if (!arr.length) return null;
  const fn = arr[Math.floor(Math.random() * arr.length)];
  return typeof fn === 'function' ? fn(ctx) : fn;
}

const KEYWORD_MAP = [
  { keywords: ['merhaba', 'selam', 'hey', 'hi', 'nasıl', 'naber'], key: 'selamlama' },
  { keywords: ['bütçe', 'para', 'fiyat', 'ücret', 'maliyet', 'ucuz', 'pahalı', 'tasarruf'], key: 'bütçe' },
  { keywords: ['yemek', 'restoran', 'lokanta', 'kafe', 'lezzet', 'ne yesem', 'nerede yesem'], key: 'yemek' },
  { keywords: ['hava', 'sıcak', 'soğuk', 'yağmur', 'güneş', 'iklim', 'mevsim'], key: 'hava' },
  { keywords: ['konaklama', 'uyku', 'kal', 'kamp', 'karavan', 'otel', 'glamping', 'çadır'], key: 'konaklama' },
  { keywords: ['güzergah', 'rota', 'yol', 'km', 'sürüş', 'alternatif', 'plan'], key: 'güzergah' },
];

// ─── Main function ────────────────────────────────────────────────────────

/**
 * @param {string} message — user's message
 * @param {Object} preferences — from TripContext
 * @param {Object} tripData — from TripContext
 * @returns {string} AI response text
 */
export function generateResponse(message, preferences, tripData) {
  const ctx = buildContext(preferences, tripData);
  const lower = message.toLowerCase();

  for (const { keywords, key } of KEYWORD_MAP) {
    if (keywords.some((k) => lower.includes(k))) {
      let subKey;
      if (key === 'bütçe') subKey = ctx.budget;
      if (key === 'hava') subKey = getWeatherType(ctx.destination);
      if (key === 'konaklama') subKey = ctx.accommodation;
      const resp = pickResponse(key, ctx, subKey);
      if (resp) return resp;
    }
  }

  // Fallback to general pool
  return pickResponse('genel', ctx) || 'Güzel soru! Seyahat planını optimize etmek için daha fazla bilgi paylaşabilirsin.';
}

// ─── Quick replies per context ────────────────────────────────────────────

export function getQuickReplies(preferences) {
  const base = [
    'Hava nasıl olacak? ☀️',
    'Bütçeyi nasıl yönetirim?',
    'En iyi yemek nerede?',
    'Güzergah alternatifleri?',
  ];
  if (preferences?.accommodationType === 'caravan') {
    return ['Kamping noktaları nerede?', ...base.slice(1)];
  }
  if (preferences?.budget === 'lux') {
    return ['Glamping rezervasyonu nasıl?', 'Fine dining önerisi?', ...base.slice(2)];
  }
  return base;
}
