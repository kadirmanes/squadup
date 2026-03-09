import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { GAMES, VIBES, GROUP_SIZES, PLAY_TIMES } from '../constants/games';
import { useAuth } from '../context/AuthContext';
import { sendPushNotification } from '../services/notificationService';
import { useApp } from '../context/AppContext';
import { sendMatchRequest, blockUser, reportUser, sendFriendRequest } from '../services/firestoreService';
import { seedProfileService } from '../services/seedProfileService';
import PlayerCard from '../components/PlayerCard';
import ShimmerCard from '../components/ShimmerCard';
import BannerAd from '../components/BannerAd';

export default function FindSquadScreen({ route, navigation }) {
  const { uid, userProfile } = useAuth();
  const { players, isLoadingPlayers, playersError, refreshPlayers, friendUids, pendingFriendUids } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const initGame = route?.params?.filterGame ?? 'all';
  const initVibe = route?.params?.filterVibe ?? 'all';
  const [activeGame, setActiveGame] = useState(initGame);
  const [activeVibe, setActiveVibe] = useState(initVibe);
  const [activeRank, setActiveRank] = useState('all');
  const [activeLookingFor, setActiveLookingFor] = useState('all');
  const [activePlayTime, setActivePlayTime] = useState('all');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [localBlockedUids, setLocalBlockedUids] = useState(
    () => new Set(userProfile?.blockedUids ?? [])
  );

  // Reset rank filter when game changes
  const handleSetGame = useCallback((gameId) => {
    setActiveGame((prev) => {
      const next = prev === gameId ? 'all' : gameId;
      if (next !== prev) setActiveRank('all');
      return next;
    });
  }, []);

  const selectedGameDef = useMemo(
    () => (activeGame !== 'all' ? GAMES.find((g) => g.id === activeGame) : null),
    [activeGame],
  );

  // Track invited player UIDs
  const [invitedUids, setInvitedUids] = useState(new Set());

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (localBlockedUids.has(p.uid ?? p.id)) return false;
      if (activeGame !== 'all' && p.gameId !== activeGame) return false;
      if (activeVibe !== 'all' && p.vibe !== activeVibe) return false;
      if (activeRank !== 'all' && p.rank !== activeRank) return false;
      if (activeLookingFor !== 'all' && p.lookingFor !== activeLookingFor) return false;
      if (activePlayTime !== 'all' && !(p.playTimes ?? []).includes(activePlayTime)) return false;
      if (onlineOnly && !p.isOnline) return false;
      return true;
    });
  }, [players, activeGame, activeVibe, activeRank, activeLookingFor, activePlayTime, onlineOnly, localBlockedUids]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPlayers();
    setRefreshing(false);
  }, [refreshPlayers]);

  const handleBlock = useCallback(async (player) => {
    if (!uid) return;
    const targetUid = player.uid ?? player.id;
    setLocalBlockedUids((prev) => new Set([...prev, targetUid]));
    try {
      await blockUser(uid, targetUid);
    } catch (err) {
      setLocalBlockedUids((prev) => { const s = new Set(prev); s.delete(targetUid); return s; });
      Alert.alert('Hata', 'Engelleme başarısız: ' + err.message);
    }
  }, [uid]);

  const handleReport = useCallback(async (player, reason) => {
    if (!uid) return;
    try {
      await reportUser(uid, player.uid ?? player.id, reason);
    } catch (err) {
      console.warn('[Report] failed:', err.message);
    }
  }, [uid]);

  const handleAddFriend = useCallback(async (player) => {
    if (!uid) return;
    const targetUid = player.uid ?? player.id;
    try {
      const result = await sendFriendRequest(uid, targetUid);
      if (result?.autoAccepted) {
        Alert.alert('Arkadaş!', `${player.username} ile artık arkadaşsınız! 🎉`);
      } else if (!result?.alreadyFriends) {
        Alert.alert('İstek Gönderildi', `${player.username} adlı oyuncuya arkadaşlık isteği gönderildi.`);
      }
    } catch (err) {
      console.warn('[AddFriend] failed:', err.message);
    }
  }, [uid]);

  const handleInvite = useCallback(async (player) => {
    if (!uid) return;

    const myGameIds = userProfile?.gameIds ?? userProfile?.games?.map((g) => g.gameId) ?? [];
    if (!myGameIds.includes(player.gameId)) {
      Alert.alert(
        'Oyun Eşleşmedi',
        'Bu oyunu profiline eklemeden davet gönderemezsin.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Profile Git', onPress: () => navigation.navigate('Profile') },
        ]
      );
      return;
    }

    try {
      const requestId = await sendMatchRequest(uid, player.uid, player.gameId);
      setInvitedUids((prev) => new Set([...prev, player.uid]));

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
      Alert.alert('Error', 'Failed to send invite. Please try again.\n' + err.message);
    }
  }, [uid, userProfile]);

  const handleViewProfile = useCallback((player) => {
    navigation.navigate('PlayerProfile', { player });
  }, [navigation]);

  const renderPlayer = useCallback(({ item }) => (
    <PlayerCard
      player={item}
      onInvite={handleInvite}
      isInvited={invitedUids.has(item.uid)}
      onBlock={handleBlock}
      onReport={handleReport}
      onAddFriend={handleAddFriend}
      onViewProfile={handleViewProfile}
      isFriend={friendUids.has(item.uid)}
      isPendingFriend={pendingFriendUids.has(item.uid)}
    />
  ), [handleInvite, invitedUids, handleBlock, handleReport, handleAddFriend, handleViewProfile, friendUids, pendingFriendUids]);

  // _cardKey is uid_gameId for real users (one card per game), or uid for seeds
  const keyExtractor = useCallback((item) => item._cardKey ?? item.uid ?? item.id, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KADRO BUL</Text>
          <Text style={styles.headerCount}>
            {filteredPlayers.length} <Text style={styles.headerCountSub}>OYUNCU BULUNDU</Text>
          </Text>
        </View>

        {/* Game filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScrollGame}
        >
          <FilterChip
            label="TÜMÜ"
            emoji="🎮"
            active={activeGame === 'all'}
            color={COLORS.primary}
            onPress={() => { setActiveGame('all'); setActiveRank('all'); }}
          />
          {GAMES.map((game) => (
            <FilterChip
              key={game.id}
              label={game.name.split(' ')[0].toUpperCase()}
              emoji={game.emoji}
              active={activeGame === game.id}
              color={game.color}
              onPress={() => handleSetGame(game.id)}
            />
          ))}
        </ScrollView>

        {/* Rank filter chips — sadece bir oyun seçiliyken göster */}
        {selectedGameDef && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.chipScrollRank}
          >
            <FilterChip
              label="TÜM RANKLAR"
              emoji="🏆"
              active={activeRank === 'all'}
              color={selectedGameDef.color}
              onPress={() => setActiveRank('all')}
            />
            {selectedGameDef.ranks.map((rank) => (
              <FilterChip
                key={rank}
                label={rank.toUpperCase()}
                active={activeRank === rank}
                color={selectedGameDef.color}
                onPress={() => setActiveRank(activeRank === rank ? 'all' : rank)}
              />
            ))}
          </ScrollView>
        )}

        {/* Grup boyutu filtresi */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScrollRank}
        >
          <FilterChip
            label="TÜMÜ"
            emoji="👾"
            active={activeLookingFor === 'all'}
            color={COLORS.primary}
            onPress={() => setActiveLookingFor('all')}
          />
          {GROUP_SIZES.map((gs) => (
            <FilterChip
              key={gs.id}
              label={gs.label}
              emoji={gs.emoji}
              active={activeLookingFor === gs.id}
              color={COLORS.secondary ?? COLORS.primary}
              onPress={() => setActiveLookingFor(activeLookingFor === gs.id ? 'all' : gs.id)}
            />
          ))}
        </ScrollView>

        {/* Vibe + Online Only */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScrollVibe}
        >
          <FilterChip
            label="ÇEVRİMİÇİ"
            emoji="🟢"
            active={onlineOnly}
            color={COLORS.success}
            onPress={() => setOnlineOnly((v) => !v)}
          />
          <FilterChip
            label="TÜM VİBE"
            emoji="✨"
            active={activeVibe === 'all'}
            color={COLORS.secondary}
            onPress={() => setActiveVibe('all')}
          />
          {VIBES.map((vibe) => (
            <FilterChip
              key={vibe.id}
              label={vibe.label.toUpperCase()}
              emoji={vibe.emoji}
              active={activeVibe === vibe.id}
              color={vibe.color}
              onPress={() => setActiveVibe(activeVibe === vibe.id ? 'all' : vibe.id)}
            />
          ))}
        </ScrollView>

        {/* Oynama Zamanı filtresi */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScrollRank}
        >
          <FilterChip
            label="TÜM ZAMAN"
            emoji="🕐"
            active={activePlayTime === 'all'}
            color={COLORS.primary}
            onPress={() => setActivePlayTime('all')}
          />
          {PLAY_TIMES.map((pt) => (
            <FilterChip
              key={pt.id}
              label={pt.label.toUpperCase()}
              emoji={pt.emoji}
              active={activePlayTime === pt.id}
              color={pt.color}
              onPress={() => setActivePlayTime(activePlayTime === pt.id ? 'all' : pt.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.divider} />
      </SafeAreaView>

      {isLoadingPlayers && !refreshing ? (
        <View style={styles.shimmerList}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerCard.PlayerCard key={i} />
          ))}
        </View>
      ) : playersError ? (
        <ErrorState message={playersError} onRetry={refreshPlayers} />
      ) : filteredPlayers.length === 0 ? (
        <EmptyState activeGame={activeGame} activeVibe={activeVibe} />
      ) : (
        <FlatList
          data={filteredPlayers}
          renderItem={renderPlayer}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}

      <BannerAd />
    </View>
  );
}

// ── Filter Chip ───────────────────────────────────────────────────────────────

function FilterChip({ label, emoji, active, color, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: `${color}25`, borderColor: `${color}88` }
          : { backgroundColor: COLORS.surface, borderColor: COLORS.border },
      ]}
    >
      <Text style={styles.chipEmoji}>{emoji}</Text>
      <Text style={[styles.chipLabel, active && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Empty / Error states ──────────────────────────────────────────────────────

function EmptyState({ activeGame, activeVibe }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>NO PLAYERS FOUND</Text>
      <Text style={styles.emptyDesc}>
        {activeGame !== 'all' || activeVibe !== 'all'
          ? 'Try removing some filters to see more players.'
          : 'No players available right now. Pull to refresh.'}
      </Text>
    </View>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⚠️</Text>
      <Text style={styles.emptyTitle}>CONNECTION ERROR</Text>
      <Text style={styles.emptyDesc}>{message}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
        <Text style={styles.retryText}>RETRY</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontFamily: FONTS.orbitron.extraBold,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  headerCount: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  headerCountSub: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  chipScrollGame: { maxHeight: 48 },
  chipScrollRank: { maxHeight: 44 },
  chipScrollVibe: { maxHeight: 44 },
  chipRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  chipEmoji: { fontSize: 13 },
  chipLabel: {
    fontFamily: FONTS.rajdhani.semiBold,
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginTop: 4 },
  shimmerList: { padding: SPACING.md },
  list: { padding: SPACING.md, paddingBottom: SPACING.xl },
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
  retryBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryDim,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retryText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 12,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
});
