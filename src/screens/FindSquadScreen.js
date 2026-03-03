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
import { GAMES, VIBES } from '../constants/games';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { sendMatchRequest } from '../services/firestoreService';
import { seedProfileService } from '../services/seedProfileService';
import PlayerCard from '../components/PlayerCard';
import ShimmerCard from '../components/ShimmerCard';
import BannerAd from '../components/BannerAd';

export default function FindSquadScreen({ route }) {
  const { uid } = useAuth();
  const { players, isLoadingPlayers, playersError, refreshPlayers } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const initGame = route?.params?.filterGame ?? 'all';
  const initVibe = route?.params?.filterVibe ?? 'all';
  const [activeGame, setActiveGame] = useState(initGame);
  const [activeVibe, setActiveVibe] = useState(initVibe);

  // Track invited player UIDs
  const [invitedUids, setInvitedUids] = useState(new Set());

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (activeGame !== 'all' && p.gameId !== activeGame) return false;
      if (activeVibe !== 'all' && p.vibe !== activeVibe) return false;
      return true;
    });
  }, [players, activeGame, activeVibe]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPlayers();
    setRefreshing(false);
  }, [refreshPlayers]);

  const handleInvite = useCallback(async (player) => {
    if (!uid) return;
    try {
      const requestId = await sendMatchRequest(uid, player.uid, player.gameId);
      setInvitedUids((prev) => new Set([...prev, player.uid]));

      // If it's a seed profile, trigger auto-decline
      if (player.isSeed) {
        seedProfileService.handleSeedInvite(requestId);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send invite. Please try again.\n' + err.message);
    }
  }, [uid]);

  const renderPlayer = useCallback(({ item }) => (
    <PlayerCard
      player={item}
      onInvite={handleInvite}
      isInvited={invitedUids.has(item.uid)}
    />
  ), [handleInvite, invitedUids]);

  const keyExtractor = useCallback((item) => item.uid ?? item.id, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FIND SQUAD</Text>
          <Text style={styles.headerCount}>
            {filteredPlayers.length} <Text style={styles.headerCountSub}>PLAYERS FOUND</Text>
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
            label="ALL"
            emoji="🎮"
            active={activeGame === 'all'}
            color={COLORS.primary}
            onPress={() => setActiveGame('all')}
          />
          {GAMES.map((game) => (
            <FilterChip
              key={game.id}
              label={game.name.split(' ')[0].toUpperCase()}
              emoji={game.emoji}
              active={activeGame === game.id}
              color={game.color}
              onPress={() => setActiveGame(activeGame === game.id ? 'all' : game.id)}
            />
          ))}
        </ScrollView>

        {/* Vibe filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScrollVibe}
        >
          <FilterChip
            label="ALL VIBES"
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
