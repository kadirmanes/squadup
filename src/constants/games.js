export const GAMES = [
  {
    id: 'valorant',
    name: 'Valorant',
    emoji: '🎯',
    color: '#FF4655',
    colorDim: 'rgba(255,70,85,0.15)',
    ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
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
  },
  {
    id: 'lol',
    name: 'League of Legends',
    emoji: '⚔️',
    color: '#C89B3C',
    colorDim: 'rgba(200,155,60,0.15)',
    ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
  },
  {
    id: 'fifa',
    name: 'EA FC 25',
    emoji: '⚽',
    color: '#00D084',
    colorDim: 'rgba(0,208,132,0.15)',
    ranks: ['Division 10', 'Division 9', 'Division 8', 'Division 7', 'Division 6', 'Division 5', 'Division 4', 'Division 3', 'Division 2', 'Division 1', 'Elite'],
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    emoji: '🏗️',
    color: '#9B59B6',
    colorDim: 'rgba(155,89,182,0.15)',
    ranks: ['Open', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Champions', 'Unreal'],
  },
];

export const VIBES = [
  { id: 'tryhard', emoji: '😤', label: 'Tryhard', sublabel: 'Rank çıkmak', color: '#FF4444' },
  { id: 'chill', emoji: '😂', label: 'Chill', sublabel: 'Eğlenmek', color: '#00D084' },
  { id: 'learn', emoji: '🎓', label: 'Learn', sublabel: 'Gelişmek', color: '#0094FF' },
  { id: 'silent', emoji: '🔥', label: 'Silent', sublabel: 'Sessiz kazan', color: '#FF8C00' },
];

export const REGIONS = [
  { id: 'EU', label: 'Europe', flag: '🇪🇺' },
  { id: 'TR', label: 'Turkey', flag: '🇹🇷' },
  { id: 'NA', label: 'North America', flag: '🇺🇸' },
  { id: 'ASIA', label: 'Asia', flag: '🌏' },
];

export const getGame = (gameId) => GAMES.find((g) => g.id === gameId) || null;
export const getVibe = (vibeId) => VIBES.find((v) => v.id === vibeId) || null;
export const getRegion = (regionId) => REGIONS.find((r) => r.id === regionId) || null;
