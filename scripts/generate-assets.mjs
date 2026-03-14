import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { mkdirSync } from 'fs';

mkdirSync('./scripts', { recursive: true });

// SquadUp brand colors
const BG = '#080B12';
const PRIMARY = '#6366F1';
const WHITE = '#FFFFFF';

// SVG icon — controller + "SU" mark on dark background
function makeIconSVG(size) {
  const r = Math.round(size * 0.18); // corner radius
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F1320;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#080B12;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#818CF8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4F46E5;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)"/>

  <!-- Outer glow ring -->
  <rect x="${size*0.08}" y="${size*0.08}" width="${size*0.84}" height="${size*0.84}"
    rx="${r*0.8}" ry="${r*0.8}" fill="none" stroke="${PRIMARY}" stroke-width="${size*0.025}" opacity="0.3"/>

  <!-- Controller body -->
  <g transform="translate(${size*0.5}, ${size*0.48})">
    <!-- Main body -->
    <ellipse cx="0" cy="0" rx="${size*0.32}" ry="${size*0.2}" fill="url(#glow)" opacity="0.15"/>
    <ellipse cx="0" cy="0" rx="${size*0.30}" ry="${size*0.18}" fill="url(#glow)"/>

    <!-- Left handle -->
    <ellipse cx="${-size*0.20}" cy="${size*0.12}" rx="${size*0.10}" ry="${size*0.14}" fill="url(#glow)"/>
    <!-- Right handle -->
    <ellipse cx="${size*0.20}" cy="${size*0.12}" rx="${size*0.10}" ry="${size*0.14}" fill="url(#glow)"/>

    <!-- D-pad left -->
    <rect x="${-size*0.36}" y="${-size*0.025}" width="${size*0.14}" height="${size*0.05}" rx="${size*0.01}" fill="${WHITE}" opacity="0.9"/>
    <rect x="${-size*0.315}" y="${-size*0.07}" width="${size*0.05}" height="${size*0.14}" rx="${size*0.01}" fill="${WHITE}" opacity="0.9"/>

    <!-- Buttons right -->
    <circle cx="${size*0.28}" cy="${-size*0.04}" r="${size*0.035}" fill="#EC4899" opacity="0.9"/>
    <circle cx="${size*0.32}" cy="${size*0.02}" r="${size*0.035}" fill="#F59E0B" opacity="0.9"/>
    <circle cx="${size*0.24}" cy="${size*0.02}" r="${size*0.035}" fill="#10B981" opacity="0.9"/>
    <circle cx="${size*0.28}" cy="${size*0.08}" r="${size*0.035}" fill="#60A5FA" opacity="0.9"/>

    <!-- Center dot / logo mark -->
    <circle cx="0" cy="0" r="${size*0.05}" fill="${WHITE}" opacity="0.2"/>
    <circle cx="0" cy="0" r="${size*0.03}" fill="${WHITE}" opacity="0.8"/>
  </g>

  <!-- "SQUAD" text bottom -->
  <text x="${size*0.5}" y="${size*0.82}"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="${size*0.11}"
    fill="${WHITE}"
    text-anchor="middle"
    letter-spacing="${size*0.008}">SQUAD</text>
  <text x="${size*0.5}" y="${size*0.93}"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="${size*0.07}"
    fill="${PRIMARY}"
    text-anchor="middle"
    letter-spacing="${size*0.015}">UP</text>
</svg>`;
}

// Feature graphic SVG (1024x500)
function makeFeatureSVG() {
  return `<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fbg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A0E1A"/>
      <stop offset="100%" style="stop-color:#080B12"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6366F1"/>
      <stop offset="100%" style="stop-color:#8B5CF6"/>
    </linearGradient>
  </defs>

  <rect width="1024" height="500" fill="url(#fbg)"/>

  <!-- Grid lines -->
  <line x1="0" y1="100" x2="1024" y2="100" stroke="#6366F1" stroke-width="0.5" opacity="0.1"/>
  <line x1="0" y1="200" x2="1024" y2="200" stroke="#6366F1" stroke-width="0.5" opacity="0.1"/>
  <line x1="0" y1="300" x2="1024" y2="300" stroke="#6366F1" stroke-width="0.5" opacity="0.1"/>
  <line x1="0" y1="400" x2="1024" y2="400" stroke="#6366F1" stroke-width="0.5" opacity="0.1"/>
  <line x1="200" y1="0" x2="200" y2="500" stroke="#6366F1" stroke-width="0.5" opacity="0.1"/>
  <line x1="400" y1="0" x2="400" y2="500" stroke="#6366F1" stroke-width="0.5" opacity="0.1"/>
  <line x1="600" y1="0" x2="600" y2="500" stroke="#6366F1" stroke-width="0.5" opacity="0.1"/>
  <line x1="800" y1="0" x2="800" y2="500" stroke="#6366F1" stroke-width="0.5" opacity="0.1"/>

  <!-- Glow circle -->
  <circle cx="512" cy="250" r="300" fill="#6366F1" opacity="0.04"/>
  <circle cx="512" cy="250" r="180" fill="#6366F1" opacity="0.06"/>

  <!-- Accent bar -->
  <rect x="362" y="310" width="300" height="4" rx="2" fill="url(#accent)" opacity="0.8"/>

  <!-- Main title -->
  <text x="512" y="220"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900" font-size="96"
    fill="white" text-anchor="middle" letter-spacing="4">SQUADUP</text>

  <!-- Tagline -->
  <text x="512" y="290"
    font-family="Arial, sans-serif"
    font-size="28" fill="#A5B4FC"
    text-anchor="middle" letter-spacing="6">FIND YOUR SQUAD · PLAY TOGETHER</text>

  <!-- Bottom icons -->
  <text x="512" y="390" font-size="32" text-anchor="middle">🎮  👥  🔗  💬</text>
</svg>`;
}

// Splash screen SVG (1284x2778)
function makeSplashSVG() {
  return `<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <rect width="1284" height="2778" fill="#080B12"/>
  <circle cx="642" cy="1389" r="500" fill="#6366F1" opacity="0.05"/>
  <circle cx="642" cy="1389" r="300" fill="#6366F1" opacity="0.08"/>
  <text x="642" y="1320"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900" font-size="140"
    fill="white" text-anchor="middle" letter-spacing="6">SQUAD</text>
  <text x="642" y="1460"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900" font-size="90"
    fill="#6366F1" text-anchor="middle" letter-spacing="20">UP</text>
</svg>`;
}

async function generate() {
  console.log('🎨 Generating SquadUp assets...');

  // icon.png - 1024x1024
  await sharp(Buffer.from(makeIconSVG(1024)))
    .png()
    .toFile('./assets/icon.png');
  console.log('✅ icon.png (1024x1024)');

  // adaptive-icon.png - 1024x1024 (foreground, no bg)
  await sharp(Buffer.from(makeIconSVG(1024)))
    .png()
    .toFile('./assets/adaptive-icon.png');
  console.log('✅ adaptive-icon.png (1024x1024)');

  // favicon.png - 48x48
  await sharp(Buffer.from(makeIconSVG(1024)))
    .resize(48, 48)
    .png()
    .toFile('./assets/favicon.png');
  console.log('✅ favicon.png (48x48)');

  // splash.png
  await sharp(Buffer.from(makeSplashSVG()))
    .png()
    .toFile('./assets/splash.png');
  console.log('✅ splash.png (1284x2778)');

  // feature-graphic.png - 1024x500 (for Play Store)
  await sharp(Buffer.from(makeFeatureSVG()))
    .png()
    .toFile('./assets/feature-graphic.png');
  console.log('✅ feature-graphic.png (1024x500)');

  // play-store-icon.png - 512x512
  await sharp(Buffer.from(makeIconSVG(512)))
    .resize(512, 512)
    .png()
    .toFile('./assets/play-store-icon.png');
  console.log('✅ play-store-icon.png (512x512)');

  console.log('\n🚀 All assets generated in ./assets/');
}

generate().catch(console.error);
