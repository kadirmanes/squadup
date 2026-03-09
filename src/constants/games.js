import { Linking, Platform, Alert } from 'react-native';

export const GAMES = [
  {
    id: 'valorant',
    name: 'Valorant',
    emoji: '🎯',
    color: '#FF4655',
    colorDim: 'rgba(255,70,85,0.15)',
    ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
    servers: ['EU', 'TR', 'NA', 'AP', 'BR', 'LATAM', 'KR'],
    nicknameHint: 'Riot ID (ör: NightWolf#TR1)',
    mobileScheme: null,
    androidPackage: null,
    iosAppId: null,
  },
  {
    id: 'cs2',
    name: 'CS2',
    emoji: '🔫',
    color: '#FF8C00',
    colorDim: 'rgba(255,140,0,0.15)',
    ranks: [
      'Silver I', 'Silver II', 'Silver III', 'Silver IV', 'Silver Elite',
      'Silver Elite Master', 'Gold Nova I', 'Gold Nova II', 'Gold Nova III',
      'Gold Nova Master', 'Master Guardian I', 'Master Guardian II',
      'Master Guardian Elite', 'Distinguished MG', 'Legendary Eagle',
      'Legendary Eagle Master', 'Supreme First Class', 'Global Elite',
    ],
    servers: ['EU', 'NA', 'AS', 'OCE'],
    nicknameHint: 'Steam kullanıcı adı',
    mobileScheme: null,
    androidPackage: null,
    iosAppId: null,
  },
  {
    id: 'lol',
    name: 'League of Legends',
    emoji: '⚔️',
    color: '#C89B3C',
    colorDim: 'rgba(200,155,60,0.15)',
    ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
    servers: ['EUW', 'EUNE', 'TR', 'NA', 'KR', 'BR', 'LAN', 'RU', 'JP', 'OCE'],
    nicknameHint: 'Summoner adı',
    mobileScheme: null,
    androidPackage: null,
    iosAppId: null,
  },
  {
    id: 'r6',
    name: 'Rainbow Six Siege',
    emoji: '🛡️',
    color: '#FFD700',
    colorDim: 'rgba(255,215,0,0.15)',
    ranks: ['Copper', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Champion'],
    servers: ['EU', 'NA', 'SA', 'ASIA', 'ANZ'],
    nicknameHint: 'Ubisoft Connect ID',
    mobileScheme: null,
    androidPackage: null,
    iosAppId: null,
  },
  {
    id: 'apex',
    name: 'Apex Legends',
    emoji: '🦾',
    color: '#CD4141',
    colorDim: 'rgba(205,65,65,0.15)',
    ranks: ['Rookie', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Predator'],
    servers: ['EU', 'US-E', 'US-W', 'AS'],
    nicknameHint: 'EA / Origin kullanıcı adı',
    mobileScheme: null,
    androidPackage: null,
    iosAppId: null,
  },
  {
    id: 'dota2',
    name: 'Dota 2',
    emoji: '🧙',
    color: '#A970FF',
    colorDim: 'rgba(169,112,255,0.15)',
    ranks: ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'],
    servers: ['EU', 'NA', 'SA', 'SEA', 'RU', 'AU'],
    nicknameHint: 'Steam kullanıcı adı',
    mobileScheme: null,
    androidPackage: null,
    iosAppId: null,
  },
  {
    id: 'pubgmobile',
    name: 'PUBG Mobile',
    emoji: '🪖',
    color: '#F7941D',
    colorDim: 'rgba(247,148,29,0.15)',
    ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Conqueror'],
    servers: ['ASIA', 'EU', 'NA', 'MIDDLE EAST', 'SA'],
    nicknameHint: 'Karakter adı (ID ile)',
    mobileScheme: 'pubgmobile://',
    androidPackage: 'com.tencent.ig',
    iosAppId: '1330123889',
  },
  {
    id: 'mobilelegends',
    name: 'Mobile Legends',
    emoji: '🌀',
    color: '#1A9FFF',
    colorDim: 'rgba(26,159,255,0.15)',
    ranks: ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic', 'Mythical Glory'],
    servers: ['ASIA', 'EU', 'NA', 'TR'],
    nicknameHint: 'Oyun içi adı (ID ile)',
    mobileScheme: 'mobilelegends://',
    androidPackage: 'com.mobile.legends',
    iosAppId: '1160056295',
  },
  {
    id: 'fifa',
    name: 'EA FC 25',
    emoji: '⚽',
    color: '#00D084',
    colorDim: 'rgba(0,208,132,0.15)',
    ranks: ['Division 10', 'Division 9', 'Division 8', 'Division 7', 'Division 6', 'Division 5', 'Division 4', 'Division 3', 'Division 2', 'Division 1', 'Elite'],
    servers: null, // Global matchmaking
    nicknameHint: 'EA hesap adı',
    mobileScheme: 'eafifamobile://',
    androidPackage: 'com.ea.fifamobile',
    iosAppId: '1042475188',
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    emoji: '🏗️',
    color: '#9B59B6',
    colorDim: 'rgba(155,89,182,0.15)',
    ranks: ['Open', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Champions', 'Unreal'],
    servers: null, // Global matchmaking
    nicknameHint: 'Epic Games kullanıcı adı',
    mobileScheme: 'fortnite://',
    androidPackage: 'com.epicgames.fortnite',
    iosAppId: '865011974',
  },
];

export const VIBES = [
  { id: 'tryhard', emoji: '😤', label: 'Tryhard', sublabel: 'Rank çıkmak', color: '#FF4444' },
  { id: 'chill', emoji: '😂', label: 'Chill', sublabel: 'Eğlenmek', color: '#00D084' },
  { id: 'learn', emoji: '🎓', label: 'Learn', sublabel: 'Gelişmek', color: '#0094FF' },
  { id: 'silent', emoji: '🔥', label: 'Silent', sublabel: 'Sessiz kazan', color: '#FF8C00' },
];

export const REGIONS = [
  { id: 'EU', label: 'Avrupa', flag: '🇪🇺' },
  { id: 'TR', label: 'Türkiye', flag: '🇹🇷' },
  { id: 'NA', label: 'Kuzey Amerika', flag: '🇺🇸' },
  { id: 'ASIA', label: 'Asya', flag: '🌏' },
];

export const PLAY_TIMES = [
  { id: 'morning',   emoji: '🌅', label: 'Sabah',  desc: '08:00 – 13:00', color: '#F59E0B' },
  { id: 'afternoon', emoji: '☀️', label: 'Öğlen',  desc: '13:00 – 18:00', color: '#EF4444' },
  { id: 'evening',   emoji: '🌆', label: 'Akşam',  desc: '18:00 – 23:00', color: '#6366F1' },
  { id: 'night',     emoji: '🌙', label: 'Gece',   desc: '23:00 – 03:00', color: '#8B5CF6' },
];

export const getGame = (gameId) => GAMES.find((g) => g.id === gameId) || null;
export const getVibe = (vibeId) => VIBES.find((v) => v.id === vibeId) || null;
export const getRegion = (regionId) => REGIONS.find((r) => r.id === regionId) || null;
export const getPlayTime = (id) => PLAY_TIMES.find((p) => p.id === id) || null;

export const GROUP_SIZES = [
  { id: 2, label: 'DUO',  emoji: '👥', desc: '1 kişi arıyor' },
  { id: 3, label: 'TRIO', emoji: '👪', desc: '2 kişi arıyor' },
  { id: 4, label: 'QUAD', emoji: '⚡', desc: '3 kişi arıyor' },
  { id: 5, label: 'FULL', emoji: '🔥', desc: '4 kişi arıyor' },
];
export const getGroupSize = (id) => GROUP_SIZES.find((g) => g.id === id) || null;

/**
 * Oyunu açar. Yüklü değilse mağazaya yönlendirir.
 * @returns {Promise<'opened'|'store'|'unavailable'>}
 */
export async function openGameOrStore(game) {
  if (!game?.mobileScheme) {
    Alert.alert(
      '🖥️ PC Oyunu',
      `${game?.name ?? 'Bu oyun'} yalnızca PC'de oynanabilir. Bilgisayarından açabilirsin!`,
      [{ text: 'Tamam' }],
    );
    return 'unavailable';
  }

  try {
    const canOpen = await Linking.canOpenURL(game.mobileScheme);
    if (canOpen) {
      await Linking.openURL(game.mobileScheme);
      return 'opened';
    }
    const storeUrl = Platform.OS === 'android' && game.androidPackage
      ? `market://details?id=${game.androidPackage}`
      : Platform.OS === 'ios' && game.iosAppId
        ? `https://apps.apple.com/app/id${game.iosAppId}`
        : null;

    if (storeUrl) {
      await Linking.openURL(storeUrl);
      return 'store';
    }
  } catch (err) {
    console.warn('[gameDeepLinks] openGameOrStore error:', err.message);
  }
  return 'unavailable';
}
