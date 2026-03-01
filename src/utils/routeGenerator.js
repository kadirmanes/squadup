/**
 * NomadWise AI — Route Generator
 *
 * Each day is a different city along the route startLocation → destination.
 * Activities are location-specific: they reference real landmarks, nature
 * areas, and local food spots for each city.
 */

import { generateRouteCities } from './geocoder';

// ─── City Highlights ──────────────────────────────────────────────────────
// For every city we store slot-specific activity titles.
// Slots: morning · attraction · nature · food · evening

const CITY_HIGHLIGHTS = {
  'Ankara': {
    morning:     ['Eymir Gölü\'nde Sabah Koşusu', 'Atatürk Orman Çiftliği Yürüyüşü'],
    attraction:  ['Anıtkabir Ziyareti', 'Anadolu Medeniyetleri Müzesi', 'Kocatepe Camii'],
    nature:      ['Eymir Gölü Tabiat Parkı', 'Gençlik Parkı', 'ODTÜ Ormanı'],
    food:        ['Kızılay\'da Yerel Restoran', 'Ulus Tarihi Çarşı\'da Öğle', 'Tunalı Hilmi Kafe Sokağı'],
    evening:     ['Atakule Seyir Terası\'ndan Şehir Manzarası', 'Kızılay Meydanı Akşam Yürüyüşü'],
  },
  'Kocaeli': {
    morning:     ['İzmit Körfezi Sahilinde Sabah Yürüyüşü'],
    attraction:  ['Kocaeli Arkeoloji Müzesi', 'Hereke Halı Atölyeleri', 'Seka Kağıt Müzesi'],
    nature:      ['Kartepe Tabiat Parkı', 'Sapanca Gölü Kenarı'],
    food:        ['İzmit\'te Pişmaniye & Yerel Lezzetler', 'Körfez Meydanı Restoranları'],
    evening:     ['Sapanca Gölü\'nde Gün Batımı Seyri'],
  },
  'Sakarya': {
    morning:     ['Sapanca Gölü\'nde Sabah Yürüyüşü'],
    attraction:  ['Sapanca Gölü Tabiat Parkı', 'Adapazarı Tarihi Çarşı'],
    nature:      ['Sapanca Gölü Yürüyüş Parkurları', 'Taşköprü Ormanları'],
    food:        ['Sapanca\'da Karadeniz Kahvaltısı', 'Adapazarı\'nda Lokma Tatlısı'],
    evening:     ['Sapanca Gölü\'nde Akşam Yürüyüşü'],
  },
  'Düzce': {
    morning:     ['Efteni Gölü\'nde Sabah Yürüyüşü'],
    attraction:  ['Efteni Gölü Tabiat Parkı', 'Hasanlar Barajı Seyir Terası'],
    nature:      ['Karadere Kanyonu', 'Hamidiye Orman Parkı'],
    food:        ['Düzce\'de Fındık Ürünleri & Karadeniz Kahvaltısı'],
    evening:     ['Efteni Gölü\'nde Gün Batımı'],
  },
  'Bolu': {
    morning:     ['Abant Gölü\'nde Sabah Yürüyüşü', 'Yedigöller Milli Parkı\'na Erken Giriş'],
    attraction:  ['Yedigöller Milli Parkı', 'Abant Gölü', 'Gölcük Tabiat Parkı'],
    nature:      ['Yedigöller\'de Ormanlık Alan', 'Abant Gölü Çevre Yolu'],
    food:        ['Bolu\'nun Mengen Mutfağı — Şef Restoranı', 'Bolu Çarşısında Yerel Tatlar'],
    evening:     ['Abant Gölü\'nde Gün Batımı Seyri'],
  },
  'Zonguldak': {
    morning:     ['Ereğli Sahilinde Sabah Koşusu'],
    attraction:  ['Zonguldak Maden Müzesi', 'Ereğli Tarihi Liman'],
    nature:      ['Filyos Vadisi', 'Kızılcapınar Şelalesi'],
    food:        ['Zonguldak\'ta Hamsi & Deniz Ürünleri', 'Ereğli Balık Piyasası'],
    evening:     ['Ereğli Kıyısında Akşam Yürüyüşü'],
  },
  'Bartın': {
    morning:     ['Amasra Kalesi\'nde Gün Doğumu Seyri', 'Bartın Nehri Kıyısı Yürüyüşü'],
    attraction:  ['Amasra Kalesi & Bizans Surları', 'Küçük Liman & Tarihi Yarımada', 'Bartın Müzesi'],
    nature:      ['İnkumu Plajı', 'Güzelcehisar Tabiat Parkı'],
    food:        ['Amasra\'nın Taze Balığı — Liman Restoranları', 'Bartın\'da Karadeniz Mutfağı'],
    evening:     ['Amasra Limanı\'nda Gün Batımı', 'Tarihi Yarımadada Akşam Yürüyüşü'],
  },
  'Karabük': {
    morning:     ['Safranbolu Tarihi Çarşı\'da Sabah Kahvaltısı', 'Osmanlı Sokakları Yürüyüşü'],
    attraction:  ['Safranbolu Osmanlı Konakları', 'Cinci Han (Tarihi Kervansaray)', 'Hidayet Camii', 'Yörük Köyü'],
    nature:      ['Tokatlı Kanyonu', 'Bulak Mağarası'],
    food:        ['Safranbolu\'nun Taş Fırın Ekmeği & Safranı', 'Çarşı\'da Geleneksel Kahvaltı'],
    evening:     ['Safranbolu Kalesi\'nden Şehir Manzarası', 'Tarihi Konakta Akşam Yemeği'],
  },
  'Kastamonu': {
    morning:     ['Kastamonu Kalesi\'nde Sabah Seyri', 'Tarihi Çarşı Yürüyüşü'],
    attraction:  ['Kastamonu Kalesi', 'Kasaba Köyü Camii (UNESCO Adayı)', 'Atatürk Evi Müzesi'],
    nature:      ['Ilgaz Dağı Milli Parkı', 'Valla Kanyonu'],
    food:        ['Kastamonu\'nun Etli Ekmeği', 'Araç\'ta Yöresel Yemek'],
    evening:     ['Kastamonu Kalesi\'nden Gün Batımı'],
  },
  'Sinop': {
    morning:     ['Sinop Sahilinde Gün Doğumu', 'Tarihi Liman Yürüyüşü'],
    attraction:  ['Sinop Tarihi Cezaevi', 'Sinop Kalesi & Surları', 'Balatlar Kilise Müzesi'],
    nature:      ['Akliman Tabiat Parkı & Plajı', 'Sarıkum Tabiat Koruma Alanı'],
    food:        ['Sinop\'ta Taze Balık & Hamsi', 'Sahil Lokantaları'],
    evening:     ['Sinop Kalesi\'nden Karadeniz Manzarası', 'Liman\'da Akşam Yürüyüşü'],
  },
  'Samsun': {
    morning:     ['Sahil Boyu Sabah Koşusu — Cumhuriyet Meydanı', 'Bandırma Vapuru Müzesi Açılışı'],
    attraction:  ['19 Mayıs Müzesi (Atatürk\'ün Karaya Çıkışı)', 'Samsun Müzesi', 'Bandırma Vapuru Replikası'],
    nature:      ['Atakum Sahil Parkı', 'Kılıçlı Tabiat Parkı'],
    food:        ['Samsun\'da Pide & Laz Böreği — Tarihi Fırın', 'Atakum Sahilinde Restoran'],
    evening:     ['Atakum Sahilinde Gün Batımı', 'Cumhuriyet Meydanı Akşam Yürüyüşü'],
  },
  'Ordu': {
    morning:     ['Boztepe\'de Gün Doğumu Seyri', 'Ordu Sahilinde Sabah Yürüyüşü'],
    attraction:  ['Boztepe Tepesi & Teleferik', 'Taşbaşı Kültür Merkezi', 'Ordu Arkeoloji Müzesi'],
    nature:      ['Çambaşı Yaylası', 'Gaga Gölü', 'Boztepe Piknik Alanları'],
    food:        ['Ordu\'nun Fındık Ürünleri & Muhlama', 'Sahil Balık Lokantaları'],
    evening:     ['Boztepe\'den Karadeniz Gün Batımı', 'Sahil Yürüyüşü'],
  },
  'Giresun': {
    morning:     ['Giresun Kalesi\'nde Sabah Seyri', 'Sahil Parkı Yürüyüşü'],
    attraction:  ['Giresun Kalesi', 'Giresun Adası (Antik Jason Adası) Tekne Turu', 'Giresun Müzesi'],
    nature:      ['Kümbet Yaylası', 'Tamdere Kanyonu', 'Batlama Şelalesi'],
    food:        ['Giresun\'un Laz Böreği & Hamsisi — Sahil Restoranı', 'Fındık Çarşısında Yerel Tatlar'],
    evening:     ['Giresun Limanı\'ndan Gün Batımı', 'Kale\'de Akşam Seyri'],
  },
  'Trabzon': {
    morning:     ['Boztepe Teleferik ile Gün Doğumu', 'Uzungöl\'e Sabah Erken Gidiş'],
    attraction:  ['Sümela Manastırı (Altındere Milli Parkı)', 'Uzungöl Turu', 'Trabzon Aya Sofya Müzesi'],
    nature:      ['Altındere Milli Parkı', 'Uzungöl', 'Sera Gölü'],
    food:        ['Trabzon\'un Laz Böreği & Akçaabat Köftesi', 'Boztepe\'de Çay & Karadeniz Kahvaltısı'],
    evening:     ['Boztepe\'den Trabzon Şehri & Deniz Manzarası', 'Trabzon Tarihi Çarşı\'da Akşam'],
  },
  'Rize': {
    morning:     ['Rize Çay Bahçelerinde Gün Doğumu', 'Ayder\'e Sabah Erken Gidiş'],
    attraction:  ['Rize Çay Fabrikası Turu', 'Ayder Yaylası & Şelaleleri', 'Zilkale', 'Fırtına Deresi Kanyonu'],
    nature:      ['Ayder Yaylası & Şelaleleri', 'Pokut Yaylası', 'Palovit Şelalesi'],
    food:        ['Rize\'nin Çayı & Muhlama — Ayder\'de Yöresel Kahvaltı', 'Rize Çay Evi\'nde Öğle'],
    evening:     ['Ayder\'de Gün Batımı & Yayla Akşamı', 'Rize Kalesi\'nden Karadeniz Manzarası'],
  },
  'Artvin': {
    morning:     ['Artvin Vadisinde Gün Doğumu', 'Karagöl Sahara Milli Parkı\'na Erken Giriş'],
    attraction:  ['Artvin Kalesi', 'Karagöl Sahara Milli Parkı', 'Şavşat Şelalesi', 'Berta Kanyonu'],
    nature:      ['Karagöl Gölleri', 'Camili Biyosfer Rezervi', 'Tortum Şelalesi'],
    food:        ['Artvin\'de Yöresel Yemek', 'Şavşat\'ta Köy Kahvaltısı'],
    evening:     ['Artvin Kalesi\'nden Coruh Nehri & Vadi Manzarası'],
  },
  'Erzurum': {
    morning:     ['Palandöken\'de Sabah Yürüyüşü', 'Çifte Minareli Medrese\'ye Erken Giriş'],
    attraction:  ['Çifte Minareli Medrese', 'Ulu Camii', 'Erzurum Kalesi', 'Yakutiye Medresesi'],
    nature:      ['Palandöken Kayak Merkezi & Yürüyüş Rotaları', 'Tortum Gölü & Şelalesi'],
    food:        ['Erzurum\'un Cağ Kebabı', 'Cumhuriyet Caddesi\'nde Pastane & Çay'],
    evening:     ['Erzurum Kalesi\'nden Şehir Manzarası'],
  },
  'Erzincan': {
    morning:     ['Munzur Vadisinde Sabah Yürüyüşü'],
    attraction:  ['Altıntepe Höyüğü', 'Erzincan Tarihi Çarşı'],
    nature:      ['Munzur Vadisi Milli Parkı', 'Kemah Boğazı'],
    food:        ['Erzincan\'ın Tulum Peyniri & Çiğ Köftesi', 'Yöresel Restoran'],
    evening:     ['Erzincan Kalesi\'nden Şehir Manzarası'],
  },
  'Sivas': {
    morning:     ['Kızılırmak Kıyısında Sabah Yürüyüşü'],
    attraction:  ['Divriği Ulu Camii & Darüşşifası (UNESCO)', 'Gök Medrese', 'Buruciye Medresesi'],
    nature:      ['Ulaş Gölü', 'Yıldız Dağları'],
    food:        ['Sivas\'ın Kangal Balıklısı & Yöresel Kebap', 'Tarihi Çarşı\'da Öğle'],
    evening:     ['Tarihi Medreseler Işıklı Gece Seyri'],
  },
  'Kayseri': {
    morning:     ['Erciyes Dağı\'nda Sabah Yürüyüşü'],
    attraction:  ['Kayseri Kalesi', 'Hunat Hatun Külliyesi', 'Erciyes Dağı', 'Sultan Sazlığı'],
    nature:      ['Erciyes Dağı Tabiat Parkı', 'Sultan Sazlığı Kuş Cenneti'],
    food:        ['Kayseri\'nin Pastırması & Mantısı', 'Tarihi Çarşı\'da Yöresel Tatlar'],
    evening:     ['Kayseri Kalesi\'nde Işıklı Gece'],
  },
  'Nevşehir': {
    morning:     ['Göreme\'de Sıcak Hava Balonu — Gün Doğumu', 'Uçhisar Kalesi\'nde Şafak Seyri'],
    attraction:  ['Göreme Açık Hava Müzesi', 'Derinkuyu Yeraltı Şehri', 'Uçhisar Kalesi', 'Paşabağı Peribacaları'],
    nature:      ['Kızılçukur Vadisi', 'Güvercinlik Vadisi', 'Ihlara Vadisi'],
    food:        ['Kapadokya\'nın Testi Kebabı — Avanos Restoranı', 'Göreme\'de Yöresel Kahvaltı'],
    evening:     ['Uçhisar\'dan Kapadokya Gün Batımı', 'Göreme\'de Akşam Yemeği'],
  },
  'Konya': {
    morning:     ['Mevlana Türbesi Açılışı', 'Tarihi Çarşı Sabah Yürüyüşü'],
    attraction:  ['Mevlana Müzesi & Türbesi', 'Alaaddin Camii', 'Karatay Medresesi', 'Sırçalı Medrese'],
    nature:      ['Sille Köyü & Tarihi Kilise', 'Meke Maar Gölü'],
    food:        ['Konya\'nın Etli Ekmeği & Fırın Kebabı', 'Tarihi Çarşı\'da Öğle'],
    evening:     ['Sema Gösterisi (Mevlana Kültür Merkezi)', 'Tarihi Çarşı\'da Akşam Yürüyüşü'],
  },
  'İstanbul': {
    morning:     ['Boğaz Sahilinde Sabah Yürüyüşü', 'Kapalıçarşı Açılışı', 'Mısır Çarşısı Turu'],
    attraction:  ['Ayasofya & Sultan Ahmet Camii', 'Topkapı Sarayı', 'Dolmabahçe Sarayı', 'Galata Kulesi'],
    nature:      ['Belgrad Ormanı Yürüyüşü', 'Adalar Günübirlik Turu', 'Emirgan Korusu'],
    food:        ['Eminönü\'nde Balık Ekmek', 'Beyoğlu\'nda Meyhane', 'Kadıköy Pazar Turu'],
    evening:     ['Boğaz Manzaralı Gün Batımı', 'Galata\'da Akşam Yemeği'],
  },
  'Bursa': {
    morning:     ['Uludağ\'da Sabah Yürüyüşü', 'Tarihi Çarşı Açılışı'],
    attraction:  ['Ulu Camii', 'Yeşil Türbe & Yeşil Camii', 'Bursa Kalesi', 'İpek Yolu Koza Hanı'],
    nature:      ['Uludağ Milli Parkı', 'Gölyazı Köyü', 'Oylat Şelalesi'],
    food:        ['Bursa\'nın İskender Kebabı — Tarihi Restoran', 'Kapalıçarşı\'da Osmanlı Tatlıları'],
    evening:     ['Teleferik ile Uludağ Gün Batımı', 'Atatürk Caddesi Akşam Yürüyüşü'],
  },
  'İzmir': {
    morning:     ['Kordon\'da Sabah Koşusu', 'Kızlarağası Hanı Çevresinde Kahvaltı'],
    attraction:  ['Efes Antik Kenti', 'Kadifekale', 'Agora Ören Yeri', 'Saat Kulesi'],
    nature:      ['Dilek Yarımadası Milli Parkı', 'Yamanlar Dağı Tabiat Parkı'],
    food:        ['Kemeraltı Bazarı\'nda Kumru & Boyoz', 'Alsancak\'ta Deniz Mahsülleri'],
    evening:     ['Kordon\'da Gün Batımı Seyri', 'Alsancak\'ta Akşam Yemeği'],
  },
  'Antalya': {
    morning:     ['Konyaaltı Plajı\'nda Sabah Yüzüşü', 'Kaleiçi Sabah Yürüyüşü'],
    attraction:  ['Kaleiçi Tarihi Merkez', 'Düden Şelalesi', 'Antalya Müzesi', 'Perge Antik Kenti'],
    nature:      ['Düden Şelalesi Tabiat Parkı', 'Köprülü Kanyon'],
    food:        ['Kaleiçi Balık Pazarı — Taze Deniz Mahsülleri', 'Kaleiçi Tarihi Restoran'],
    evening:     ['Kaleiçi Marina\'da Gün Batımı', 'Konyaaltı Plajı Akşam Yürüyüşü'],
  },
  'Fethiye': {
    morning:     ['Ölüdeniz Plajı\'nda Gün Doğumu', 'Kelebekler Vadisi\'ne Sabah Teknesi'],
    attraction:  ['Ölüdeniz (Mavi Lagün)', 'Kayaköy Terk Edilmiş Köy', 'Likya Kaya Mezarları'],
    nature:      ['Saklıkent Kanyonu', 'Kelebekler Vadisi', 'Ölüdeniz Tabiat Parkı'],
    food:        ['Fethiye Balık Pazarı\'nda Akşam Yemeği', 'Paspatur Çarşısı\'nda Meze'],
    evening:     ['Ölüdeniz\'de Gün Batımı', 'Paspatur\'da Akşam Yürüyüşü'],
  },
  'Bodrum': {
    morning:     ['Gümbet Plajı\'nda Sabah Yüzüşü', 'Bodrum Balıkçı Rıhtımı Turu'],
    attraction:  ['Bodrum Kalesi & Sualtı Arkeoloji Müzesi', 'Antik Bodrum Tiyatrosu', 'Halikarnas Mozolesi'],
    nature:      ['Gökova Körfezi Tekne Turu', 'Kargı & Torba Koyu'],
    food:        ['Bodrum Çarşısı\'nda Meze & Taze Balık', 'Gümbet\'te Deniz Mahsülleri'],
    evening:     ['Bodrum Kalesi\'nden Gün Batımı', 'Çarşı\'da Akşam Mezeleri'],
  },
  'Marmaris': {
    morning:     ['Marmaris Koyu\'nda Sabah Yüzüşü', 'Marmaris Kalesi Sabah Turu'],
    attraction:  ['Marmaris Kalesi', 'Cennet Adası Tekne Turu', 'Atatürk Heykeli Meydanı'],
    nature:      ['Turunc Koyu', 'Cennet Adası', 'Marmaris Milli Parkı'],
    food:        ['Marmaris\'te Taze Deniz Mahsülleri', 'Eski Çarşı\'da Meze Kahvaltısı'],
    evening:     ['Yat Limanı\'nda Gün Batımı', 'İçmeler Sahili Akşam Yürüyüşü'],
  },
  'Denizli': {
    morning:     ['Pamukkale Travertenlerinde Gün Doğumu', 'Sıcak Kaynaklarda Sabah Banyosu'],
    attraction:  ['Pamukkale Travertenleri', 'Hierapolis Antik Kenti', 'Kleopatra Havuzu', 'Hierapolis Müzesi'],
    nature:      ['Pamukkale Travertenleri', 'Kaklik Mağarası', 'Salda Gölü'],
    food:        ['Denizli\'de Buldan Bezi & Yöresel Restoran', 'Pamukkale Köyü\'nde Gözleme'],
    evening:     ['Beyaz Terraslar\'da Gün Batımı', 'Hierapolis Amfitiyatro\'da Gece Seyri'],
  },
  'Mardin': {
    morning:     ['Mardin Ovası\'na Şafak Seyri', 'Taş Evlerde Sabah Kahvaltısı'],
    attraction:  ['Zinciriye Medresesi', 'Deyrulzafaran Manastırı', 'Mardin Müzesi', 'Kasımiye Medresesi'],
    nature:      ['Mor Gabriel Manastırı', 'Mezopotamya Ovası Seyir Terası'],
    food:        ['Mardin\'in Kaburga Dolması & Süryanice Mutfak', 'Bazı Çarşı\'da Tatlılar'],
    evening:     ['Mardin Kalesi\'nden Güneybatı Manzarası', 'Eski Çarşı\'da Akşam Yürüyüşü'],
  },
  'Gaziantep': {
    morning:     ['Gaziantep Kalesi Açılışı', 'Bakırcılar Çarşısı\'nda Sabah'],
    attraction:  ['Zeugma Mozaik Müzesi', 'Gaziantep Kalesi', 'Hasan Süzer Etnografya Müzesi'],
    nature:      ['Rumkale', 'Gaziantep Hayvanat Bahçesi'],
    food:        ['Gaziantep\'in Dünyaca Ünlü Baklavası', 'Yöresel Kebap Restoranı'],
    evening:     ['Gaziantep Kalesi\'nde Gün Batımı', 'Tarihi Çarşı Akşam Yürüyüşü'],
  },
  'Şanlıurfa': {
    morning:     ['Balıklıgöl\'de Sabah Ziyareti', 'Hz. İbrahim\'in Doğduğu Mağara'],
    attraction:  ['Balıklıgöl (Hz. İbrahim\'in Gölü)', 'Göbeklitepe (Tüm Zamanların En Eski Tapınağı)', 'Urfa Bazaarı'],
    nature:      ['Halfeti Kayalık Köyü Tekne Turu', 'Harran Antik Kenti'],
    food:        ['Urfa\'nın Çiğ Köftesi & Kebabı', 'Gümrük Hanı\'nda Kahvaltı'],
    evening:     ['Balıklıgöl\'de Gün Batımı', 'Tarihi Bazaar\'da Akşam Yürüyüşü'],
  },
  'Van': {
    morning:     ['Van Gölü Sahilinde Gün Doğumu', 'Van Kalesi\'ne Erken Çıkış'],
    attraction:  ['Van Kalesi', 'Akdamar Kilisesi (Tekne ile)', 'Van Müzesi', 'Muradiye Şelalesi'],
    nature:      ['Van Gölü Kıyı Turu', 'Muradiye Şelalesi Tabiat Parkı'],
    food:        ['Van\'ın Dünyaca Ünlü Kahvaltısı', 'Otlu Van Peyniri & Bal'],
    evening:     ['Van Gölü\'nde Gün Batımı', 'Van Kalesi Işıklı Gece'],
  },
  'Erzurum': {
    morning:     ['Palandöken\'de Sabah Yürüyüşü', 'Çifte Minareli Medrese\'ye Erken Giriş'],
    attraction:  ['Çifte Minareli Medrese', 'Ulu Camii', 'Erzurum Kalesi', 'Yakutiye Medresesi'],
    nature:      ['Palandöken Kayak & Yürüyüş Rotaları', 'Tortum Gölü & Şelalesi'],
    food:        ['Erzurum\'un Cağ Kebabı — Tarihi Restoran', 'Cumhuriyet Caddesi\'nde Çay & Tatlı'],
    evening:     ['Erzurum Kalesi\'nden Şehir Manzarası'],
  },
};

// Fallback for cities not in CITY_HIGHLIGHTS — inject city name
function _fallback(cityName) {
  const c = cityName.endsWith('i') || cityName.endsWith('ı') || cityName.endsWith('u') || cityName.endsWith('ü')
    ? cityName + '\'nde' : cityName + '\'de';
  return {
    morning:    [`${c} Sabah Yürüyüşü`],
    attraction: [`${cityName} Tarihi Merkez & Müze Turu`],
    nature:     [`${cityName} Çevresinde Doğa Keşfi`],
    food:       [`${cityName}\'nın Yöresel Lezzetleri`],
    evening:    [`${cityName}\'de Akşam Yürüyüşü`],
  };
}

/** Returns a city highlights object, falling back to generic if unknown. */
function getCityHighlights(cityName) {
  return CITY_HIGHLIGHTS[cityName] || _fallback(cityName);
}

/** Pick item from array cycling with dayIndex. */
function pick(arr, dayIndex) {
  return arr[dayIndex % arr.length];
}

// ─── Activity Pool Templates ───────────────────────────────────────────────
// `role` determines which city highlight slot fills this activity's title.
// Roles: morning | attraction | nature | food | evening | fixed
// 'fixed' = title kept as-is (accommodation/logistic activities)

const POOL_TEMPLATES = {
  caravan: {
    ekonomik: [
      { time: '08:00', role: 'morning',    tag: 'Sabah' },
      { time: '10:00', role: 'nature',     tag: 'Doğa' },
      { time: '13:00', role: 'food',       tag: 'Yemek', cost: '₺80' },
      { time: '16:00', role: 'fixed',      tag: 'Kamping', title: 'Su Doldurma & Karavan Park Yeri', cost: 'Ücretsiz' },
      { time: '19:00', role: 'evening',    tag: 'Akşam' },
    ],
    standart: [
      { time: '08:30', role: 'morning',    tag: 'Aktivite' },
      { time: '10:00', role: 'attraction', tag: 'Keşif', cost: '₺120' },
      { time: '13:00', role: 'food',       tag: 'Yemek', cost: '₺200' },
      { time: '16:00', role: 'fixed',      tag: 'Konaklama', title: 'Tesisli Karavan Parkı Check-in', cost: '₺350/gece' },
      { time: '20:00', role: 'evening',    tag: 'Akşam' },
    ],
    lux: [
      { time: '09:00', role: 'morning',    tag: 'Premium', cost: '₺2.500' },
      { time: '11:00', role: 'attraction', tag: 'Tur', cost: '₺800' },
      { time: '14:00', role: 'food',       tag: 'Yemek', cost: '₺600' },
      { time: '17:00', role: 'nature',     tag: 'Premium' },
      { time: '20:00', role: 'evening',    tag: 'Akşam', cost: '₺900' },
    ],
  },
  camping: {
    ekonomik: [
      { time: '07:00', role: 'morning',    tag: 'Huzur' },
      { time: '09:00', role: 'nature',     tag: 'Doğa' },
      { time: '12:00', role: 'fixed',      tag: 'Yemek', title: 'Kendi Malzemelerinle Öğle Yemeği' },
      { time: '15:00', role: 'nature',     tag: 'Doğa' },
      { time: '19:00', role: 'fixed',      tag: 'Akşam', title: 'Kamp Ateşi & Sosyal Alan' },
    ],
    standart: [
      { time: '08:00', role: 'fixed',      tag: 'Sabah', title: 'Sabah Kamp Kahvaltısı' },
      { time: '10:00', role: 'nature',     tag: 'Aktivite' },
      { time: '13:00', role: 'food',       tag: 'Yemek', cost: '₺150' },
      { time: '16:00', role: 'attraction', tag: 'Aktivite', cost: '₺200' },
      { time: '20:00', role: 'fixed',      tag: 'Akşam', title: 'Kamp Alanında Yıldız Seyri' },
    ],
    lux: [
      { time: '08:30', role: 'fixed',      tag: 'Premium', title: 'Glamping Suite\'de A la Carte Kahvaltı' },
      { time: '10:30', role: 'attraction', tag: 'Tur', cost: '₺1.200' },
      { time: '13:30', role: 'food',       tag: 'Yemek', cost: '₺700' },
      { time: '16:30', role: 'fixed',      tag: 'Premium', title: 'Çadır Spa & Masaj Seansı', cost: '₺1.500' },
      { time: '20:00', role: 'evening',    tag: 'Akşam' },
    ],
  },
  hotel: {
    ekonomik: [
      { time: '08:00', role: 'fixed',      tag: 'Sabah', title: 'Otel Kahvaltısı' },
      { time: '10:00', role: 'attraction', tag: 'Keşif' },
      { time: '13:00', role: 'food',       tag: 'Yemek', cost: '₺60' },
      { time: '16:00', role: 'attraction', tag: 'Kültür' },
      { time: '20:00', role: 'food',       tag: 'Akşam', cost: '₺120' },
    ],
    standart: [
      { time: '09:00', role: 'fixed',      tag: 'Sabah', title: 'Butik Otel Kahvaltısı' },
      { time: '10:30', role: 'attraction', tag: 'Tur', cost: '₺300' },
      { time: '13:00', role: 'food',       tag: 'Yemek', cost: '₺250' },
      { time: '15:30', role: 'attraction', tag: 'Kültür', cost: '₺100' },
      { time: '20:00', role: 'evening',    tag: 'Akşam', cost: '₺400' },
    ],
    lux: [
      { time: '09:00', role: 'fixed',      tag: 'Premium', title: 'Lüks Otel A la Carte Kahvaltı' },
      { time: '11:00', role: 'attraction', tag: 'Premium', cost: '₺2.000' },
      { time: '13:30', role: 'food',       tag: 'Yemek', cost: '₺1.200' },
      { time: '16:00', role: 'nature',     tag: 'Premium', cost: '₺2.500' },
      { time: '20:30', role: 'evening',    tag: 'Akşam', cost: '₺1.500' },
    ],
  },
};

// ─── Budget Estimates ──────────────────────────────────────────────────────

const BUDGET_ESTIMATES = {
  caravan: {
    ekonomik: { fuel: 200, accommodation: 50,   food: 150,  total: 400  },
    standart: { fuel: 280, accommodation: 350,  food: 350,  total: 980  },
    lux:      { fuel: 280, accommodation: 2500, food: 2300, total: 5080 },
  },
  camping: {
    ekonomik: { fuel: 150, accommodation: 30,   food: 100,  total: 280  },
    standart: { fuel: 200, accommodation: 250,  food: 300,  total: 750  },
    lux:      { fuel: 200, accommodation: 3000, food: 2700, total: 5900 },
  },
  hotel: {
    ekonomik: { fuel: 100, accommodation: 500,  food: 200,  total: 800  },
    standart: { fuel: 120, accommodation: 1200, food: 700,  total: 2020 },
    lux:      { fuel: 120, accommodation: 5000, food: 4200, total: 9320 },
  },
};

// ─── Interest Activities ───────────────────────────────────────────────────

const INTEREST_ACTIVITIES = {
  dogal:      { tag: 'Doğa',      role: 'nature'    },
  tarih:      { tag: 'Kültür',    role: 'attraction' },
  gastronomi: { tag: 'Gastronomi',role: 'food'       },
  macera:     { tag: 'Macera',    title: 'Rafting / Zipline Aktivitesi' },
  huzur:      { tag: 'Huzur',     title: 'Yoga & Meditasyon Seansı' },
  fotograf:   { tag: 'Keşif',     role: 'nature'    },
};

// ─── Build activities for one day/city ────────────────────────────────────

function buildActivities(templates, cityName, dayIndex, interests) {
  const highlights = getCityHighlights(cityName);

  const activities = templates.map((tpl) => {
    let title;
    if (tpl.role === 'fixed') {
      title = tpl.title;
    } else {
      title = pick(highlights[tpl.role] || highlights.attraction, dayIndex);
    }
    return { time: tpl.time, title, tag: tpl.tag, ...(tpl.cost ? { cost: tpl.cost } : {}) };
  });

  // Inject interest-based bonus activity on alternate days
  if (interests.length > 0) {
    const interestKey = interests[dayIndex % interests.length];
    const bonus = INTEREST_ACTIVITIES[interestKey];
    if (bonus) {
      let bonusTitle = bonus.title;
      if (!bonusTitle && bonus.role) {
        bonusTitle = pick(highlights[bonus.role] || highlights.attraction, dayIndex + 1);
      }
      activities.splice(2, 0, { time: '11:30', title: bonusTitle, tag: bonus.tag });
    }
  }

  return activities;
}

// ─── Date Helpers ──────────────────────────────────────────────────────────

const TR_MONTHS     = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TR_DAYS_SHORT = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];

function formatTurkishDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
}

function addDays(dateInput, n) {
  const d = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
  d.setDate(d.getDate() + n);
  return d;
}

function getDayOfWeekTR(date) {
  const d = date instanceof Date ? date : new Date(date);
  return TR_DAYS_SHORT[(d.getDay() + 6) % 7];
}

// ─── Main Generator ────────────────────────────────────────────────────────

export function generateRoute(preferences) {
  const {
    startLocation     = 'İstanbul',
    destination       = 'Kapadokya',
    startDate,
    days              = 3,
    accommodationType = 'caravan',
    budget            = 'standart',
    interests         = [],
  } = preferences;

  const templates = POOL_TEMPLATES[accommodationType]?.[budget] || POOL_TEMPLATES.caravan.standart;
  const dailyCost = BUDGET_ESTIMATES[accommodationType]?.[budget] || BUDGET_ESTIMATES.caravan.standart;
  const routeCities = generateRouteCities(startLocation, destination, days);

  const dayPlans = routeCities.map((city, i) => {
    const date      = startDate ? addDays(startDate, i) : null;
    const dateLabel = date ? formatTurkishDate(date) : null;
    const dayOfWeek = date ? getDayOfWeekTR(date) : null;

    const activities = buildActivities(templates, city.name, i, interests);

    const contextParts = [
      dayOfWeek && dateLabel ? `${dayOfWeek}, ${dateLabel}` : null,
      i === 0                      ? 'Yolculuk başlıyor'  : null,
      i === routeCities.length - 1 ? 'Son durak'          : null,
    ].filter(Boolean);

    return {
      day:           i + 1,
      location:      city.name,
      locationEmoji: city.emoji || '📍',
      date:          dateLabel,
      title:         city.name,
      subtitle:      contextParts.join(' • ') || city.name,
      activities,
      estimatedCost: dailyCost.total,
      coordinate:    { latitude: city.lat, longitude: city.lng },
    };
  });

  return {
    days: dayPlans,
    totalBudget: {
      fuel:          dailyCost.fuel          * days,
      accommodation: dailyCost.accommodation * days,
      food:          dailyCost.food          * days,
      total:         dailyCost.total         * days,
      tier:          budget,
      currency:      '₺',
    },
    meta: { startLocation, destination, days, startDate, accommodationType, budget, interests, generatedAt: new Date().toISOString() },
  };
}

// ─── Premium Features ──────────────────────────────────────────────────────

export const PREMIUM_FEATURES = {
  audioGuide: { id: 'audio_guide', name: 'Sesli Rehber',        isPremium: true, description: 'Her rota için AI destekli sesli anlatım' },
  offlineMap: { id: 'offline_map', name: 'Çevrimdışı Harita',   isPremium: true, description: 'İnternetsiz ortamlarda tam harita erişimi' },
  aiReplan:   { id: 'ai_replan',   name: 'Anlık AI Replanlama', isPremium: true, description: 'Hava durumuna göre rotayı otomatik güncelle' },
};
