import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, BORDER_RADIUS, SPACING } from '../constants/theme';

export default function GameCard({ game, onPress, isSelected = false }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress?.(game)}
      style={[styles.card, isSelected && { borderColor: game.color }]}
    >
      <LinearGradient
        colors={[`${game.color}22`, `${game.color}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: game.color }]} />

      <View style={styles.content}>
        <Text style={styles.emoji}>{game.emoji}</Text>
        <Text style={[styles.name, isSelected && { color: game.color }]}>{game.name}</Text>
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: `${game.color}33`, borderColor: `${game.color}66` }]}>
            <Text style={[styles.selectedText, { color: game.color }]}>SELECTED</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 130,
    height: 90,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: {
    width: 3,
    height: '100%',
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  content: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 24,
  },
  name: {
    fontFamily: FONTS.rajdhani.semiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  selectedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
  },
  selectedText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 7,
    letterSpacing: 0.5,
  },
});
