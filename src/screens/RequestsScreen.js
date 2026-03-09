import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { respondToRequest, respondToFriendRequest, getUser } from '../services/firestoreService';
import { createOrGetChat } from '../services/chatService';
import { sendPushNotification } from '../services/notificationService';
import { getGame, getVibe, openGameOrStore } from '../constants/games';
import VibeBadge from '../components/VibeBadge';
import BannerAd from '../components/BannerAd';
import ShimmerCard from '../components/ShimmerCard';

const STATUS_CONFIG = {
  pending: { label: 'BEKLİYOR', color: COLORS.warning, bg: COLORS.warningDim },
  accepted: { label: 'KABUL', color: COLORS.success, bg: COLORS.successDim },
  declined: { label: 'REDDEDİLDİ', color: COLORS.error, bg: COLORS.errorDim },
};

const TABS = ['TÜMÜ', 'GELEN', 'GİDEN', 'ARKADAŞLAR'];

export default function RequestsScreen({ navigation }) {
  const { uid } = useAuth();
  const { userProfile } = useAuth();
  const { requests, friendRequests, isLoadingRequests, pendingFriendRequestCount } = useApp();
  const [activeTab, setActiveTab] = useState('TÜMÜ');
  const [respondingId, setRespondingId] = useState(null);
  const [respondingFriendId, setRespondingFriendId] = useState(null);

  const blockedUids = useMemo(
    () => new Set(userProfile?.blockedUids ?? []),
    [userProfile?.blockedUids],
  );

  // Requests that don't involve blocked users (used for tab counts + filtered list)
  const unblockedRequests = useMemo(() => requests.filter((r) => {
    const otherUid = r.fromUid === uid ? r.toUid : r.fromUid;
    return !blockedUids.has(otherUid);
  }), [requests, uid, blockedUids]);

  const filteredRequests = useMemo(() => unblockedRequests.filter((r) => {
    if (activeTab === 'GELEN') return r.toUid === uid;
    if (activeTab === 'GİDEN') return r.fromUid === uid;
    return true;
  }), [unblockedRequests, uid, activeTab]);

  const handleRespond = useCallback(async (request, status) => {
    setRespondingId(request.id);
    try {
      await respondToRequest(request.id, status);
      if (status === 'accepted') {
        await createOrGetChat(request.fromUid, request.toUid, request.id, request.gameId);
        const sender = await getUser(request.fromUid);
        if (sender?.expoPushToken) {
          await sendPushNotification(
            sender.expoPushToken,
            '⚔️ Squad isteği kabul edildi!',
            `${userProfile?.username ?? 'Biri'} squad davetini kabul etti!`,
          );
        }
        Alert.alert(
          '⚔️ Kadro Hazır!',
          'Sohbet oluşturuldu. Kadrolar sekmesinden devam edebilirsin.',
          [
            { text: 'Tamam' },
            {
              text: "🎮 KADROLAR'A GİT",
              onPress: () => navigation.navigate('Squads'),
            },
          ],
        );
      }
    } catch (err) {
      console.error('[RequestsScreen] handleRespond error:', err?.message ?? err);
      Alert.alert('Hata', 'İşlem başarısız. Tekrar dene.');
    } finally {
      setRespondingId(null);
    }
  }, [userProfile, navigation]);

  const handleFriendRespond = useCallback(async (request, status) => {
    setRespondingFriendId(request.id);
    try {
      await respondToFriendRequest(request.id, status, request.fromUid, request.toUid);
      if (status === 'accepted') {
        const sender = await getUser(request.fromUid);
        if (sender?.expoPushToken) {
          await sendPushNotification(
            sender.expoPushToken,
            '👥 Arkadaşlık İsteği Kabul Edildi!',
            `${userProfile?.username ?? 'Biri'} arkadaşlık isteğini kabul etti!`,
          );
        }
      }
    } catch (err) {
      Alert.alert('Hata', 'İşlem başarısız. Tekrar dene.');
    } finally {
      setRespondingFriendId(null);
    }
  }, [userProfile]);

  const renderItem = useCallback(({ item }) => (
    <RequestCard
      request={item}
      uid={uid}
      onRespond={handleRespond}
      isResponding={respondingId === item.id}
    />
  ), [uid, handleRespond, respondingId]);

  const renderFriendItem = useCallback(({ item }) => (
    <FriendRequestCard
      request={item}
      uid={uid}
      onRespond={handleFriendRespond}
      isResponding={respondingFriendId === item.id}
    />
  ), [uid, handleFriendRespond, respondingFriendId]);

  const keyExtractor = useCallback((item) => item.id, []);

  const showFriendsTab = activeTab === 'ARKADAŞLAR';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>İSTEKLER</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            let count;
            if (tab === 'ARKADAŞLAR') {
              count = pendingFriendRequestCount;
            } else if (tab === 'TÜMÜ') {
              count = unblockedRequests.length;
            } else if (tab === 'GELEN') {
              count = unblockedRequests.filter((r) => r.toUid === uid).length;
            } else {
              count = unblockedRequests.filter((r) => r.fromUid === uid).length;
            }

            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.75}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.divider} />
      </SafeAreaView>

      {showFriendsTab ? (
        friendRequests.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <FlatList
            data={friendRequests}
            renderItem={renderFriendItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : isLoadingRequests ? (
        <View style={styles.shimmerList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerCard key={i} height={100} style={{ marginBottom: 10 }} />
          ))}
        </View>
      ) : filteredRequests.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BannerAd />
    </View>
  );
}

// ── Request Card ──────────────────────────────────────────────────────────────

function RequestCard({ request, uid, onRespond, isResponding }) {
  const isReceived = request.toUid === uid;
  const isSent = request.fromUid === uid;
  const game = getGame(request.gameId);
  const statusCfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending;

  const otherUid = isReceived ? request.fromUid : request.toUid;
  const [otherUsername, setOtherUsername] = React.useState(otherUid?.slice(0, 8) ?? '...');

  React.useEffect(() => {
    if (!otherUid || otherUid.startsWith('seed_')) {
      setOtherUsername(otherUid?.replace('seed_', '').replace(/_\d+$/, '') ?? 'SeedPlayer');
      return;
    }
    getUser(otherUid).then((u) => {
      if (u?.username) setOtherUsername(u.username);
    }).catch(() => {});
  }, [otherUid]);

  return (
    <View style={styles.card}>
      {/* Direction indicator */}
      <View style={[styles.directionBadge, isReceived ? styles.receivedBadge : styles.sentBadge]}>
        <Text style={[styles.directionText, isReceived ? { color: COLORS.secondary } : { color: COLORS.primary }]}>
          {isReceived ? '↓ GELEN' : '↑ GİDEN'}
        </Text>
      </View>

      <View style={styles.cardTop}>
        {/* Game avatar */}
        <View style={[styles.avatar, { backgroundColor: `${game?.color ?? COLORS.primary}22`, borderColor: `${game?.color ?? COLORS.primary}55` }]}>
          <Text style={{ fontSize: 22 }}>{game?.emoji ?? '🎮'}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.username}>{otherUsername}</Text>
          <Text style={styles.gameName}>{game?.name ?? request.gameId}</Text>
          <VibeBadge vibeId={request.vibe} size="sm" />
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: `${statusCfg.color}55` }]}>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* Accept / Decline for received pending requests */}
      {isReceived && request.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onRespond(request, 'declined')}
            disabled={isResponding}
            style={[styles.actionBtn, styles.declineBtn]}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <Text style={[styles.actionBtnText, { color: COLORS.error }]}>✕ REDDET</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onRespond(request, 'accepted')}
            disabled={isResponding}
            style={[styles.actionBtn, styles.acceptBtn]}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color={COLORS.success} />
            ) : (
              <Text style={[styles.actionBtnText, { color: COLORS.success }]}>✓ KABUL ET</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 🎮 Oyunu Aç — kabul edilmiş isteklerde göster */}
      {request.status === 'accepted' && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openGameOrStore(game)}
          style={styles.openGameBtn}
        >
          <Text style={styles.openGameBtnText}>
            {game?.mobileScheme ? `▶ ${(game.name).toUpperCase()} AÇ` : `🖥️ PC OYUNU`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Timestamp */}
      {request.createdAt && (
        <Text style={styles.timestamp}>
          {formatTimestamp(request.createdAt)}
        </Text>
      )}
    </View>
  );
}

function formatTimestamp(ts) {
  try {
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    return date.toLocaleDateString('tr-TR');
  } catch {
    return '';
  }
}

// ── Friend Request Card ───────────────────────────────────────────────────────

function FriendRequestCard({ request, uid, onRespond, isResponding }) {
  const isReceived = request.toUid === uid;
  const otherUid = isReceived ? request.fromUid : request.toUid;
  const [otherUsername, setOtherUsername] = React.useState(otherUid?.slice(0, 8) ?? '...');

  React.useEffect(() => {
    if (!otherUid) return;
    getUser(otherUid).then((u) => {
      if (u?.username) setOtherUsername(u.username);
    }).catch(() => {});
  }, [otherUid]);

  const statusCfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending;

  return (
    <View style={styles.card}>
      <View style={[styles.directionBadge, isReceived ? styles.receivedBadge : styles.sentBadge]}>
        <Text style={[styles.directionText, isReceived ? { color: COLORS.secondary } : { color: COLORS.primary }]}>
          {isReceived ? '↓ ARKADAŞLIK GELDİ' : '↑ ARKADAŞLIK GİTTİ'}
        </Text>
      </View>

      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.35)' }]}>
          <Text style={{ fontSize: 22 }}>👥</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.username}>{otherUsername}</Text>
          <Text style={styles.gameName}>Arkadaşlık isteği</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: `${statusCfg.color}55` }]}>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {isReceived && request.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onRespond(request, 'declined')}
            disabled={isResponding}
            style={[styles.actionBtn, styles.declineBtn]}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <Text style={[styles.actionBtnText, { color: COLORS.error }]}>✕ REDDET</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onRespond(request, 'accepted')}
            disabled={isResponding}
            style={[styles.actionBtn, styles.acceptBtn]}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color={COLORS.success} />
            ) : (
              <Text style={[styles.actionBtnText, { color: COLORS.success }]}>👥 KABUL ET</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {request.status === 'accepted' && (
        <View style={styles.friendAcceptedRow}>
          <Text style={styles.friendAcceptedText}>🎉 Artık arkadaşsınız!</Text>
        </View>
      )}

      {request.createdAt && (
        <Text style={styles.timestamp}>{formatTimestamp(request.createdAt)}</Text>
      )}
    </View>
  );
}

function EmptyState({ tab }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{tab === 'ARKADAŞLAR' ? '👥' : '📭'}</Text>
      <Text style={styles.emptyTitle}>{tab === 'ARKADAŞLAR' ? 'ARKADAŞ YOK' : 'İSTEK YOK'}</Text>
      <Text style={styles.emptyDesc}>
        {tab === 'ARKADAŞLAR'
          ? 'Henüz arkadaşın yok. Kadro Bul\'da oyunculara arkadaşlık isteği gönder!'
          : tab === 'GELEN'
          ? 'Henüz seni davet eden olmadı. Profilini tamamladığından emin ol!'
          : tab === 'GİDEN'
          ? 'Henüz davet göndermedin. Kadro bul ekranına git!'
          : 'Hiç eşleşme isteğin yok. Kadro Bul\'a git ve bağlantı kur.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontFamily: FONTS.orbitron.extraBold,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primaryDim,
  },
  tabText: {
    fontFamily: FONTS.orbitron.semiBold,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabBadge: {
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  tabBadgeText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  tabBadgeTextActive: {
    color: COLORS.background,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginTop: SPACING.xs },
  shimmerList: { padding: SPACING.md },
  list: { padding: SPACING.md, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 10,
    gap: SPACING.sm,
  },
  directionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
  },
  receivedBadge: {
    backgroundColor: COLORS.secondaryDim,
    borderColor: `${COLORS.secondary}44`,
  },
  sentBadge: {
    backgroundColor: COLORS.primaryDim,
    borderColor: `${COLORS.primary}44`,
  },
  directionText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  username: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  gameName: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: COLORS.errorDim,
    borderColor: `${COLORS.error}55`,
  },
  acceptBtn: {
    backgroundColor: COLORS.successDim,
    borderColor: `${COLORS.success}55`,
  },
  actionBtnText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 11,
    letterSpacing: 1,
  },
  openGameBtn: {
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  openGameBtnText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 11,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  timestamp: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.sm },
  emptyTitle: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 18,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  emptyDesc: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  friendAcceptedRow: {
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  friendAcceptedText: {
    fontFamily: FONTS.rajdhani.semiBold,
    fontSize: 13,
    color: COLORS.success,
  },
});
