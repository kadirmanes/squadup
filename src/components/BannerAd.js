import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS } from '../constants/theme';

// AdMob banner placeholder — styled to match app design.
// For production integration with real ads, see src/services/admobService.js
// and follow the EAS Build + react-native-google-mobile-ads setup guide.

export default function BannerAd({ style }) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.inner}>
        <Text style={styles.adLabel}>AD</Text>
        <Text style={styles.adText}>Your advertisement here</Text>
        <Text style={styles.adSub}>Powered by Google AdMob</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  adLabel: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 9,
    color: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.xs,
    letterSpacing: 1,
  },
  adText: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  adSub: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
