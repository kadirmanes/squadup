import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { getGame, getVibe, getGroupSize, PLAY_TIMES } from '../constants/games';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  sendMatchRequest,
  blockUser,
  reportUser,
  sendFriendRequest,
} from '../services/firestoreService';
import { sendPushNotification } from '../services/notificationService';
import { seedProfileService } from '../services/seedProfileService';
import OnlineDot from '../components/OnlineDot';
import VibeBadge from '../components/VibeBadge';

const REPORT_REASONS = [
  'Toxic davranış',
  'Spam',
  'Uygunsuz içerik',
  'Sahte profil',
  'Diğer',
];

export default function PlayerProfileScreen({ route, navigation }) {
  const { player } = route.params;
  const { uid, userProfile } = useAuth();
  const { friendUids, pendingFriendUids } = useApp();

  const [isInvited, setIsInvited] = useState(false);
  const [friendAdded, setFriendAdded] = useState(false);

  const game = getGame(player.gameId);
  const vibe = getVibe(player.vibe);
  const groupSize = getGroupSize(player.lookingFor);
  const isFriend = friendUids.has(player.uid) || friendAdded;
  const isPendingFriend = pendingFriendUids.has(player.uid) && !isFriend;
  const gameColor = game?.color ?? COLORS.primary;

  const handleInvite = useCallback(async () => {
    if (!uid || isInvited) return;

    const myGameIds = userProfile?.gameIds ?? userProfile?.games?.map((g) => g.gameId) ?? [];
    if (!myGameIds.includes(player.gameId)) {
      Alert.alert(
        'Oyun Eşleşmedi',
        'Bu oyunu profiline eklemeden davet gönderemezsin.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Profile Git', onPress: () => navigation.navigate('Profile') },
        ],
      );
      return;
    }

    try {
      const requestId = await sendMatchRequest(uid, player.uid, player.gameId);
      setIsInvited(true);

      if (player.isSeed) {
        seedProfileService.handleSeedInvite(requestId);
      } else if (player.expoPushToken) {
        await sendPushNotification(
          player.expoPushToken,
          '⚔️ New Squad Request!',
          `${userProfile?.username ?? 'Someone'} wants to squad up with you!`,
        );
      }
    } catch (err) {
      Alert.alert('Hata', 'Davet gönderilemedi: ' + err.message);
    }
  }, [uid, userProfile, player, isInvited, navigation]);

  const handleAddFriend = useCallback(async () => {
    if (!uid || isFriend || isPendingFriend) return;
    setFriendAdded(true);
    try {
      const result = await sendFriendRequest(uid, player.uid);
      if (result?.autoAccepted) {
        Alert.alert('Arkadaş!', `${player.username} ile artık arkadaşsınız! 🎉`);
      }
    } catch (err) {
      setFriendAdded(false);
      console.warn('[PlayerProfile] addFriend error:', err.message);
    }
  }, [uid, player, isFriend, isPendingFriend]);

  const handleBlock = useCallback(() => {
    Alert.alert(
      'Kullanıcıyı Engelle',
      `${player.username} engellensin mi? Listende bir daha görünmeyecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(uid, player.uid);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Hata', 'Engelleme başarısız: ' + err.message);
            }
          },
        },
      ],
    );
  }, [uid, player, navigation]);

  const handleReport = useCallback(() => {
    Alert.alert(
      'Şikayet Sebebi',
      'Şikayet sebebini seç:',
      [
        ...REPORT_REASONS.map((reason) => ({
          text: reason,
          onPress: () => {
            reportUser(uid, player.uid, reason).catch(() => {});
            Alert.alert('Şikayet Gönderildi', `${player.username} incelemeye alınacak.`);
          },
        })),
        { text: 'İptal', style: 'cancel' },
      ],
    );
  }, [uid, player]);

  const handleMore = useCallback(() => {
    if (player.isSeed) return;
    Alert.alert(player.username, 'İşlem seç:', [
      { text: '🚫 Engelle', style: 'destructive', onPress: handleBlock },
      { text: '⚠️ Şikayet Et', onPress: handleReport },
      { text: 'İptal', style: 'cancel' },
    ]);
  }, [player, handleBlock, handleReport]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {player.username}
          </Text>

          <TouchableOpacity
            onPress={!player.isSeed ? handleMore : undefined}
            style={[styles.headerBtn, player.isSeed && { opacity: 0 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.moreText}>⋯</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero Avatar ─── */}
        <LinearGradient
          colors={[`${gameColor}28`, `${gameColor}08`, 'transparent']}
          style={styles.hero}
        >
          <View style={[styles.avatarRing, { borderColor: `${gameColor}88`, backgroundColor: `${gameColor}18` }]}>
            {player.photoURL ? (
              <Image source={{ uri: player.photoURL }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarEmoji}>{game?.emoji ?? '🎮'}</Text>
            )}
          </View>

          <View style={styles.heroNameRow}>
            <Text style={styles.heroUsername}>{player.username}</Text>
            <OnlineDot isOnline={player.isOnline} size={10} />
          </View>

          {isFriend && (
            <View style={styles.friendTag}>
              <Text style={styles.friendTagText}>👥 Arkadaşın</Text>
            </View>
          )}
        </LinearGradient>

        {/* ─── Action Buttons ─── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={isInvited ? 1 : 0.8}
            onPress={handleInvite}
            disabled={isInvited}
            style={[styles.actionBtn, styles.inviteBtn, isInvited && styles.inviteBtnDone]}
          >
            <Text style={[styles.actionBtnText, isInvited && styles.actionBtnTextDone]}>
              {isInvited ? '✓ GÖNDERİLDİ' : '⚔️ DAVET ET'}
            </Text>
          </TouchableOpacity>

          {!player.isSeed && (
            <TouchableOpacity
              activeOpacity={(isFriend || isPendingFriend) ? 1 : 0.8}
              onPress={handleAddFriend}
              disabled={isFriend || isPendingFriend}
              style={[
                styles.actionBtn,
                styles.friendBtn,
                (isFriend || isPendingFriend) && styles.friendBtnDone,
              ]}
            >
              <Text style={[styles.actionBtnText, styles.friendBtnText, (isFriend || isPendingFriend) && styles.actionBtnTextDone]}>
                {isFriend ? '✓ ARKADAŞIN' : isPendingFriend ? '⏳ BEKLEMEDE' : '👋 ARKADAŞ EKLE'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Oyun Bilgisi ─── */}
        <Section title="OYUN">
          <View style={[styles.gameCard, { borderColor: `${gameColor}35` }]}>
            <View style={styles.gameNameRow}>
              <Text style={styles.gameEmoji}>{game?.emoji ?? '🎮'}</Text>
              <Text style={[styles.gameName, { color: gameColor }]}>
                {game?.name ?? player.gameId}
              </Text>
            </View>
            {player.rank     && <InfoRow label="Rank"           value={player.rank} />}
            {player.kd       && <InfoRow label="K/D"            value={String(player.kd)} highlight />}
            {player.nickname && <InfoRow label="Oyun İçi İsim"  value={player.nickname} />}
            {player.server   && <InfoRow label="Sunucu"         value={player.server} />}
            {player.region   && <InfoRow label="Bölge"          value={player.region} />}
          </View>
        </Section>

        {/* ─── Oyun Stili ─── */}
        <Section title="OYUN STİLİ">
          <View style={styles.badgeRow}>
            {vibe && <VibeBadge vibeId={player.vibe} />}
            {groupSize && (
              <View style={styles.groupBadge}>
                <Text style={styles.groupBadgeText}>{groupSize.emoji} {groupSize.label}</Text>
              </View>
            )}
            {(player.ratingCount ?? 0) >= 3 && (
              <View style={styles.trustBadge}>
                <Text style={styles.trustText}>
                  ⭐ {player.trustScore?.toFixed(1)}
                  {'  '}
                  <Text style={styles.trustCount}>({player.ratingCount} değerlendirme)</Text>
                </Text>
              </View>
            )}
          </View>
        </Section>

        {/* ─── Oynama Zamanı ─── */}
        {player.playTimes?.length > 0 && (
          <Section title="OYNAMA ZAMANI">
            <View style={styles.playTimeGrid}>
              {PLAY_TIMES.filter((pt) => player.playTimes.includes(pt.id)).map((pt) => (
                <View
                  key={pt.id}
                  style={[styles.playTimeCell, { borderColor: `${pt.color}55`, backgroundColor: `${pt.color}15` }]}
                >
                  <Text style={styles.playTimeCellEmoji}>{pt.emoji}</Text>
                  <Text style={[styles.playTimeCellLabel, { color: pt.color }]}>{pt.label}</Text>
                  <Text style={styles.playTimeCellDesc}>{pt.desc}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && { color: COLORS.primary }]}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  headerBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 32,
    color: COLORS.textSecondary,
    lineHeight: 36,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.orbitron.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  moreText: {
    fontSize: 22,
    color: COLORS.textMuted,
    letterSpacing: 2,
  },

  // Scroll
  scroll: {
    paddingBottom: SPACING.xl,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  avatarEmoji: { fontSize: 44 },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroUsername: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 24,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  friendTag: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
  },
  friendTagText: {
    fontFamily: FONTS.rajdhani.semiBold,
    fontSize: 12,
    color: COLORS.success,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  actionBtnTextDone: {
    color: COLORS.textMuted,
  },
  inviteBtn: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  inviteBtnDone: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  friendBtn: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.5)',
  },
  friendBtnText: { color: COLORS.success },
  friendBtnDone: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },

  // Section
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },

  // Game card
  gameCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  gameNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  gameEmoji: { fontSize: 22 },
  gameName: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.xs,
  },
  infoLabel: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Badge row
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  groupBadge: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  groupBadgeText: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 13,
    color: COLORS.primary,
  },
  trustBadge: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
  },
  trustText: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 13,
    color: '#F59E0B',
  },
  trustCount: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // Play times grid
  playTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  playTimeCell: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    minWidth: 80,
    gap: 2,
  },
  playTimeCellEmoji: { fontSize: 20 },
  playTimeCellLabel: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  playTimeCellDesc: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
