import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, BORDER_RADIUS, SPACING } from '../constants/theme';
import { getGame, getVibe, getGroupSize, PLAY_TIMES } from '../constants/games';
import OnlineDot from './OnlineDot';
import VibeBadge from './VibeBadge';

const REPORT_REASONS = [
  'Toxic davranış',
  'Spam',
  'Uygunsuz içerik',
  'Sahte profil',
  'Diğer',
];

export default function PlayerCard({ player, onInvite, isInvited = false, onBlock, onReport, onAddFriend, onViewProfile, isFriend = false, isPendingFriend = false }) {
  const [loading, setLoading] = useState(false);
  const [friendAdded, setFriendAdded] = useState(false); // optimistic
  const game = getGame(player.gameId);
  const vibe = getVibe(player.vibe);
  const groupSize = getGroupSize(player.lookingFor);
  const effectiveIsFriend = isFriend || friendAdded;
  const effectiveIsPending = isPendingFriend && !effectiveIsFriend;

  const handleInvite = async () => {
    if (isInvited || loading) return;
    setLoading(true);
    try {
      await onInvite?.(player);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (effectiveIsFriend || effectiveIsPending) return;
    setFriendAdded(true); // optimistic
    try {
      await onAddFriend?.(player);
    } catch {
      setFriendAdded(false);
    }
  };

  const handleMore = () => {
    if (player.isSeed) return; // seed profilleri engellenemez

    const friendOption = effectiveIsFriend
      ? { text: '✓ Arkadaşsın', style: 'default', onPress: () => {} }
      : effectiveIsPending
      ? { text: '⏳ İstek Gönderildi', style: 'default', onPress: () => {} }
      : { text: '👋 Arkadaş Ekle', onPress: handleAddFriend };

    Alert.alert(
      player.username,
      'Bu oyuncu hakkında ne yapmak istersin?',
      [
        friendOption,
        {
          text: '🚫 Engelle',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Kullanıcıyı Engelle',
              `${player.username} engellensin mi? Listende bir daha görünmeyecek.`,
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Engelle', style: 'destructive', onPress: () => onBlock?.(player) },
              ],
            ),
        },
        {
          text: '⚠️ Şikayet Et',
          onPress: () => showReportSheet(),
        },
        { text: 'İptal', style: 'cancel' },
      ],
    );
  };

  const showReportSheet = () => {
    Alert.alert(
      'Şikayet Sebebi',
      'Şikayet sebebini seç:',
      [
        ...REPORT_REASONS.map((reason) => ({
          text: reason,
          onPress: () =>
            Alert.alert(
              'Şikayet Gönderildi',
              `${player.username} "${reason}" sebebiyle şikayet edildi. İncelemeye alınacak.`,
              [{ text: 'Tamam' }],
              { onDismiss: () => onReport?.(player, reason) },
            ),
        })),
        { text: 'İptal', style: 'cancel' },
      ],
    );
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

      {/* Avatar + Info — tıklanınca profil açılır */}
      <TouchableOpacity
        activeOpacity={onViewProfile ? 0.75 : 1}
        onPress={() => onViewProfile?.(player)}
        style={styles.infoTouchable}
      >
        {/* Avatar — real photo if available, else game emoji */}
        <View style={[styles.avatar, { backgroundColor: `${gameColor}25`, borderColor: `${gameColor}55` }]}>
          {player.photoURL ? (
            <Image source={{ uri: player.photoURL }} style={styles.avatarPhoto} />
          ) : (
            <Text style={styles.avatarEmoji}>{game?.emoji ?? '🎮'}</Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.username} numberOfLines={1}>{player.username}</Text>
            <OnlineDot isOnline={player.isOnline} size={8} />
            {effectiveIsFriend && (
              <View style={styles.friendBadge}>
                <Text style={styles.friendBadgeText}>👥</Text>
              </View>
            )}
          </View>

          <Text style={styles.meta}>
            <Text style={{ color: gameColor }}>{game?.name ?? player.gameId}</Text>
            {'  •  '}
            <Text style={{ color: COLORS.textSecondary }}>{player.rank}</Text>
            {player.server ? (
              <Text style={{ color: COLORS.textMuted }}>{'  •  '}{player.server}</Text>
            ) : player.region ? (
              <Text style={{ color: COLORS.textMuted }}>{'  •  '}{player.region}</Text>
            ) : null}
          </Text>

          {player.nickname ? (
            <Text style={styles.nickname}>🎮 {player.nickname}</Text>
          ) : null}

          {player.kd && (
            <Text style={styles.kd}>K/D <Text style={{ color: COLORS.primary }}>{player.kd}</Text></Text>
          )}

          <View style={styles.bottomRow}>
            <VibeBadge vibeId={player.vibe} size="sm" />
            {groupSize && (
              <View style={styles.groupBadge}>
                <Text style={styles.groupBadgeText}>{groupSize.emoji} {groupSize.label}</Text>
              </View>
            )}
            {/* Trust score — only show if rated 3+ times */}
            {player.ratingCount >= 3 && (
              <View style={styles.trustBadge}>
                <Text style={styles.trustText}>⭐ {player.trustScore?.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {/* Play time badges */}
          {player.playTimes?.length > 0 && (
            <View style={styles.playTimeRow}>
              {player.playTimes.slice(0, 3).map((id) => {
                const pt = PLAY_TIMES.find((p) => p.id === id);
                if (!pt) return null;
                return (
                  <View key={id} style={[styles.playTimeBadge, { borderColor: `${pt.color}55`, backgroundColor: `${pt.color}15` }]}>
                    <Text style={styles.playTimeBadgeText}>{pt.emoji} {pt.label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Sağ taraf: ⋯ + Invite */}
      <View style={styles.actions}>
        {!player.isSeed && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleMore}
            style={styles.moreBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.moreBtnText}>⋯</Text>
          </TouchableOpacity>
        )}

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
              {isInvited ? 'GÖNDERİLDİ' : 'DAVET'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  infoTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  avatarPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
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
  nickname: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  kd: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  actions: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingRight: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  moreBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  moreBtnText: {
    fontSize: 18,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  inviteBtn: {
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
    fontSize: 9,
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  invitedBtnText: {
    color: COLORS.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  groupBadge: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  groupBadgeText: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  friendBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
  },
  friendBadgeText: {
    fontSize: 10,
  },
  trustBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
  },
  trustText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 9,
    color: '#F59E0B',
    letterSpacing: 0.3,
  },
  playTimeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  playTimeBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
  },
  playTimeBadgeText: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});
