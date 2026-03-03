import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { VIBES, getGame } from '../constants/games';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getUserStats, updateUser } from '../services/firestoreService';
import VibeBadge from '../components/VibeBadge';
import HexButton from '../components/HexButton';

export default function ProfileScreen() {
  const { uid, userProfile, signOut, refreshProfile } = useAuth();
  const { requests } = useApp();
  const [stats, setStats] = useState({ total: 0, accepted: 0, acceptanceRate: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const [editingVibe, setEditingVibe] = useState(false);
  const [savingVibe, setSavingVibe] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState(userProfile?.vibe ?? 'chill');

  useEffect(() => {
    if (!uid) return;
    setLoadingStats(true);
    getUserStats(uid)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [uid, requests.length]);

  useEffect(() => {
    if (userProfile?.vibe) setSelectedVibe(userProfile.vibe);
  }, [userProfile]);

  const handleSaveVibe = async () => {
    setSavingVibe(true);
    try {
      await updateUser(uid, { vibe: selectedVibe });
      await refreshProfile();
      setEditingVibe(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update vibe. ' + err.message);
    } finally {
      setSavingVibe(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure? Your profile will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ],
    );
  };

  const joinDate = userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'Recently';

  const favoriteGame = (() => {
    if (!userProfile?.games?.length) return null;
    const sentByGame = {};
    requests
      .filter((r) => r.fromUid === uid)
      .forEach((r) => { sentByGame[r.gameId] = (sentByGame[r.gameId] ?? 0) + 1; });
    const topGame = Object.entries(sentByGame).sort((a, b) => b[1] - a[1])[0];
    return getGame(topGame?.[0] ?? userProfile.games[0].gameId);
  })();

  if (!userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROFILE</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile hero card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(0,255,209,0.08)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['#00FFD1', '#0094FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>
                {userProfile.username?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          </LinearGradient>
          <Text style={styles.username}>{userProfile.username}</Text>
          <Text style={styles.joinDate}>JOINED {joinDate.toUpperCase()}</Text>
          <VibeBadge vibeId={userProfile.vibe} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox value={loadingStats ? '—' : stats.total} label="INVITES SENT" color={COLORS.secondary} />
          <StatBox value={loadingStats ? '—' : stats.accepted} label="ACCEPTED" color={COLORS.success} />
          <StatBox value={loadingStats ? '—' : `${stats.acceptanceRate}%`} label="ACCEPT RATE" color={COLORS.primary} />
        </View>

        {/* Favorite game */}
        {favoriteGame && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FAVORITE GAME</Text>
            <View style={[styles.favoriteCard, { borderColor: `${favoriteGame.color}55` }]}>
              <LinearGradient
                colors={[`${favoriteGame.color}15`, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.accentBar, { backgroundColor: favoriteGame.color }]} />
              <Text style={styles.favoriteEmoji}>{favoriteGame.emoji}</Text>
              <Text style={[styles.favoriteName, { color: favoriteGame.color }]}>{favoriteGame.name}</Text>
            </View>
          </View>
        )}

        {/* My games */}
        {userProfile.games?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MY GAMES & RANKS</Text>
            {userProfile.games.map((g, i) => {
              const game = getGame(g.gameId);
              if (!game) return null;
              return (
                <View key={i} style={[styles.gameItem, { borderColor: `${game.color}44` }]}>
                  <View style={[styles.accentBar, { backgroundColor: game.color }]} />
                  <Text style={styles.gameItemEmoji}>{game.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gameItemName}>{game.name}</Text>
                    <Text style={[styles.gameItemRank, { color: game.color }]}>{g.rank}</Text>
                  </View>
                  <View style={styles.regionBadge}>
                    <Text style={styles.regionText}>{g.region}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Edit vibe */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PLAYSTYLE VIBE</Text>
            {!editingVibe && (
              <TouchableOpacity onPress={() => setEditingVibe(true)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>CHANGE</Text>
              </TouchableOpacity>
            )}
          </View>

          {editingVibe ? (
            <View style={{ gap: SPACING.sm }}>
              {VIBES.map((vibe) => {
                const isSelected = selectedVibe === vibe.id;
                return (
                  <TouchableOpacity
                    key={vibe.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedVibe(vibe.id)}
                    style={[
                      styles.vibeOption,
                      isSelected && { borderColor: vibe.color, backgroundColor: `${vibe.color}15` },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{vibe.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.vibeLabel, isSelected && { color: vibe.color }]}>{vibe.label}</Text>
                      <Text style={styles.vibeSub}>{vibe.sublabel}</Text>
                    </View>
                    {isSelected && <View style={[styles.selectedDot, { backgroundColor: vibe.color }]} />}
                  </TouchableOpacity>
                );
              })}
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs }}>
                <TouchableOpacity onPress={() => setEditingVibe(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <HexButton
                    label="SAVE VIBE"
                    onPress={handleSaveVibe}
                    loading={savingVibe}
                    disabled={selectedVibe === userProfile.vibe}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.currentVibe}>
              <VibeBadge vibeId={userProfile.vibe} />
              <Text style={styles.vibeHint}>Tap CHANGE to update your playstyle</Text>
            </View>
          )}
        </View>

        {/* Sign out */}
        <View style={[styles.section, { marginTop: SPACING.lg, marginBottom: SPACING.xxl }]}>
          <HexButton label="SIGN OUT" onPress={handleSignOut} variant="outline" />
        </View>
      </ScrollView>
    </View>
  );
}

function StatBox({ value, label, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatDate(ts) {
  try {
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontFamily: FONTS.orbitron.extraBold,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  scrollContent: { padding: SPACING.lg },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.orbitron.black,
    fontSize: 32,
    color: COLORS.primary,
  },
  username: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  joinDate: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 20,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textAlign: 'center',
  },
  section: { gap: SPACING.sm, marginBottom: SPACING.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: FONTS.orbitron.semiBold,
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  editBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.primaryDim,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: `${COLORS.primary}55`,
  },
  editBtnText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  favoriteEmoji: { fontSize: 28, marginLeft: 10 },
  favoriteName: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  gameItemEmoji: { fontSize: 20, marginLeft: 10 },
  gameItemName: {
    fontFamily: FONTS.rajdhani.semiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  gameItemRank: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 12,
  },
  regionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
  },
  regionText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  currentVibe: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  vibeHint: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },
  vibeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  vibeLabel: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  vibeSub: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  selectedDot: { width: 8, height: 8, borderRadius: 4 },
  cancelBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  cancelBtnText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
});
