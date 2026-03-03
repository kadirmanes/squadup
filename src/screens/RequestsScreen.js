import React, { useState, useCallback } from 'react';
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
import { respondToRequest, getUser } from '../services/firestoreService';
import { getGame, getVibe } from '../constants/games';
import VibeBadge from '../components/VibeBadge';
import BannerAd from '../components/BannerAd';
import ShimmerCard from '../components/ShimmerCard';

const STATUS_CONFIG = {
  pending: { label: 'PENDING', color: COLORS.warning, bg: COLORS.warningDim },
  accepted: { label: 'ACCEPTED', color: COLORS.success, bg: COLORS.successDim },
  declined: { label: 'DECLINED', color: COLORS.error, bg: COLORS.errorDim },
};

const TABS = ['ALL', 'RECEIVED', 'SENT'];

export default function RequestsScreen() {
  const { uid } = useAuth();
  const { requests, isLoadingRequests } = useApp();
  const [activeTab, setActiveTab] = useState('ALL');
  const [respondingId, setRespondingId] = useState(null);

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'RECEIVED') return r.toUid === uid;
    if (activeTab === 'SENT') return r.fromUid === uid;
    return true;
  });

  const handleRespond = useCallback(async (requestId, status) => {
    setRespondingId(requestId);
    try {
      await respondToRequest(requestId, status);
    } catch (err) {
      Alert.alert('Error', 'Failed to respond. Please try again.');
    } finally {
      setRespondingId(null);
    }
  }, []);

  const renderItem = useCallback(({ item }) => (
    <RequestCard
      request={item}
      uid={uid}
      onRespond={handleRespond}
      isResponding={respondingId === item.id}
    />
  ), [uid, handleRespond, respondingId]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>REQUESTS</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const count = tab === 'ALL'
              ? requests.length
              : tab === 'RECEIVED'
              ? requests.filter((r) => r.toUid === uid).length
              : requests.filter((r) => r.fromUid === uid).length;

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

      {isLoadingRequests ? (
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
          {isReceived ? '↓ RECEIVED' : '↑ SENT'}
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
            onPress={() => onRespond(request.id, 'declined')}
            disabled={isResponding}
            style={[styles.actionBtn, styles.declineBtn]}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <Text style={[styles.actionBtnText, { color: COLORS.error }]}>✕ DECLINE</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onRespond(request.id, 'accepted')}
            disabled={isResponding}
            style={[styles.actionBtn, styles.acceptBtn]}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color={COLORS.success} />
            ) : (
              <Text style={[styles.actionBtnText, { color: COLORS.success }]}>✓ ACCEPT</Text>
            )}
          </TouchableOpacity>
        </View>
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
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

function EmptyState({ tab }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>NO REQUESTS YET</Text>
      <Text style={styles.emptyDesc}>
        {tab === 'RECEIVED'
          ? 'No one has invited you yet. Make sure your profile is set up!'
          : tab === 'SENT'
          ? 'You haven\'t sent any invites yet. Go find a squad!'
          : 'You have no match requests. Head to Find Squad to start connecting.'}
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
});
