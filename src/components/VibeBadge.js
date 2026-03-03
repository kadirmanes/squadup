import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getVibe } from '../constants/games';
import { COLORS, FONTS, BORDER_RADIUS, SPACING } from '../constants/theme';

export default function VibeBadge({ vibeId, size = 'md' }) {
  const vibe = getVibe(vibeId);
  if (!vibe) return null;

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${vibe.color}22`, borderColor: `${vibe.color}55` },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text style={[styles.emoji, isSmall && styles.emojiSmall]}>{vibe.emoji}</Text>
      <Text style={[styles.label, { color: vibe.color }, isSmall && styles.labelSmall]}>
        {vibe.label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  emoji: {
    fontSize: 14,
  },
  emojiSmall: {
    fontSize: 11,
  },
  label: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 10,
  },
});
