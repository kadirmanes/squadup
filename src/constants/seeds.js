import { GAMES, VIBES, REGIONS } from './games';

const SEED_USERNAMES = [
  'xShadow_EU', 'ProAim99', 'NightWolf_TR', 'TacticalGod', 'LegendAce',
  'CoolBreeze', 'ViperMain', 'FlashPoint', 'EcoRound', 'AimLab_Pro',
  'SilentKiller', 'RankGrinder', 'ChillVibes', 'LearnMode', 'GoldPeek',
  'CryptoFrags', 'NanoAim', 'VoidWalker', 'EchoStrike', 'PhantomAce',
  'BladeRunner99', 'NeonHunter', 'DarkMatter', 'CyberStrike', 'QuantumFrag',
  'SteelWolf', 'IronGhost', 'NightOwl_NA', 'ShadowByte', 'CryptoAce',
  'HyperFrag', 'StormRider', 'LiquidAim', 'MetalHead', 'FrostByte',
  'TurboShot', 'ZeroGrav', 'PlasmaGun', 'CosmicFrag', 'NebulaDrift',
  'PulseStrike', 'FluxCapacitor', 'OmegaKill', 'AlphaWave', 'BetaTest99',
  'GammaBurst', 'DeltaForce9', 'EpsilonAim', 'ZetaSniper', 'EtaMaster',
  'ThetaChamp', 'IotaPlayer', 'KappaPro', 'LambdaAce', 'MuGamer',
  'NuStrike', 'XiWarlord', 'OmicronElite', 'PiShooter', 'RhoCrusher',
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateKD() {
  return (Math.random() * 2 + 0.5).toFixed(2);
}

export function generateSeedProfiles() {
  const profiles = [];
  let usernameIndex = 0;

  GAMES.forEach((game) => {
    for (let i = 0; i < 12; i++) {
      const vibe = getRandomItem(VIBES);
      const rank = getRandomItem(game.ranks);
      const region = getRandomItem(REGIONS);
      const username = SEED_USERNAMES[usernameIndex % SEED_USERNAMES.length];
      usernameIndex++;

      profiles.push({
        uid: `seed_${game.id}_${String(i + 1).padStart(2, '0')}`,
        username,
        gameId: game.id,
        rank,
        region: region.id,
        vibe: vibe.id,
        isOnline: Math.random() > 0.4,
        isSeed: true,
        kd: generateKD(),
        createdAt: new Date(),
      });
    }
  });

  return profiles;
}
