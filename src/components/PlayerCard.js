import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, BORDER_RADIUS, SPACING } from '../constants/theme';
import { getGame, getVibe } from '../constants/games';
import OnlineDot from './OnlineDot';
import VibeBadge from './VibeBadge';

export default function PlayerCard({ player, onInvite, isInvited = false }) {
  const [loading, setLoading] = useState(false);
  const game = getGame(player.gameId);
  const vibe = getVibe(player.vibe);

  const handleInvite = async () => {
    if (isInvited || loading) return;
    setLoading(true);
    try {
      await onInvite?.(player);
    } finally {
      setLoading(false);
    }
  };

  const gameColor = game?.color ?? COLORS.primary;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[`${gameColor}12`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: gameColor }]} />

      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: `${gameColor}25`, borderColor: `${gameColor}55` }]}>
        <Text style={styles.avatarEmoji}>{game?.emoji ?? '🎮'}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.username} numberOfLines={1}>{player.username}</Text>
          <OnlineDot isOnline={player.isOnline} size={8} />
        </View>

        <Text style={styles.meta}>
          <Text style={{ color: gameColor }}>{game?.name ?? player.gameId}</Text>
          {'  •  '}
          <Text style={{ color: COLORS.textSecondary }}>{player.rank}</Text>
          {'  •  '}
          <Text style={{ color: COLORS.textMuted }}>{player.region}</Text>
        </Text>

        {player.kd && (
          <Text style={styles.kd}>K/D <Text style={{ color: COLORS.primary }}>{player.kd}</Text></Text>
        )}

        <VibeBadge vibeId={player.vibe} size="sm" />
      </View>

      {/* Invite button */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={handleInvite}
        disabled={isInvited || loading}
        style={[
          styles.inviteBtn,
          isInvited
            ? styles.invitedBtn
            : { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primary },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Text style={[styles.inviteBtnText, isInvited && styles.invitedBtnText]}>
            {isInvited ? 'SENT' : 'INVITE'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    overflow: 'hidden',
    minHeight: 88,
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.sm,
    flexShrink: 0,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.xs,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
    flex: 1,
  },
  meta: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  kd: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  inviteBtn: {
    marginRight: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitedBtn: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  inviteBtnText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  invitedBtnText: {
    color: COLORS.textMuted,
  },
});
