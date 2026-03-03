import { Platform } from 'react-native';

// AdMob test unit IDs — replace with real IDs for production
export const AD_UNIT_IDS = {
  banner: Platform.OS === 'ios'
    ? 'ca-app-pub-3940256099942544/2934735716'
    : 'ca-app-pub-3940256099942544/6300978111',
};

// AdMob is implemented as a styled placeholder for Expo Go compatibility.
// For production, integrate react-native-google-mobile-ads with EAS Build:
//   1. npm install react-native-google-mobile-ads
//   2. Add config plugin to app.json:
//      { "react-native-google-mobile-ads": { "android_app_id": "...", "ios_app_id": "..." }}
//   3. Replace BannerAd component with actual BannerAd from the package

export const isAdMobAvailable = false; // Set to true after integrating native module
